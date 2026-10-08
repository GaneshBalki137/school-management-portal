import { Component, computed, inject, signal } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { academicYear, initials } from './core/format';
import { Role } from './core/models';
import { Session } from './core/session';
import { Theme, Toasts } from './core/ui';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { path: '/admin', label: 'Dashboard', icon: 'grid-1x2' },
    { path: '/admin/students', label: 'Students', icon: 'mortarboard' },
    { path: '/admin/teachers', label: 'Teachers', icon: 'person-badge' },
    { path: '/admin/subjects', label: 'Subjects', icon: 'journal-bookmark' },
    { path: '/timetable', label: 'Timetable', icon: 'calendar-week' },
    { path: '/admin/reports', label: 'Reports', icon: 'bar-chart-line' },
    { path: '/notices', label: 'Notice board', icon: 'megaphone' },
  ],
  teacher: [
    { path: '/teacher', label: 'Dashboard', icon: 'grid-1x2' },
    { path: '/teacher/attendance', label: 'Take attendance', icon: 'clipboard-check' },
    { path: '/teacher/grades', label: 'Gradebook', icon: 'journal-check' },
    { path: '/timetable', label: 'My timetable', icon: 'calendar-week' },
    { path: '/notices', label: 'Notice board', icon: 'megaphone' },
  ],
  student: [
    { path: '/student', label: 'Dashboard', icon: 'grid-1x2' },
    { path: '/student/attendance', label: 'My attendance', icon: 'calendar-check' },
    { path: '/student/report', label: 'Report card', icon: 'award' },
    { path: '/timetable', label: 'Timetable', icon: 'calendar-week' },
    { path: '/notices', label: 'Notice board', icon: 'megaphone' },
  ],
};

const ROLE_LABEL: Record<Role, string> = { admin: 'School office', teacher: 'Teacher', student: 'Student' };

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @let u = user();
    <a class="skip-link" href="#content" (click)="skip($event)">Skip to main content</a>
    <div class="shell">
      <aside class="sidebar" [class.open]="menuOpen()" aria-label="Main navigation">
        <a class="brand" routerLink="/">
          <span class="brand-mark"><i class="bi bi-mortarboard-fill"></i></span>
          <span><strong>School Portal</strong><small>{{ roleLabel() }}</small></span>
        </a>
        @if (!u?.must_change_password) {
          <nav class="nav" (click)="menuOpen.set(false)">
            @for (item of nav(); track item.path) {
              <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="exact" ariaCurrentWhenActive="page">
                <i class="bi" [class]="'bi-' + item.icon"></i>{{ item.label }}
              </a>
            }
          </nav>
        }
        <div class="sidebar-foot">
          <a routerLink="/account" class="person" (click)="menuOpen.set(false)">
            <span class="avatar">{{ initials() }}</span>
            <span><strong>{{ u?.name }}</strong><small>{{ u?.email }}</small></span>
          </a>
          <button type="button" class="btn ghost block" (click)="signOut()"><i class="bi bi-box-arrow-right"></i> Sign out</button>
        </div>
      </aside>
      @if (menuOpen()) {
        <div class="backdrop" (click)="menuOpen.set(false)"></div>
      }

      <div class="main">
        <header class="topbar">
          <button type="button" class="icon-btn menu-btn" aria-label="Open menu" (click)="menuOpen.set(true)">
            <i class="bi bi-list"></i>
          </button>
          <div class="greeting">
            <strong>{{ greeting() }}, {{ firstName() }}</strong>
            <small>{{ today }} · Academic year {{ year }}</small>
          </div>
          <span class="spacer"></span>
          <button
            type="button"
            class="icon-btn"
            (click)="theme.choose({ theme: theme.dark() ? 'light' : 'dark' })"
            [attr.aria-label]="theme.dark() ? 'Switch to light theme' : 'Switch to dark theme'"
            [title]="theme.dark() ? 'Light theme' : 'Dark theme'"
          >
            <i class="bi" [class.bi-sun]="theme.dark()" [class.bi-moon-stars]="!theme.dark()"></i>
          </button>
          <a routerLink="/account" class="avatar" aria-label="My account" title="My account">{{ initials() }}</a>
        </header>
        <main id="content" class="content" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell {
  private session = inject(Session);
  private router = inject(Router);
  private toasts = inject(Toasts);
  protected readonly theme = inject(Theme);
  protected readonly user = this.session.user;
  protected readonly menuOpen = signal(false);
  protected readonly nav = computed(() => NAV[this.user()?.role ?? 'student']);
  protected readonly roleLabel = computed(() => ROLE_LABEL[this.user()?.role ?? 'student']);
  protected readonly initials = computed(() => initials(this.user()?.name ?? ''));
  protected readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? '');
  protected readonly exact: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  protected readonly today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  protected readonly year = academicYear();

  protected greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  protected skip(e: Event) {
    e.preventDefault();
    document.getElementById('content')?.focus();
  }

  protected async signOut() {
    if (await this.router.navigate(['/login'], { state: { signOut: true } })) this.toasts.success('You have been signed out.');
  }
}
