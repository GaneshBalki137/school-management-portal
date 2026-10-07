import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, Load } from '../../core/api';
import { hourLabel, todayIso } from '../../core/format';
import { Notice, TeacherSubject } from '../../core/models';
import { LoadState } from '../../core/widgets';

interface Overview {
  subjects: number;
  classes: number;
  students: number;
  weekly_lectures: number;
  today: { timetable_id: number; class_id: number; start_hour: number; subject_id: number; subject_name: string; attendance_taken: boolean }[];
}

@Component({
  imports: [DatePipe, LoadState, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Your day</h1>
        <p class="sub">Today's lectures, your classes and the latest notices.</p>
      </div>
      <div class="actions">
        <a class="btn primary" routerLink="/teacher/attendance"><i class="bi bi-clipboard-check"></i> Take attendance</a>
      </div>
    </header>

    <app-load-state [of]="overview" />
    @if (overview.value(); as o) {
      <div class="stats">
        <div class="stat">
          <span class="stat-icon" data-tone="blue"><i class="bi bi-journal-bookmark"></i></span>
          <span class="stat-value">{{ o.subjects }}</span><span class="stat-label">Subjects</span>
        </div>
        <div class="stat">
          <span class="stat-icon" data-tone="green"><i class="bi bi-people"></i></span>
          <span class="stat-value">{{ o.students }}</span><span class="stat-label">Students in {{ o.classes }} {{ o.classes === 1 ? 'class' : 'classes' }}</span>
        </div>
        <div class="stat">
          <span class="stat-icon" data-tone="amber"><i class="bi bi-calendar-week"></i></span>
          <span class="stat-value">{{ o.weekly_lectures }}</span><span class="stat-label">Lectures a week</span>
        </div>
        <div class="stat">
          <span class="stat-icon" data-tone="red"><i class="bi bi-hourglass-split"></i></span>
          <span class="stat-value">{{ pending(o) }}</span><span class="stat-label">Attendance still to take today</span>
        </div>
      </div>

      <div class="grid cols-2">
        <section class="card">
          <h2>Today's lectures</h2>
          <ul class="list">
            @for (l of o.today; track l.timetable_id) {
              <li>
                <span class="time">{{ hourLabel(l.start_hour) }}</span>
                <span class="grow"><strong>{{ l.subject_name }}</strong><small class="block muted">Class {{ l.class_id }}</small></span>
                @if (l.attendance_taken) {
                  <a class="badge" data-tone="green" routerLink="/teacher/attendance" [queryParams]="{ subject: l.subject_id }" title="Review attendance">
                    <i class="bi bi-check2"></i> Attendance taken
                  </a>
                } @else {
                  <a class="btn sm primary" routerLink="/teacher/attendance" [queryParams]="{ subject: l.subject_id }">Take attendance</a>
                }
              </li>
            } @empty {
              <li class="empty"><i class="bi bi-cup-hot"></i> No lectures scheduled for today.</li>
            }
          </ul>
        </section>

        <section class="card">
          <h2>My subjects</h2>
          <ul class="list">
            @for (s of subjects.value() ?? []; track s.subject_id) {
              <li>
                <span class="grow"><strong>{{ s.subject_name }}</strong><small class="block muted">Class {{ s.class_id }} · {{ s.students }} students</small></span>
                <a class="btn sm ghost" routerLink="/teacher/grades" [queryParams]="{ subject: s.subject_id }"><i class="bi bi-journal-check"></i> Marks</a>
              </li>
            } @empty {
              <li class="empty">No subjects assigned yet. The school office assigns subjects to teachers.</li>
            }
          </ul>
        </section>

        <section class="card span-2">
          <h2>Latest notices <a class="small" routerLink="/notices">See all</a></h2>
          <ul class="list">
            @for (n of (notices.value() ?? []).slice(0, 3); track n.notice_id) {
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
export default class TeacherDashboard {
  private api = inject(Api);
  protected readonly overview = new Load(() => this.api.get<Overview>('/teacher/dashboard', { date: todayIso() }));
  protected readonly subjects = new Load(() => this.api.get<TeacherSubject[]>('/teacher/subjects'));
  protected readonly notices = new Load(() => this.api.get<Notice[]>('/notices'));
  protected readonly hourLabel = hourLabel;

  constructor() {
    void this.overview.run();
    void this.subjects.run();
    void this.notices.run();
  }

  protected pending(o: Overview) {
    // One subject can have several periods a day; attendance is per subject and date.
    return new Set(o.today.filter((l) => !l.attendance_taken).map((l) => l.subject_id)).size;
  }
}
