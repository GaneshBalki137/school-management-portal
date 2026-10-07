import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';

type Params = Record<string, string | number | null | undefined>;

/** Promise-based calls to the API. Paths are relative to /api; the session cookie rides along automatically. */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  get<T>(path: string, params: Params = {}): Promise<T> {
    const given = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '');
    return firstValueFrom(this.http.get<T>(`/api${path}`, { params: Object.fromEntries(given) as Record<string, string | number> }));
  }

  post<T = unknown>(path: string, body: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(`/api${path}`, body));
  }

  put<T = unknown>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.put<T>(`/api${path}`, body));
  }

  delete(path: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api${path}`));
  }
}

/** A message a person can act on, from whatever an API call threw. */
export function errorText(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    if (typeof e.error?.error === 'string') return e.error.error;
    return `Something went wrong (error ${e.status}). Please try again.`;
  }
  return 'Something went wrong. Please try again.';
}

/** One async value with loading and error state. Responses that arrive after a newer request are ignored. */
export class Load<T> {
  readonly value = signal<T | undefined>(undefined);
  readonly loading = signal(false);
  readonly error = signal('');
  private seq = 0;

  constructor(private fetch: () => Promise<T>) {}

  async run(): Promise<void> {
    const n = ++this.seq;
    this.loading.set(true);
    this.error.set('');
    try {
      const value = await this.fetch();
      if (n === this.seq) this.value.set(value);
    } catch (e) {
      if (n === this.seq) this.error.set(errorText(e));
    } finally {
      if (n === this.seq) this.loading.set(false);
    }
  }
}

/** Runs `load` now and again whenever a signal read in `deps` changes. Call from a constructor. */
export function reloadOn(load: Load<unknown>, deps: () => unknown) {
  effect(() => {
    deps();
    untracked(() => void load.run());
  });
}
