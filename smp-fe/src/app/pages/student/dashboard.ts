import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, Load } from '../../core/api';
import { attendanceTone, gradeTone, hourLabel, isoDow, letterGrade, LOW_ATTENDANCE } from '../../core/format';
import { Notice, Slot } from '../../core/models';
import { LoadState } from '../../core/widgets';

interface Overview {
  class_id: number;
  subjects: number;
  attendance: { total: number; attended: number; percent: number | null };
  average: number | null;
}

@Component({
  imports: [DatePipe, LoadState, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Your day</h1>
        <p class="sub">Today's classes, how you're doing, and news from school.</p>
      </div>
    </header>

    <app-load-state [of]="overview" />
    @if (overview.value(); as o) {
      @if (o.attendance.percent !== null && o.attendance.percent < low) {
        <div class="alert" data-tone="danger">
          <i class="bi bi-exclamation-triangle"></i>
          <span>Your attendance is {{ o.attendance.percent }}%, below the required {{ low }}%. Please speak to your class teacher.</span>
        </div>
      }
      <div class="stats">
        <div class="stat">
          <span class="stat-icon" data-tone="blue"><i class="bi bi-building"></i></span>
          <span class="stat-value">Class {{ o.class_id }}</span><span class="stat-label">{{ o.subjects }} subjects</span>
        </div>
        <a class="stat" routerLink="/student/attendance">
          <span class="stat-icon" [attr.data-tone]="attendanceTone(o.attendance.percent) || 'blue'"><i class="bi bi-calendar-check"></i></span>
          <span class="stat-value">{{ o.attendance.percent === null ? '—' : o.attendance.percent + '%' }}</span>
          <span class="stat-label">Attendance · {{ o.attendance.attended }} of {{ o.attendance.total }} lectures</span>
        </a>
        <a class="stat" routerLink="/student/report">
          <span class="stat-icon" [attr.data-tone]="gradeTone(o.average) || 'blue'"><i class="bi bi-award"></i></span>
          <span class="stat-value">{{ o.average ?? '—' }}</span>
          <span class="stat-label">Average mark{{ o.average === null ? '' : ' · Grade ' + letterGrade(o.average) }}</span>
        </a>
      </div>

      <div class="grid cols-2">
        <section class="card">
          <h2>Today's classes <a class="small" routerLink="/timetable">Full week</a></h2>
          <ul class="list">
            @for (s of todays(); track s.timetable_id) {
              <li>
                <span class="time">{{ hourLabel(s.start_hour) }}</span>
                <span class="grow"><strong>{{ s.subject_name }}</strong><small class="block muted">{{ s.teacher_name ?? 'Teacher to be assigned' }}</small></span>
              </li>
            } @empty {
              <li class="empty"><i class="bi bi-sun"></i> No classes today.</li>
            }
          </ul>
        </section>
        <section class="card">
          <h2>Notices <a class="small" routerLink="/notices">See all</a></h2>
          <ul class="list">
            @for (n of (notices.value() ?? []).slice(0, 4); track n.notice_id) {
              <li>
                <span class="grow">
                  <strong>@if (n.pinned) { <i class="bi bi-pin-angle-fill" aria-label="Pinned"></i> } {{ n.title }}</strong>
                  <small class="block muted clamp">{{ n.content }}</small>
                </span>
                <small class="muted">{{ n.publish_date | date: 'mediumDate' }}</small>
              </li>
            } @empty {
              <li class="empty">No notices right now.</li>
            }
          </ul>
        </section>
      </div>
    }
  `,
})
export default class StudentDashboard {
  private api = inject(Api);
  protected readonly overview = new Load(() => this.api.get<Overview>('/student/dashboard'));
  protected readonly timetable = new Load(() => this.api.get<Slot[]>('/student/timetable'));
  protected readonly notices = new Load(() => this.api.get<Notice[]>('/notices'));
  protected readonly todays = computed(() => (this.timetable.value() ?? []).filter((s) => s.day_of_week === isoDow()));
  protected readonly low = LOW_ATTENDANCE;
  protected readonly hourLabel = hourLabel;
  protected readonly attendanceTone = attendanceTone;
  protected readonly gradeTone = gradeTone;
  protected readonly letterGrade = letterGrade;

  constructor() {
    void this.overview.run();
    void this.timetable.run();
    void this.notices.run();
  }
}
