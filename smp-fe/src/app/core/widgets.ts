import { afterRenderEffect, Component, computed, ElementRef, input, output, viewChild } from '@angular/core';
import { Load } from './api';
import { average, attendanceTone, gradeTone, letterGrade } from './format';
import { ReportCard } from './models';

let dialogs = 0;

/** Modal built on the native <dialog>: focus trapping, Escape to close and the backdrop come from the browser. */
@Component({
  selector: 'app-dialog',
  template: `
    <dialog #dialog class="dialog" [class.wide]="wide()" [attr.aria-labelledby]="id" (close)="closed.emit()">
      <header class="dialog-head">
        <h2 [id]="id">{{ heading() }}</h2>
        <button type="button" class="icon-btn" aria-label="Close" (click)="closed.emit()"><i class="bi bi-x-lg"></i></button>
      </header>
      <ng-content />
    </dialog>
  `,
})
export class Dialog {
  readonly heading = input.required<string>();
  readonly open = input(false);
  readonly wide = input(false);
  readonly closed = output();
  protected readonly id = `dialog-${++dialogs}`;
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterRenderEffect(() => {
      const d = this.dialog().nativeElement;
      if (this.open() && !d.open) d.showModal();
      if (!this.open() && d.open) d.close();
    });
  }
}

/** Spinner on first load, and a retry button if loading failed. The page renders the data itself. */
@Component({
  selector: 'app-load-state',
  template: `
    @if (of().error(); as error) {
      <div class="alert" data-tone="danger" role="alert">
        <i class="bi bi-exclamation-octagon"></i>
        <span>{{ error }}</span>
        <button type="button" class="btn sm" (click)="of().run()">Try again</button>
      </div>
    } @else if (of().loading() && of().value() === undefined) {
      <div class="loading" role="status"><span class="spinner"></span> Loading…</div>
    }
  `,
})
export class LoadState {
  readonly of = input.required<Load<unknown>>();
}

/** A printable report card, shared by the student's own page and the admin's reports. */
@Component({
  selector: 'app-report-card',
  template: `
    @let r = card();
    <article class="card report">
      <header class="report-head">
        <div>
          <p class="eyebrow">Report card · Semester {{ r.semester }}</p>
          <h2>{{ r.student.name }}</h2>
          <p class="muted">Class {{ r.student.class_id }} · Guardian: {{ r.student.guardian_name }}</p>
        </div>
        <div class="report-summary">
          <div><span class="stat-value">{{ overall() ?? '—' }}</span><span class="stat-label">Overall average</span></div>
          <div><span class="stat-value">{{ grade(overall()) }}</span><span class="stat-label">Grade</span></div>
          <div>
            <span class="stat-value">{{ r.attendance === null ? '—' : r.attendance + '%' }}</span>
            <span class="stat-label">Attendance</span>
          </div>
        </div>
      </header>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col" class="num">Quiz</th>
              <th scope="col" class="num">Homework</th>
              <th scope="col" class="num">Test</th>
              <th scope="col" class="num">Project</th>
              <th scope="col" class="num">Average</th>
              <th scope="col">Grade</th>
              <th scope="col" class="num">Attendance</th>
            </tr>
          </thead>
          <tbody>
            @for (s of r.subjects; track s.subject_id) {
              <tr>
                <th scope="row">
                  {{ s.subject_name }}
                  <span class="small muted block">{{ s.teacher_name ?? 'No teacher assigned' }}</span>
                </th>
                <td class="num">{{ s.quiz_grade ?? '—' }}</td>
                <td class="num">{{ s.homework_grade ?? '—' }}</td>
                <td class="num">{{ s.test_grade ?? '—' }}</td>
                <td class="num">{{ s.project_grade ?? '—' }}</td>
                <td class="num strong">{{ s.average ?? '—' }}</td>
                <td><span class="badge" [attr.data-tone]="gradeTone(s.average)">{{ grade(s.average) }}</span></td>
                <td class="num">
                  <span class="badge" [attr.data-tone]="attendanceTone(s.attendance)">
                    {{ s.attendance === null ? 'No classes yet' : s.attendance + '%' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty">No subjects have been set up for this class yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <p class="report-remark"><strong>Remarks:</strong> {{ remark() }}</p>
    </article>
  `,
})
export class ReportCardView {
  readonly card = input.required<ReportCard>();
  protected readonly overall = computed(() => average(this.card().subjects.map((s) => s.average)));
  protected readonly remark = computed(() => {
    const o = this.overall();
    if (o === null) return 'Marks have not been entered yet for this semester.';
    if (o >= 85) return 'Outstanding work this semester. Keep it up!';
    if (o >= 70) return 'Good progress, with room to push a little further.';
    if (o >= 50) return 'Satisfactory. Regular revision will help raise these marks.';
    return 'Needs improvement. Please speak with the subject teachers about extra support.';
  });
  protected readonly grade = letterGrade;
  protected readonly gradeTone = gradeTone;
  protected readonly attendanceTone = attendanceTone;
}
