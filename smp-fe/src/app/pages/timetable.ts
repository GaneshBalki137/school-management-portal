import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, errorText, Load, reloadOn } from '../core/api';
import { CLASSES, DAYS, hourLabel, isoDow } from '../core/format';
import { Slot, Subject } from '../core/models';
import { Session } from '../core/session';
import { submitted, Toasts } from '../core/ui';
import { Dialog, LoadState } from '../core/widgets';

interface Cell {
  day: number;
  hour: number;
  slot?: Slot;
}

/** A stable colour per subject name, so "Mathematics" looks the same everywhere. */
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

@Component({
  imports: [Dialog, LoadState, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>{{ role() === 'teacher' ? 'My timetable' : 'Timetable' }}</h1>
        <p class="sub">
          @switch (role()) {
            @case ('admin') { Plan each class's week. Click a period to add, change or clear a lecture. }
            @case ('teacher') { Your lectures across all classes this week. }
            @default { Your class's lectures this week. }
          }
        </p>
      </div>
    </header>

    @if (role() === 'admin') {
      <nav class="chips" aria-label="Choose a class">
        @for (c of classes; track c) {
          <button type="button" class="chip" [attr.aria-pressed]="c === classId()" (click)="pickClass(c)">Class {{ c }}</button>
        }
      </nav>
      @if (subjects.value()?.length === 0) {
        <div class="alert" data-tone="info">
          <i class="bi bi-info-circle"></i>
          <span>Class {{ classId() }} has no subjects yet. <a routerLink="/admin/subjects">Add subjects</a> before building its timetable.</span>
        </div>
      }
    }

    <app-load-state [of]="slots" />
    @if (slots.value()) {
      <div class="card flush">
        <div class="table-wrap">
          <table class="tt">
            <caption class="sr-only">Weekly timetable</caption>
            <thead>
              <tr>
                <th scope="col"><span class="sr-only">Time</span></th>
                @for (d of days; track $index) {
                  <th scope="col" [class.today]="$index + 1 === today">
                    {{ d }}
                    @if ($index + 1 === today) { <span class="badge" data-tone="blue">Today</span> }
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of grid(); track row.hour) {
                <tr>
                  <th scope="row">{{ hourLabel(row.hour) }}</th>
                  @for (cell of row.cells; track cell.day) {
                    <td [class.today]="cell.day === today">
                      @if (role() === 'admin') {
                        <button
                          type="button"
                          class="tt-cell"
                          [class.filled]="cell.slot"
                          [style.--hue]="cell.slot ? hue(cell.slot.subject_name) : null"
                          (click)="edit(cell)"
                          [attr.aria-label]="label(cell)"
                        >
                          @if (cell.slot; as s) {
                            <strong>{{ s.subject_name }}</strong>
                            <small>{{ s.teacher_name ?? 'No teacher' }}</small>
                          } @else {
                            <i class="bi bi-plus"></i>
                          }
                        </button>
                      } @else if (cell.slot; as s) {
                        <div class="tt-cell filled" [style.--hue]="hue(s.subject_name)">
                          <strong>{{ s.subject_name }}</strong>
                          <small>{{ role() === 'teacher' ? 'Class ' + s.class_id : (s.teacher_name ?? 'Teacher to be assigned') }}</small>
                        </div>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      @if (slots.value()?.length === 0 && role() !== 'admin') {
        <p class="muted center">No lectures have been scheduled yet.</p>
      }
    }

    <app-dialog [heading]="editHeading()" [open]="!!editing()" (closed)="editing.set(null)">
      @if (editing(); as cell) {
        <form (submit)="save($event)">
          <div class="dialog-body">
            <label class="field">
              <span>Lecture</span>
              <select name="subject_id" autofocus>
                <option value="">Free period (no lecture)</option>
                @for (s of subjects.value() ?? []; track s.subject_id) {
                  <option [value]="s.subject_id" [selected]="s.subject_id === cell.slot?.subject_id">
                    {{ s.subject_name }} — {{ s.teacher_name ?? 'no teacher yet' }}
                  </option>
                }
              </select>
            </label>
            <p class="small muted">If the teacher is already teaching another class at this time, you'll be told before anything is saved.</p>
            @if (formError()) {
              <div class="alert" data-tone="danger" role="alert"><i class="bi bi-exclamation-octagon"></i> {{ formError() }}</div>
            }
          </div>
          <footer class="dialog-foot">
            <button type="button" class="btn ghost" (click)="editing.set(null)">Cancel</button>
            <button class="btn primary" [disabled]="busy()">Save</button>
          </footer>
        </form>
      }
    </app-dialog>
  `,
})
export default class Timetable {
  private api = inject(Api);
  private router = inject(Router);
  private toasts = inject(Toasts);
  private session = inject(Session);
  /** Admin only: which class to show, from `?class=`. */
  readonly class = input<string>();
  protected readonly role = computed(() => this.session.user()?.role);
  protected readonly classId = computed(() => Number(this.class()) || 1);
  protected readonly slots = new Load(() =>
    this.api.get<Slot[]>(`/${this.role()}/timetable`, { class_id: this.role() === 'admin' ? this.classId() : null }),
  );
  protected readonly subjects = new Load(() => this.api.get<Subject[]>('/admin/subjects', { class_id: this.classId() }));
  protected readonly editing = signal<Cell | null>(null);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected readonly classes = CLASSES;
  protected readonly days = DAYS;
  protected readonly today = isoDow();
  protected readonly hourLabel = hourLabel;
  protected readonly hue = hue;

  /** School hours 8 AM to 3 PM, stretched to fit any lecture scheduled outside them. */
  protected readonly grid = computed(() => {
    const slots = this.slots.value() ?? [];
    const hours = slots.map((s) => s.start_hour);
    const [from, to] = [Math.min(8, ...hours), Math.max(15, ...hours)];
    const at = new Map(slots.map((s) => [`${s.day_of_week}-${s.start_hour}`, s]));
    return Array.from({ length: to - from + 1 }, (_, i) => {
      const hour = from + i;
      return { hour, cells: DAYS.map((_, d) => ({ day: d + 1, hour, slot: at.get(`${d + 1}-${hour}`) })) };
    });
  });

  protected readonly editHeading = computed(() => {
    const c = this.editing();
    return c ? `Class ${this.classId()} · ${DAYS[c.day - 1]}, ${hourLabel(c.hour)}` : '';
  });

  constructor() {
    reloadOn(this.slots, () => this.classId());
    if (this.role() === 'admin') reloadOn(this.subjects, () => this.classId());
  }

  protected pickClass(c: number) {
    void this.router.navigate([], { queryParams: { class: c }, replaceUrl: true });
  }

  protected label(cell: Cell) {
    const when = `${DAYS[cell.day - 1]} ${hourLabel(cell.hour)}`;
    return cell.slot ? `${when}: ${cell.slot.subject_name}. Change` : `${when}: free. Add a lecture`;
  }

  protected edit(cell: Cell) {
    this.formError.set('');
    this.editing.set(cell);
  }

  protected async save(e: Event) {
    const cell = this.editing()!;
    const subjectId = Number(submitted(e)['subject_id']) || null;
    if (subjectId === (cell.slot?.subject_id ?? null)) {
      this.editing.set(null);
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      if (subjectId) {
        const body = { class_id: this.classId(), day_of_week: cell.day, start_hour: cell.hour, subject_id: subjectId };
        await this.api.put('/admin/timetable', body);
      } else {
        await this.api.delete(`/admin/timetable/${cell.slot!.timetable_id}`);
      }
      this.toasts.success(subjectId ? 'Lecture saved.' : 'Period cleared.');
      this.editing.set(null);
      void this.slots.run();
    } catch (err) {
      this.formError.set(errorText(err));
    } finally {
      this.busy.set(false);
    }
  }
}
