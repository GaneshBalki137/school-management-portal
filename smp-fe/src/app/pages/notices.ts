import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Api, errorText, Load } from '../core/api';
import { todayIso } from '../core/format';
import { Audience, Notice } from '../core/models';
import { Session } from '../core/session';
import { Confirm, submitted, Toasts } from '../core/ui';
import { Dialog, LoadState } from '../core/widgets';

const AUDIENCE: Record<Audience, string> = { all: 'Everyone', teacher: 'Teachers', student: 'Students' };

@Component({
  imports: [DatePipe, Dialog, LoadState],
  template: `
    <header class="page-head">
      <div>
        <h1>Notice board</h1>
        <p class="sub">{{ isAdmin() ? 'Post announcements for students and teachers.' : 'Latest news and announcements from school.' }}</p>
      </div>
      @if (isAdmin()) {
        <div class="actions">
          <button type="button" class="btn primary" (click)="edit({})"><i class="bi bi-plus-lg"></i> New notice</button>
        </div>
      }
    </header>

    <app-load-state [of]="notices" />
    @if (notices.value(); as list) {
      <div class="notices">
        @for (n of list; track n.notice_id) {
          @let s = status(n);
          <article class="card notice" [class.pinned]="n.pinned">
            <header>
              <h2>
                @if (n.pinned) { <i class="bi bi-pin-angle-fill" title="Pinned" aria-label="Pinned"></i> }
                {{ n.title }}
              </h2>
              <div class="badges">
                <span class="badge">{{ audience[n.audience] }}</span>
                @if (isAdmin()) { <span class="badge" [attr.data-tone]="s.tone">{{ s.label }}</span> }
              </div>
            </header>
            <p class="notice-body">{{ n.content }}</p>
            <footer>
              <span class="small muted">
                Posted {{ n.publish_date | date: 'mediumDate' }}
                @if (n.expiry_date) { · Until {{ n.expiry_date | date: 'mediumDate' }} }
              </span>
              @if (isAdmin()) {
                <span class="row-actions">
                  <button type="button" class="btn sm ghost" (click)="edit(n)"><i class="bi bi-pencil"></i> Edit</button>
                  <button type="button" class="btn sm ghost danger" (click)="remove(n)"><i class="bi bi-trash"></i> Delete</button>
                </span>
              }
            </footer>
          </article>
        } @empty {
          <div class="card empty">
            <i class="bi bi-megaphone"></i>
            <p>No notices right now.</p>
            @if (isAdmin()) { <button type="button" class="btn primary" (click)="edit({})">Post the first notice</button> }
          </div>
        }
      </div>
    }

    <app-dialog [heading]="editing()?.notice_id ? 'Edit notice' : 'New notice'" [open]="!!editing()" (closed)="editing.set(null)">
      @if (editing(); as n) {
        <form (submit)="save($event)">
          <div class="dialog-body">
            <label class="field">
              <span>Title</span>
              <input name="title" required maxlength="150" [value]="n.title ?? ''" placeholder="e.g. Annual sports day on 14 November" />
            </label>
            <label class="field">
              <span>Message</span>
              <textarea name="content" required maxlength="5000" rows="6" [value]="n.content ?? ''"></textarea>
            </label>
            <div class="form-grid three">
              <label class="field">
                <span>Who can see it</span>
                <select name="audience">
                  @for (a of audiences; track a[0]) {
                    <option [value]="a[0]" [selected]="a[0] === (n.audience ?? 'all')">{{ a[1] }}</option>
                  }
                </select>
              </label>
              <label class="field">
                <span>Show from</span>
                <input name="publish_date" type="date" required [value]="n.publish_date ?? today" />
              </label>
              <label class="field">
                <span>Hide after <small class="muted">(optional)</small></span>
                <input name="expiry_date" type="date" [value]="n.expiry_date ?? ''" />
              </label>
            </div>
            <label class="check"><input name="pinned" type="checkbox" [checked]="n.pinned ?? false" /> Pin to the top of the board</label>
            @if (formError()) {
              <div class="alert" data-tone="danger" role="alert"><i class="bi bi-exclamation-octagon"></i> {{ formError() }}</div>
            }
          </div>
          <footer class="dialog-foot">
            <button type="button" class="btn ghost" (click)="editing.set(null)">Cancel</button>
            <button class="btn primary" [disabled]="busy()">{{ n.notice_id ? 'Save changes' : 'Publish notice' }}</button>
          </footer>
        </form>
      }
    </app-dialog>
  `,
})
export default class Notices implements OnInit {
  private api = inject(Api);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);
  private session = inject(Session);
  /** `?add=1` opens the new-notice form straight away (used by the dashboard's quick actions). */
  readonly add = input<string>();
  protected readonly isAdmin = computed(() => this.session.user()?.role === 'admin');
  protected readonly notices = new Load(() => this.api.get<Notice[]>(this.isAdmin() ? '/admin/notices' : '/notices'));
  protected readonly editing = signal<Partial<Notice> | null>(null);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected readonly audience = AUDIENCE;
  protected readonly audiences = Object.entries(AUDIENCE);
  protected readonly today = todayIso();

  constructor() {
    void this.notices.run();
  }

  ngOnInit() {
    if (this.add() && this.isAdmin()) this.edit({});
  }

  protected status(n: Notice) {
    if (n.publish_date > this.today) return { label: 'Scheduled', tone: 'blue' };
    if (n.expiry_date && n.expiry_date < this.today) return { label: 'Expired', tone: '' };
    return { label: 'Live', tone: 'green' };
  }

  protected edit(n: Partial<Notice>) {
    this.formError.set('');
    this.editing.set(n);
  }

  protected async save(e: Event) {
    const v = submitted(e);
    const id = this.editing()?.notice_id;
    const body = {
      title: v['title'],
      content: v['content'],
      audience: v['audience'],
      pinned: v['pinned'] === 'on',
      publish_date: v['publish_date'] || null,
      expiry_date: v['expiry_date'] || null,
    };
    this.busy.set(true);
    this.formError.set('');
    try {
      await (id ? this.api.put(`/admin/notices/${id}`, body) : this.api.post('/admin/notices', body));
      this.toasts.success(id ? 'Notice updated.' : 'Notice published.');
      this.editing.set(null);
      void this.notices.run();
    } catch (err) {
      this.formError.set(errorText(err));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(n: Notice) {
    const ok = await this.confirm.ask({
      title: 'Delete this notice?',
      message: `"${n.title}" will be removed from the notice board for everyone. This cannot be undone.`,
      action: 'Delete notice',
      danger: true,
    });
    if (!ok) return;
    try {
      await this.api.delete(`/admin/notices/${n.notice_id}`);
      this.toasts.success('Notice deleted.');
      void this.notices.run();
    } catch (err) {
      this.toasts.error(err);
    }
  }
}
