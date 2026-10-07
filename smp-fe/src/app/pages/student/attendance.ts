import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Api, Load } from '../../core/api';
import { attendanceTone, LOW_ATTENDANCE } from '../../core/format';
import { Status } from '../../core/models';
import { LoadState } from '../../core/widgets';

interface MyAttendance {
  subjects: { subject_name: string; total: number; present: number; late: number; absent: number; percent: number | null }[];
  records: { date: string; status: Status; subject_name: string }[];
}

const STATUS_LABEL: Record<Status, string> = { P: 'Present', L: 'Late', A: 'Absent' };
const STATUS_TONE: Record<Status, string> = { P: 'green', L: 'amber', A: 'red' };

@Component({
  imports: [DatePipe, LoadState],
  template: `
    <header class="page-head">
      <div>
        <h1>My attendance</h1>
        <p class="sub">You need at least {{ low }}% in every subject. Late counts as attended.</p>
      </div>
    </header>

    <app-load-state [of]="data" />
    @if (data.value(); as d) {
      <div class="grid cols-3">
        @for (s of d.subjects; track s.subject_name) {
          <section class="card subject-meter">
            <h2>{{ s.subject_name }}</h2>
            <p class="stat-value" [attr.data-tone]="tone(s.percent)">{{ s.percent }}%</p>
            <div class="meter" aria-hidden="true">
              <span [style.width.%]="s.percent" [attr.data-tone]="tone(s.percent)"></span><i [style.left.%]="low"></i>
            </div>
            <p class="small muted">{{ s.present }} present · {{ s.late }} late · {{ s.absent }} absent, of {{ s.total }}</p>
          </section>
        } @empty {
          <div class="card empty span-3"><i class="bi bi-calendar-x"></i><p>No attendance has been recorded for you yet.</p></div>
        }
      </div>

      @if (d.records.length) {
        <section class="card flush">
          <h2 class="pad">
            History
            <span class="spacer"></span>
            <label class="field inline">
              <span class="sr-only">Subject</span>
              <select (change)="subject.set($any($event.target).value)">
                <option value="">All subjects</option>
                @for (s of d.subjects; track s.subject_name) { <option [value]="s.subject_name">{{ s.subject_name }}</option> }
              </select>
            </label>
            <label class="field inline">
              <span class="sr-only">Show</span>
              <select (change)="status.set($any($event.target).value)">
                <option value="">Every lecture</option>
                <option value="A">Only absences</option>
                <option value="L">Only late</option>
              </select>
            </label>
          </h2>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th scope="col">Date</th><th scope="col">Subject</th><th scope="col">Status</th></tr></thead>
              <tbody>
                @for (r of history(); track $index) {
                  <tr>
                    <td>{{ r.date | date: 'EEE, d MMM y' }}</td>
                    <td>{{ r.subject_name }}</td>
                    <td><span class="badge" [attr.data-tone]="statusTone[r.status]">{{ statusLabel[r.status] }}</span></td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="empty">Nothing matches these filters.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    }
  `,
})
export default class StudentAttendance {
  private api = inject(Api);
  protected readonly data = new Load(() => this.api.get<MyAttendance>('/student/attendance'));
  protected readonly subject = signal('');
  protected readonly status = signal('');
  protected readonly history = computed(() =>
    (this.data.value()?.records ?? []).filter(
      (r) => (!this.subject() || r.subject_name === this.subject()) && (!this.status() || r.status === this.status()),
    ),
  );
  protected readonly low = LOW_ATTENDANCE;
  protected readonly tone = attendanceTone;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statusTone = STATUS_TONE;

  constructor() {
    void this.data.run();
  }
}
