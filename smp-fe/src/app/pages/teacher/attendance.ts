import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Api, Load } from '../../core/api';
import { fullName, todayIso } from '../../core/format';
import { RosterRow, Status, TeacherSubject } from '../../core/models';
import { HasUnsavedChanges } from '../../core/session';
import { Confirm, Toasts } from '../../core/ui';
import { LoadState } from '../../core/widgets';

const STATUSES: { value: Status; label: string }[] = [
  { value: 'P', label: 'Present' },
  { value: 'L', label: 'Late' },
  { value: 'A', label: 'Absent' },
];

@Component({
  imports: [DatePipe, LoadState],
  host: { '(window:beforeunload)': 'warnBeforeUnload($event)' },
  template: `
    <header class="page-head">
      <div>
        <h1>Take attendance</h1>
        <p class="sub">Mark each student, then save. You can come back and correct a day at any time.</p>
      </div>
    </header>

    <app-load-state [of]="subjects" />
    @if (subjects.value()?.length === 0) {
      <div class="card empty"><i class="bi bi-journal-x"></i><p>You have no subjects yet. The school office assigns subjects to teachers.</p></div>
    } @else if (subjects.value(); as list) {
      <div class="toolbar">
        <label class="field inline">
          <span>Subject</span>
          <select (change)="go({ subject: $any($event.target).value }, $event)">
            @for (s of list; track s.subject_id) {
              <option [value]="s.subject_id" [selected]="s.subject_id === subjectId()">Class {{ s.class_id }} · {{ s.subject_name }}</option>
            }
          </select>
        </label>
        <label class="field inline">
          <span>Date</span>
          <input type="date" [max]="today" [value]="day()" (change)="go({ date: $any($event.target).value || today }, $event)" />
        </label>
        <span class="spacer"></span>
        <button type="button" class="btn" (click)="markAll('P')" [disabled]="!roster.value()?.length"><i class="bi bi-check2-all"></i> Mark all present</button>
      </div>

      <app-load-state [of]="roster" />
      @if (roster.value(); as rows) {
        <div class="summary-bar" aria-live="polite">
          <span class="badge" data-tone="green">{{ count().P }} present</span>
          <span class="badge" data-tone="amber">{{ count().L }} late</span>
          <span class="badge" data-tone="red">{{ count().A }} absent</span>
          @if (rows.length - marks().size; as left) { <span class="badge">{{ left }} not marked</span> }
          <span class="spacer"></span>
          <span class="small muted">{{ day() | date: 'fullDate' }}</span>
        </div>

        <div class="card flush">
          <ul class="roster">
            @for (r of rows; track r.student_id) {
              <li>
                <span class="grow"><strong>{{ name(r) }}</strong>
                  @if (r.status && marks().get(r.student_id) !== r.status) { <small class="muted"> · changed</small> }
                </span>
                <span class="segmented" role="radiogroup" [attr.aria-label]="'Attendance for ' + name(r)">
                  @for (s of statuses; track s.value) {
                    <label [attr.data-status]="s.value">
                      <input type="radio" [name]="'s' + r.student_id" [value]="s.value" [checked]="marks().get(r.student_id) === s.value" (change)="mark(r.student_id, s.value)" />
                      <span>{{ s.label }}</span>
                    </label>
                  }
                </span>
              </li>
            } @empty {
              <li class="empty">There are no students in this class yet.</li>
            }
          </ul>
        </div>

        <div class="sticky-actions">
          @if (dirty()) { <span class="small"><i class="bi bi-circle-fill unsaved-dot"></i> Unsaved changes</span> }
          <span class="spacer"></span>
          <button type="button" class="btn ghost" (click)="undo()" [disabled]="!dirty() || busy()">Undo changes</button>
          <button type="button" class="btn primary" (click)="save()" [disabled]="!dirty() || busy()">
            @if (busy()) { <span class="spinner"></span> } Save attendance
          </button>
        </div>
      }
    }
  `,
})
export default class Attendance implements HasUnsavedChanges {
  private api = inject(Api);
  private router = inject(Router);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);
  readonly subject = input<string>();
  readonly date = input<string>();
  protected readonly today = todayIso();
  protected readonly statuses = STATUSES;
  protected readonly name = fullName;
  protected readonly subjects = new Load(() => this.api.get<TeacherSubject[]>('/teacher/subjects'));
  protected readonly subjectId = computed(() => Number(this.subject()) || this.subjects.value()?.[0]?.subject_id);
  protected readonly day = computed(() => (this.date() && this.date()! <= this.today ? this.date()! : this.today));
  protected readonly roster = new Load(() =>
    this.api.get<RosterRow[]>('/teacher/attendance', { subject_id: this.subjectId(), date: this.day() }),
  );
  private readonly saved = computed(
    () => new Map((this.roster.value() ?? []).filter((r) => r.status).map((r) => [r.student_id, r.status!])),
  );
  /** The marks on screen; starts as what's saved and resets whenever the roster reloads. */
  protected readonly marks = linkedSignal(() => this.saved());
  protected readonly busy = signal(false);

  protected readonly count = computed(() => {
    const c = { P: 0, L: 0, A: 0 };
    for (const s of this.marks().values()) c[s]++;
    return c;
  });

  readonly dirty = computed(() => (this.roster.value() ?? []).some((r) => (this.marks().get(r.student_id) ?? null) !== r.status));

  constructor() {
    void this.subjects.run();
    effect(() => {
      if (!this.subjectId()) return;
      this.day();
      untracked(() => void this.roster.run());
    });
  }

  protected mark(studentId: number, status: Status) {
    this.marks.update((m) => new Map(m).set(studentId, status));
  }

  protected markAll(status: Status) {
    this.marks.set(new Map((this.roster.value() ?? []).map((r) => [r.student_id, status])));
  }

  protected undo() {
    this.marks.set(this.saved());
  }

  protected async go(params: Record<string, string>, e: Event) {
    if (this.dirty()) {
      const leave = await this.confirm.ask({
        title: 'Switch without saving?',
        message: 'The attendance you marked here has not been saved yet. Switching now will discard it.',
        action: 'Discard and switch',
        danger: true,
      });
      if (!leave) {
        // Put the picker back to what is still on screen.
        const el = e.target as HTMLInputElement | HTMLSelectElement;
        el.value = String('subject' in params ? this.subjectId() : this.day());
        return;
      }
    }
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected async save() {
    const records = [...this.marks()].map(([student_id, status]) => ({ student_id, status }));
    const subject = this.subjects.value()?.find((s) => s.subject_id === this.subjectId());
    this.busy.set(true);
    try {
      await this.api.put('/teacher/attendance', { subject_id: this.subjectId(), date: this.day(), records });
      this.toasts.success(`Attendance saved for Class ${subject?.class_id} ${subject?.subject_name}.`);
      await this.roster.run();
    } catch (err) {
      this.toasts.error(err);
    } finally {
      this.busy.set(false);
    }
  }

  protected warnBeforeUnload(e: BeforeUnloadEvent) {
    if (this.dirty()) e.preventDefault();
  }
}
