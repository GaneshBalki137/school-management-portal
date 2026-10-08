import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Api, errorText } from './api';
import { ACCENTS, Profile, THEME_MODES } from './models';

export interface Toast {
  id: number;
  text: string;
  kind: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class Toasts {
  readonly list = signal<Toast[]>([]);
  private next = 0;

  success(text: string) {
    this.show(text, 'success');
  }

  /** Shows a message, or a readable version of whatever an API call threw. */
  error(e: unknown) {
    this.show(typeof e === 'string' ? e : errorText(e), 'error');
  }

  dismiss(id: number) {
    this.list.update((l) => l.filter((t) => t.id !== id));
  }

  private show(text: string, kind: Toast['kind']) {
    const id = ++this.next;
    this.list.update((l) => [...l.slice(-3), { id, text, kind }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 8000 : 4000);
  }
}

export interface ConfirmOptions {
  title: string;
  message: string;
  action: string;
  danger?: boolean;
}

/** A styled replacement for window.confirm(). The dialog itself lives in the root component. */
@Injectable({ providedIn: 'root' })
export class Confirm {
  readonly current = signal<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    this.current()?.resolve(false);
    return new Promise((resolve) => this.current.set({ ...options, resolve }));
  }

  answer(ok: boolean) {
    this.current()?.resolve(ok);
    this.current.set(null);
  }
}

type Look = Pick<Profile, 'theme' | 'accent'>;

/**
 * Light/dark mode and colour palette. Each account saves its choice on the server, applied at every sign-in;
 * this device also keeps the last one so index.html can apply it before the app starts, without a flash.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private api = inject(Api);
  private toasts = inject(Toasts);
  private system = matchMedia('(prefers-color-scheme: dark)');
  private systemDark = signal(this.system.matches);
  readonly mode = signal(stored('theme', THEME_MODES, 'system'));
  readonly accent = signal(stored('accent', ACCENTS, 'indigo'));
  readonly dark = computed(() => this.mode() === 'dark' || (this.mode() === 'system' && this.systemDark()));
  /** The palette's main colour as a hex, for charts. Read it while rendering: the look reaches <html> before views render. */
  readonly primary = computed(() => {
    this.dark();
    this.accent();
    return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  });

  constructor() {
    this.system.addEventListener('change', (e) => this.systemDark.set(e.matches));
    effect(() => {
      const root = document.documentElement.dataset;
      root['theme'] = this.dark() ? 'dark' : 'light';
      root['accent'] = this.accent();
    });
  }

  /** Applies a look on this device, e.g. the one saved on the account at sign-in. */
  use(look: Look) {
    this.mode.set(look.theme);
    this.accent.set(look.accent);
    try {
      localStorage.setItem('theme', look.theme);
      localStorage.setItem('accent', look.accent);
    } catch {
      // Storage blocked (private mode): the account still remembers it.
    }
  }

  /** The person changed their look: apply it now and save it to their account. */
  async choose(change: Partial<Look>) {
    const look = { theme: this.mode(), accent: this.accent(), ...change };
    this.use(look);
    try {
      await this.api.put('/auth/theme', look);
    } catch (e) {
      this.toasts.error(e);
    }
  }
}

/** This device's last choice, if it is still a valid one. */
function stored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T;
    if (valid.includes(value)) return value;
  } catch {
    // Storage blocked: use the default.
  }
  return fallback;
}

/** Stops the browser's own form submission and returns the form's fields. Native validation has already passed. */
export function submitted(e: Event): Record<string, string> {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.target as HTMLFormElement)) as Record<string, string>;
}
