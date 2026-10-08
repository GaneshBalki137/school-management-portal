import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { Api, Load } from '../../core/api';
import { CHART_COLORS, ChartView } from '../../core/chart';
import { attendanceTone, LOW_ATTENDANCE } from '../../core/format';
import { Theme } from '../../core/ui';
import { LoadState } from '../../core/widgets';

interface Overview {
  students: number;
  teachers: number;
  subjects: number;
  unassigned_subjects: number;
  attendance_today: number | null;
  attendance_trend: { date: string; percent: number }[];
  admissions: { year: number; students: number }[];
  class_strength: { class_id: number; students: number }[];
  low_attendance: { student_id: number; name: string; class_id: number; percent: number }[];
}

@Component({
  imports: [ChartView, DatePipe, LoadState, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>School overview</h1>
        <p class="sub">How the school is doing today, at a glance.</p>
      </div>
      <div class="actions">
        <a class="btn" routerLink="/admin/students" [queryParams]="{ add: 1 }"><i class="bi bi-person-plus"></i> Add student</a>
        <a class="btn" routerLink="/admin/teachers" [queryParams]="{ add: 1 }"><i class="bi bi-person-badge"></i> Add teacher</a>
        <a class="btn primary" routerLink="/notices" [queryParams]="{ add: 1 }"><i class="bi bi-megaphone"></i> Post notice</a>
      </div>
    </header>

    <app-load-state [of]="overview" />
    @if (overview.value(); as o) {
      <div class="stats">
        <a class="stat" routerLink="/admin/students">
          <span class="stat-icon" data-tone="blue"><i class="bi bi-mortarboard"></i></span>
          <span class="stat-value">{{ o.students }}</span><span class="stat-label">Students</span>
        </a>
        <a class="stat" routerLink="/admin/teachers">
          <span class="stat-icon" data-tone="green"><i class="bi bi-person-badge"></i></span>
          <span class="stat-value">{{ o.teachers }}</span><span class="stat-label">Teachers</span>
        </a>
        <a class="stat" routerLink="/admin/subjects">
          <span class="stat-icon" data-tone="amber"><i class="bi bi-journal-bookmark"></i></span>
          <span class="stat-value">{{ o.subjects }}</span><span class="stat-label">Subjects</span>
        </a>
        <div class="stat">
          <span class="stat-icon" [attr.data-tone]="attendanceTone(o.attendance_today) || 'blue'"><i class="bi bi-clipboard-check"></i></span>
          <span class="stat-value">{{ o.attendance_today === null ? '—' : o.attendance_today + '%' }}</span>
          <span class="stat-label">{{ o.attendance_today === null ? 'No attendance taken yet today' : 'Attendance today' }}</span>
        </div>
      </div>

      @if (o.unassigned_subjects) {
        <div class="alert" data-tone="warn">
          <i class="bi bi-exclamation-triangle"></i>
          <span>
            {{ o.unassigned_subjects }} {{ o.unassigned_subjects === 1 ? 'subject has' : 'subjects have' }} no teacher yet.
            <a routerLink="/admin/subjects">Assign teachers</a>
          </span>
        </div>
      }

      <div class="grid cols-2">
        <section class="card">
          <h2>Attendance, last 14 days</h2>
          @if (o.attendance_trend.length) {
            <app-chart [config]="trend()!" label="Line chart of the daily attendance percentage over the last 14 days" />
          } @else {
            <p class="empty small">Attendance will appear here once teachers start taking it.</p>
          }
        </section>
        <section class="card">
          <h2>Students per class</h2>
          @if (o.class_strength.length) {
            <app-chart [config]="strength()!" label="Bar chart of how many students are in each class" />
          } @else {
            <p class="empty small">No students yet.</p>
          }
        </section>
        <section class="card flush">
          <h2 class="pad">
            Needs attention
            <small class="muted">Attendance below {{ low }}%</small>
          </h2>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th scope="col">Student</th><th scope="col">Class</th><th scope="col" class="num">Attendance</th></tr>
              </thead>
              <tbody>
                @for (s of o.low_attendance; track s.student_id) {
                  <tr>
                    <td><a [routerLink]="['/admin/reports']" [queryParams]="{ class: s.class_id, student: s.student_id }">{{ s.name }}</a></td>
                    <td>Class {{ s.class_id }}</td>
                    <td class="num"><span class="badge" data-tone="red">{{ s.percent }}%</span></td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="empty"><i class="bi bi-emoji-smile"></i> Every student is above {{ low }}%.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
        <section class="card">
          <h2>Admissions by year</h2>
          @if (o.admissions.length) {
            <app-chart [config]="admissions()!" label="Bar chart of new students admitted each year" />
          } @else {
            <p class="empty small">No students yet.</p>
          }
        </section>
      </div>
      <p class="small muted">Updated {{ loadedAt | date: 'shortTime' }}.</p>
    }
  `,
})
export default class AdminDashboard {
  private api = inject(Api);
  private theme = inject(Theme);
  protected readonly overview = new Load(() => this.api.get<Overview>('/admin/dashboard'));
  protected readonly attendanceTone = attendanceTone;
  protected readonly low = LOW_ATTENDANCE;
  protected readonly loadedAt = new Date();

  protected readonly trend = computed((): ChartConfiguration | undefined => {
    const t = this.overview.value()?.attendance_trend;
    if (!t) return undefined;
    return {
      type: 'line',
      data: {
        labels: t.map((d) => new Date(d.date + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
        datasets: [
          {
            label: 'Attendance %',
            data: t.map((d) => d.percent),
            borderColor: this.theme.primary(),
            backgroundColor: this.theme.primary() + '22',
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { suggestedMin: 50, max: 100 } } },
    };
  });

  protected readonly strength = computed((): ChartConfiguration | undefined => {
    const c = this.overview.value()?.class_strength;
    if (!c) return undefined;
    return {
      type: 'bar',
      data: {
        labels: c.map((x) => `Class ${x.class_id}`),
        datasets: [{ label: 'Students', data: c.map((x) => x.students), backgroundColor: CHART_COLORS.teal, borderRadius: 6 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    };
  });

  protected readonly admissions = computed((): ChartConfiguration | undefined => {
    const a = this.overview.value()?.admissions;
    if (!a) return undefined;
    return {
      type: 'bar',
      data: {
        labels: a.map((x) => String(x.year)),
        datasets: [{ label: 'New students', data: a.map((x) => x.students), backgroundColor: CHART_COLORS.amber, borderRadius: 6 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    };
  });

  constructor() {
    void this.overview.run();
  }
}
