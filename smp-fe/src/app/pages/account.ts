import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api, errorText } from '../core/api';
import { initials } from '../core/format';
import { homeUrl, Session } from '../core/session';
import { ACCENTS, ThemeMode } from '../core/models';
import { submitted, Theme, Toasts } from '../core/ui';

/** Labels for the profile fields worth showing, in display order. */
const FIELDS: [string, string][] = [
  ['class_id', 'Class'],
  ['date_of_birth', 'Date of birth'],
  ['gender', 'Gender'],
  ['phone_number', 'Phone'],
  ['address', 'Address'],
  ['guardian_name', 'Guardian'],
  ['guardian_phone', 'Guardian phone'],
  ['admission_date', 'Admitted on'],
  ['qualification', 'Qualification'],
  ['subject_name', 'Specialisation'],
  ['hire_date', 'Joined on'],
];

@Component({
  template: `
    @if (user(); as u) {
      <header class="page-head">
        <div>
          <h1>My account</h1>
          <p class="sub">Your details and sign-in settings.</p>
        </div>
      </header>

      @if (u.must_change_password) {
        <div class="alert" data-tone="warn">
          <i class="bi bi-shield-lock"></i>
          <span><strong>Please choose your own password to continue.</strong> You signed in with a temporary password from the school office.</span>
        </div>
      }

      <div class="grid cols-2">
        <section class="card">
          <h2>Profile</h2>
          <div class="person lg">
            <span class="avatar lg">{{ initials() }}</span>
            <span><strong>{{ u.name }}</strong><small>{{ u.email }}</small></span>
          </div>
          <dl class="details">
            @for (f of details(); track f[0]) {
              <div><dt>{{ f[0] }}</dt><dd>{{ f[1] }}</dd></div>
            }
            <div>
              <dt>Last sign-in</dt>
              <dd>{{ u.last_login_at ? (u.last_login_at | date: 'medium') : 'First time' }}</dd>
            </div>
          </dl>
          @if (u.role !== 'admin') {
            <p class="small muted">Something wrong here? Ask the school office to update your details.</p>
          }
        </section>

        <section class="card">
          <h2>Change password</h2>
          <form (submit)="change($event)">
            <label class="field">
              <span>Current password</span>
              <input name="current_password" type="password" autocomplete="current-password" required />
            </label>
            <label class="field">
              <span>New password</span>
              <input
                name="new_password"
                type="password"
                autocomplete="new-password"
                required
                minlength="8"
                maxlength="128"
                pattern="(?=.*\p{L})(?=.*\d).*"
                title="Use at least one letter and one number."
                (input)="draft.set($any($event.target).value)"
                aria-describedby="password-rules"
              />
            </label>
            <ul class="checklist" id="password-rules">
              <li [class.ok]="draft().length >= 8"><i class="bi"></i> At least 8 characters</li>
              <li [class.ok]="hasLetter()"><i class="bi"></i> At least one letter</li>
              <li [class.ok]="hasDigit()"><i class="bi"></i> At least one number</li>
            </ul>
            <label class="field">
              <span>Confirm new password</span>
              <input name="confirm" type="password" autocomplete="new-password" required />
            </label>
            @if (error()) {
              <div class="alert" data-tone="danger" role="alert"><i class="bi bi-exclamation-octagon"></i> {{ error() }}</div>
            }
            <button class="btn primary" [disabled]="busy()">
              @if (busy()) { <span class="spinner"></span> } Update password
            </button>
            <p class="small muted">Changing your password signs you out on every other device.</p>
          </form>
        </section>

        <section class="card">
          <h2>Appearance</h2>
          <p class="small muted">Saved to your account, so it follows you to any device you sign in on.</p>
          <fieldset>
            <legend>Mode</legend>
            <span class="segmented">
              @for (t of themes; track t.value) {
                <label>
                  <input type="radio" name="theme" [value]="t.value" [checked]="theme.mode() === t.value" (change)="theme.choose({ theme: t.value })" />
                  <span><i class="bi" [class]="t.icon"></i> {{ t.label }}</span>
                </label>
              }
            </span>
          </fieldset>
          <fieldset>
            <legend>Colour</legend>
            <span class="swatches">
              @for (a of accents; track a) {
                <label [attr.data-accent]="a" [title]="a | titlecase">
                  <input type="radio" name="accent" [value]="a" [checked]="theme.accent() === a" (change)="theme.choose({ accent: a })" [attr.aria-label]="a | titlecase" />
                </label>
              }
              <span class="small muted" aria-hidden="true">{{ theme.accent() | titlecase }}</span>
            </span>
          </fieldset>
        </section>
      </div>
    }
  `,
  imports: [DatePipe, TitleCasePipe],
})
export default class Account {
  private api = inject(Api);
  private session = inject(Session);
  private router = inject(Router);
  private toasts = inject(Toasts);
  protected readonly theme = inject(Theme);
  protected readonly themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'system', label: 'Match my device', icon: 'bi-circle-half' },
    { value: 'light', label: 'Light', icon: 'bi-sun' },
    { value: 'dark', label: 'Dark', icon: 'bi-moon-stars' },
  ];
  protected readonly accents = ACCENTS;
  protected readonly user = this.session.user;
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly draft = signal('');
  protected readonly hasLetter = computed(() => /\p{L}/u.test(this.draft()));
  protected readonly hasDigit = computed(() => /\d/.test(this.draft()));
  protected readonly initials = computed(() => initials(this.user()?.name ?? ''));
  protected readonly details = computed(() => {
    const d = this.user()?.details ?? {};
    return FIELDS.filter(([key]) => d[key]).map(([key, label]) => [label, String(d[key])]);
  });

  protected async change(e: Event) {
    const form = e.target as HTMLFormElement;
    const { current_password, new_password, confirm } = submitted(e);
    this.error.set('');
    if (new_password !== confirm) {
      this.error.set('The two new passwords do not match.');
      return;
    }
    this.busy.set(true);
    try {
      await this.api.put('/auth/password', { current_password, new_password });
      form.reset();
      this.draft.set('');
      const wasForced = this.user()?.must_change_password;
      await this.session.refresh();
      this.toasts.success('Your password has been updated.');
      if (wasForced) await this.router.navigateByUrl(homeUrl(this.user()!));
    } catch (err) {
      this.error.set(errorText(err));
    } finally {
      this.busy.set(false);
    }
  }
}
