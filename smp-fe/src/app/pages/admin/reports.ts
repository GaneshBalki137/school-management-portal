import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, Load } from '../../core/api';
import { attendanceTone, CLASSES, currentSemester, gradeTone, letterGrade } from '../../core/format';
import { ReportCard } from '../../core/models';
import { LoadState, ReportCardView } from '../../core/widgets';

interface ClassReport {
  subjects: { subject_id: number; subject_name: string; teacher_name: string | null; average: number | null; graded: number }[];
  students: { student_id: number; name: string; average: number | null; attendance: number | null }[];
}

@Component({
  imports: [LoadState, ReportCardView, RouterLink],
  template: `
    <header class="page-head no-print">
      <div>
        <h1>Reports</h1>
        <p class="sub">Class results and individual report cards.</p>
      </div>
    </header>

    <div class="toolbar no-print">
      <label class="field inline">
        <span>Class</span>
        <select (change)="go({ class: $any($event.target).value, student: null })">
          @for (c of classes; track c) { <option [value]="c" [selected]="c === classId()">Class {{ c }}</option> }
        </select>
      </label>
      <label class="field inline">
        <span>Semester</span>
        <select (change)="go({ semester: $any($event.target).value })">
          <option value="1" [selected]="semester() === 1">Semester 1 (Jun–Nov)</option>
          <option value="2" [selected]="semester() === 2">Semester 2 (Dec–May)</option>
        </select>
      </label>
    </div>

    @if (studentId()) {
      <div class="toolbar no-print">
        <a class="btn ghost" [routerLink]="[]" [queryParams]="{ student: null }" queryParamsHandling="merge">
          <i class="bi bi-arrow-left"></i> Back to Class {{ classId() }}
        </a>
        <span class="spacer"></span>
        <button type="button" class="btn primary" (click)="print()"><i class="bi bi-printer"></i> Print report card</button>
      </div>
      <app-load-state [of]="card" />
      @if (card.value(); as c) { <app-report-card [card]="c" /> }
    } @else {
      <app-load-state [of]="report" />
      @if (report.value(); as r) {
        <div class="grid cols-2">
          <section class="card flush">
            <h2 class="pad">Subject averages</h2>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr><th scope="col">Subject</th><th scope="col">Teacher</th><th scope="col" class="num">Average</th><th scope="col" class="num">Students marked</th></tr>
                </thead>
                <tbody>
                  @for (s of r.subjects; track s.subject_id) {
                    <tr>
                      <td><strong>{{ s.subject_name }}</strong></td>
                      <td>{{ s.teacher_name ?? '—' }}</td>
                      <td class="num"><span class="badge" [attr.data-tone]="gradeTone(s.average)">{{ s.average ?? '—' }}</span></td>
                      <td class="num">{{ s.graded }} / {{ r.students.length }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="empty">Class {{ classId() }} has no subjects yet.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="card flush">
            <h2 class="pad">Students <small class="muted">ranked by average · click for the report card</small></h2>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr><th scope="col" class="num">#</th><th scope="col">Student</th><th scope="col" class="num">Average</th><th scope="col">Grade</th><th scope="col" class="num">Attendance</th></tr>
                </thead>
                <tbody>
                  @for (s of r.students; track s.student_id; let i = $index) {
                    <tr>
                      <td class="num muted">{{ s.average === null ? '' : i + 1 }}</td>
                      <td><a [routerLink]="[]" [queryParams]="{ student: s.student_id }" queryParamsHandling="merge">{{ s.name }}</a></td>
                      <td class="num">{{ s.average ?? '—' }}</td>
                      <td><span class="badge" [attr.data-tone]="gradeTone(s.average)">{{ letterGrade(s.average) }}</span></td>
                      <td class="num">
                        <span class="badge" [attr.data-tone]="attendanceTone(s.attendance)">{{ s.attendance === null ? '—' : s.attendance + '%' }}</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="empty">No students in Class {{ classId() }} yet.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      }
    }
  `,
})
export default class Reports {
  private api = inject(Api);
  private router = inject(Router);
  /** All filters live in the URL, so a report can be bookmarked or shared. */
  readonly class = input<string>();
  readonly semester_ = input<string>(undefined, { alias: 'semester' });
  readonly student = input<string>();
  protected readonly classId = computed(() => Number(this.class()) || 1);
  protected readonly semester = computed(() => Number(this.semester_()) || currentSemester());
  protected readonly studentId = computed(() => Number(this.student()) || null);
  protected readonly report = new Load(() =>
    this.api.get<ClassReport>('/admin/reports/class', { class_id: this.classId(), semester: this.semester() }),
  );
  protected readonly card = new Load(() =>
    this.api.get<ReportCard>(`/admin/students/${this.studentId()}/report`, { semester: this.semester() }),
  );
  protected readonly classes = CLASSES;
  protected readonly gradeTone = gradeTone;
  protected readonly attendanceTone = attendanceTone;
  protected readonly letterGrade = letterGrade;

  constructor() {
    // Load whichever view the URL asks for: one student's report card, or the whole class.
    effect(() => {
      this.classId();
      this.semester();
      const one = this.studentId();
      untracked(() => void (one ? this.card : this.report).run());
    });
  }

  protected go(params: Record<string, string | null>) {
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  protected print() {
    window.print();
  }
}
