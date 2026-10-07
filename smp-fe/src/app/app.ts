import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Confirm, Toasts } from './core/ui';
import { Dialog } from './core/widgets';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Dialog],
  template: `
    <router-outlet />

    <div class="toasts" aria-live="polite">
      @for (t of toasts.list(); track t.id) {
        <div class="toast" [attr.data-kind]="t.kind" [attr.role]="t.kind === 'error' ? 'alert' : 'status'">
          <i class="bi" [class.bi-check-circle-fill]="t.kind === 'success'" [class.bi-exclamation-triangle-fill]="t.kind === 'error'"></i>
          <span>{{ t.text }}</span>
          <button type="button" class="icon-btn" aria-label="Dismiss" (click)="toasts.dismiss(t.id)"><i class="bi bi-x"></i></button>
        </div>
      }
    </div>

    @let ask = confirm.current();
    <app-dialog [heading]="ask?.title ?? ''" [open]="!!ask" (closed)="confirm.answer(false)">
      <div class="dialog-body"><p>{{ ask?.message }}</p></div>
      <footer class="dialog-foot">
        <button type="button" class="btn ghost" (click)="confirm.answer(false)">Cancel</button>
        <button type="button" class="btn" [class.danger]="ask?.danger" [class.primary]="!ask?.danger" (click)="confirm.answer(true)">
          {{ ask?.action }}
        </button>
      </footer>
    </app-dialog>
  `,
})
export class App {
  protected readonly toasts = inject(Toasts);
  protected readonly confirm = inject(Confirm);
}
