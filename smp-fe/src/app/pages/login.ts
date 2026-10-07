import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { errorText } from '../core/api';
import { homeUrl, Session } from '../core/session';
import { submitted } from '../core/ui';

@Component({
  template: `
    <div class="auth">
      <section class="auth-hero" aria-hidden="true">
        <span class="brand-mark big"><i class="bi bi-mortarboard-fill"></i></span>
        <h2>Everything your school day needs, in one place.</h2>
        <ul>
          <li><i class="bi bi-clipboard-check"></i> Attendance taken in seconds</li>
          <li><i class="bi bi-journal-check"></i> Marks and report cards, always up to date</li>
          <li><i class="bi bi-calendar-week"></i> Timetables without clashes</li>
          <li><i class="bi bi-megaphone"></i> Notices for the whole school</li>
        </ul>
      </section>

      <section class="auth-form">
        <form (submit)="signIn($event)">
          <h1>Welcome back</h1>
          <p class="muted">Sign in with the email address your school gave you.</p>

          @if (expired()) {
            <div class="alert" data-tone="info"><i class="bi bi-clock-history"></i> Your session ended. Please sign in again.</div>
          }
          @if (error()) {
            <div class="alert" data-tone="danger" role="alert"><i class="bi bi-exclamation-octagon"></i> {{ error() }}</div>
          }

          <label class="field">
            <span>Email address</span>
            <input name="email" type="email" autocomplete="username" required autofocus placeholder="name@school.local" />
          </label>
          <label class="field">
            <span>Password</span>
            <span class="input-group">
              <input name="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" required />
              <button
                type="button"
                class="icon-btn"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                [attr.aria-pressed]="showPassword()"
              >
                <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
              </button>
            </span>
          </label>
          <button class="btn primary block" [disabled]="busy()">
            @if (busy()) {
              <span class="spinner"></span> Signing in…
            } @else {
              Sign in
            }
          </button>
          <p class="small muted center">Forgot your password? Ask the school office to reset it for you.</p>
        </form>
      </section>
    </div>
  `,
})
export default class Login {
  private session = inject(Session);
  private router = inject(Router);
  readonly next = input<string>();
  readonly expired = input<string>();
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);

  protected async signIn(e: Event) {
    const { email, password } = submitted(e);
    this.busy.set(true);
    this.error.set('');
    try {
      const user = await this.session.login(email, password);
      // Only follow same-site paths, so a crafted link cannot send someone elsewhere after signing in.
      const next = this.next();
      const safe = next?.startsWith('/') && !next.startsWith('//') && !user.must_change_password;
      await this.router.navigateByUrl(safe && next ? next : homeUrl(user));
    } catch (err) {
      this.error.set(errorText(err));
    } finally {
      this.busy.set(false);
    }
  }
}
