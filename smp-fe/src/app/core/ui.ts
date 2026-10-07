import { Injectable, signal } from '@angular/core';
import { errorText } from './api';

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

/** Light/dark theme. index.html applies the saved choice before the app starts, so there is no flash. */
@Injectable({ providedIn: 'root' })
export class Theme {
  readonly dark = signal(document.documentElement.dataset['theme'] === 'dark');

  toggle() {
    const theme = this.dark() ? 'light' : 'dark';
    document.documentElement.dataset['theme'] = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Storage blocked (private mode): the choice just isn't remembered.
    }
    this.dark.set(theme === 'dark');
  }
}

/** Stops the browser's own form submission and returns the form's fields. Native validation has already passed. */
export function submitted(e: Event): Record<string, string> {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.target as HTMLFormElement)) as Record<string, string>;
}
