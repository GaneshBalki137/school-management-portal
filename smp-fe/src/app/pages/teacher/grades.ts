import { Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Api, Load } from '../../core/api';
import { average, currentSemester, fullName, gradeTone, letterGrade } from '../../core/format';
import { GradeRow, TeacherSubject } from '../../core/models';
import { HasUnsavedChanges } from '../../core/session';
import { Confirm, Toasts } from '../../core/ui';
import { LoadState } from '../../core/widgets';

const FIELDS = [
  { key: 'quiz_grade', label: 'Quiz' },
  { key: 'homework_grade', label: 'Homework' },
  { key: 'test_grade', label: 'Test' },
  { key: 'project_grade', label: 'Project' },
] as const;
type Field = (typeof FIELDS)[number]['key'];
type Marks = Record<Field, number | null>;

const marksOf = (r: GradeRow): Marks => ({
  quiz_grade: r.quiz_grade,
  homework_grade: r.homework_grade,
  test_grade: r.test_grade,
  project_grade: r.project_grade,
});

@Component({
  imports: [LoadState],
  host: { '(window:beforeunload)': 'warnBeforeUnload($event)' },
  template: `
    <header class="page-head">
      <div>
        <h1>Gradebook</h1>
        <p class="sub">Enter marks out of 100. Leave a box empty if that assessment hasn't happened yet.</p>
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
          <span>Semester</span>
          <select (change)="go({ semester: $any($event.target).value }, $event)">
            <option value="1" [selected]="sem() === 1">Semester 1 (Jun–Nov)</option>
            <option value="2" [selected]="sem() === 2">Semester 2 (Dec–May)</option>
          </select>
        </label>
        <span class="spacer"></span>
        @if (classAverage() !== null) {
          <span class="small">Class average <span class="badge" [attr.data-tone]="tone(classAverage())">{{ classAverage() }}</span></span>
        }
      </div>

      <app-load-state [of]="grades" />
      @if (grades.value(); as rows) {
        <form (submit)="save($event)">
          <div class="card flush">
            <div class="table-wrap">
              <table class="table gradebook">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    @for (f of fields; track f.key) { <th scope="col" class="num">{{ f.label }}</th> }
                    <th scope="col" class="num">Average</th>
                    <th scope="col">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of rows; track r.student_id) {
                    @let m = marks().get(r.student_id)!;
                    @let avg = rowAverage(m);
                    <tr>
                      <th scope="row">{{ name(r) }}</th>
                      @for (f of fields; track f.key) {
                        <td class="num">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            inputmode="numeric"
                            class="mark"
                            [class.changed]="m[f.key] !== r[f.key]"
                            [value]="m[f.key] ?? ''"
                            (input)="set(r.student_id, f.key, $any($event.target).value)"
                            [attr.aria-label]="f.label + ' mark for ' + name(r)"
                          />
                        </td>
                      }
                      <td class="num strong">{{ avg ?? '—' }}</td>
                      <td><span class="badge" [attr.data-tone]="tone(avg)">{{ letter(avg) }}</span></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" class="empty">There are no students in this class yet.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div class="sticky-actions">
            @if (dirty()) { <span class="small"><i class="bi bi-circle-fill unsaved-dot"></i> {{ changed().length }} {{ changed().length === 1 ? 'student' : 'students' }} changed</span> }
            <span class="spacer"></span>
            <button type="button" class="btn ghost" (click)="undo()" [disabled]="!dirty() || busy()">Undo changes</button>
            <button class="btn primary" [disabled]="!dirty() || busy()">
              @if (busy()) { <span class="spinner"></span> } Save marks
            </button>
          </div>
        </form>
      }
    }
  `,
})
export default class Grades implements HasUnsavedChanges {
  private api = inject(Api);
  private router = inject(Router);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);
  readonly subject = input<string>();
  readonly semester = input<string>();
  protected readonly fields = FIELDS;
  protected readonly name = fullName;
  protected readonly tone = gradeTone;
  protected readonly letter = letterGrade;
  protected readonly subjects = new Load(() => this.api.get<TeacherSubject[]>('/teacher/subjects'));
  protected readonly subjectId = computed(() => Number(this.subject()) || this.subjects.value()?.[0]?.subject_id);
  protected readonly sem = computed(() => Number(this.semester()) || currentSemester());
  protected readonly grades = new Load(() =>
    this.api.get<GradeRow[]>('/teacher/grades', { subject_id: this.subjectId(), semester: this.sem() }),
  );
  private readonly saved = computed(() => new Map((this.grades.value() ?? []).map((r) => [r.student_id, marksOf(r)])));
  /** The marks on screen; resets whenever the gradebook reloads. */
  protected readonly marks = linkedSignal(() => this.saved());
  protected readonly busy = signal(false);

  protected readonly changed = computed(() =>
    (this.grades.value() ?? []).filter((r) => {
      const m = this.marks().get(r.student_id)!;
      return FIELDS.some((f) => m[f.key] !== r[f.key]);
    }),
  );
  readonly dirty = computed(() => this.changed().length > 0);
  protected readonly classAverage = computed(() =>
    average([...this.marks().values()].map((m) => this.rowAverage(m))),
  );

  constructor() {
    void this.subjects.run();
    effect(() => {
      if (!this.subjectId()) return;
      this.sem();
      untracked(() => void this.grades.run());
    });
  }

  protected rowAverage(m: Marks) {
    return average(FIELDS.map((f) => m[f.key]));
  }

  protected set(studentId: number, field: Field, raw: string) {
    // Only whole numbers 0-100 are kept; anything else is left for the browser to flag on save.
    const n = raw === '' ? null : Number(raw);
    const value = n === null || (Number.isInteger(n) && n >= 0 && n <= 100) ? n : undefined;
    if (value === undefined) return;
    this.marks.update((all) => new Map(all).set(studentId, { ...all.get(studentId)!, [field]: value }));
  }

  protected undo() {
    this.marks.set(this.saved());
  }

  protected async go(params: Record<string, string>, e: Event) {
    if (this.dirty()) {
      const leave = await this.confirm.ask({
        title: 'Switch without saving?',
        message: 'The marks you entered here have not been saved yet. Switching now will discard them.',
        action: 'Discard and switch',
        danger: true,
      });
      if (!leave) {
        (e.target as HTMLSelectElement).value = String('subject' in params ? this.subjectId() : this.sem());
        return;
      }
    }
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected async save(e: Event) {
    e.preventDefault();
    const records = this.changed().map((r) => ({ student_id: r.student_id, ...this.marks().get(r.student_id)! }));
    this.busy.set(true);
    try {
      await this.api.put('/teacher/grades', { subject_id: this.subjectId(), semester: this.sem(), records });
      this.toasts.success(`Marks saved for ${records.length} ${records.length === 1 ? 'student' : 'students'}.`);
      await this.grades.run();
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
