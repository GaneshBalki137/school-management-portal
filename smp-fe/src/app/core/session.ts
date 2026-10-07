import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Api } from './api';
import { Profile, Role } from './models';
import { Confirm } from './ui';

/** Who is signed in. The session cookie is httpOnly, so only the server can say; we ask once per page load. */
@Injectable({ providedIn: 'root' })
export class Session {
  private api = inject(Api);
  readonly user = signal<Profile | null>(null);
  private ready?: Promise<void>;

  load(): Promise<void> {
    return (this.ready ??= this.refresh());
  }

  async refresh(): Promise<void> {
    try {
      this.user.set(await this.api.get<Profile>('/auth/me'));
    } catch {
      this.user.set(null);
    }
  }

  async login(email: string, password: string): Promise<Profile> {
    const user = await this.api.post<Profile>('/auth/login', { email, password });
    this.user.set(user);
    this.ready = Promise.resolve();
    return user;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      this.user.set(null);
    }
  }
}

/** Where a user lands after signing in. */
export const homeUrl = (user: Profile) => (user.must_change_password ? '/account' : `/${user.role}`);

export const signedIn: CanActivateChildFn = async (_route, state) => {
  const session = inject(Session);
  const router = inject(Router);
  await session.load();
  const user = session.user();
  if (!user) return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
  if (user.must_change_password && !state.url.startsWith('/account')) return router.parseUrl('/account');
  return true;
};

/** Sign out by navigating here with `state: { signOut: true }`: leave-guards run first, so unsaved work is asked about while it can still be saved. */
export const signedOut: CanActivateFn = async () => {
  const session = inject(Session);
  const router = inject(Router);
  if (router.currentNavigation()?.extras.state?.['signOut']) await session.logout().catch(() => undefined);
  await session.load();
  const user = session.user();
  return user ? router.parseUrl(homeUrl(user)) : true;
};

export const toHome: CanActivateFn = async () => {
  const session = inject(Session);
  const router = inject(Router);
  await session.load();
  const user = session.user();
  return router.parseUrl(user ? homeUrl(user) : '/login');
};

export const role =
  (r: Role): CanActivateFn =>
  async () => {
    const session = inject(Session);
    const router = inject(Router);
    await session.load();
    return session.user()?.role === r || router.parseUrl('/');
  };

export interface HasUnsavedChanges {
  dirty(): boolean;
}

export const unsavedChanges: CanDeactivateFn<HasUnsavedChanges> = (page) =>
  !page.dirty() ||
  inject(Confirm).ask({
    title: 'Leave without saving?',
    message: 'You have changes on this page that are not saved yet. If you leave now they will be lost.',
    action: 'Leave without saving',
    danger: true,
  });

/** When the session expires mid-use, send the person to sign in and bring them back afterwards. */
export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(Session);
  const router = inject(Router);
  return next(req).pipe(
    catchError((e: unknown) => {
      const expired = e instanceof HttpErrorResponse && e.status === 401 && !/\/auth\/(login|me)$/.test(req.url);
      if (expired && session.user()) {
        session.user.set(null);
        void router.navigate(['/login'], { queryParams: { next: router.url, expired: 1 } });
      }
      return throwError(() => e);
    }),
  );
};
