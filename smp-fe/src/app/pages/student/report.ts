import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Api, Load, reloadOn } from '../../core/api';
import { currentSemester } from '../../core/format';
import { ReportCard } from '../../core/models';
import { LoadState, ReportCardView } from '../../core/widgets';

@Component({
  imports: [LoadState, ReportCardView],
  template: `
    <header class="page-head no-print">
      <div>
        <h1>Report card</h1>
        <p class="sub">Your marks for each subject, updated as teachers enter them.</p>
      </div>
      <div class="actions">
        <label class="field inline">
          <span>Semester</span>
          <select (change)="pick($any($event.target).value)">
            <option value="1" [selected]="sem() === 1">Semester 1 (Jun–Nov)</option>
            <option value="2" [selected]="sem() === 2">Semester 2 (Dec–May)</option>
          </select>
        </label>
        <button type="button" class="btn primary" (click)="print()" [disabled]="!card.value()"><i class="bi bi-printer"></i> Print</button>
      </div>
    </header>

    <app-load-state [of]="card" />
    @if (card.value(); as c) { <app-report-card [card]="c" /> }
  `,
})
export default class StudentReport {
  private api = inject(Api);
  private router = inject(Router);
  readonly semester = input<string>();
  protected readonly sem = computed(() => Number(this.semester()) || currentSemester());
  protected readonly card = new Load(() => this.api.get<ReportCard>('/student/report', { semester: this.sem() }));

  constructor() {
    reloadOn(this.card, () => this.sem());
  }

  protected pick(semester: string) {
    void this.router.navigate([], { queryParams: { semester }, replaceUrl: true });
  }

  protected print() {
    window.print();
  }
}
