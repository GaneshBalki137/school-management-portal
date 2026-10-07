import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, errorText, Load } from '../../core/api';
import { CLASSES, fullName } from '../../core/format';
import { Subject, Teacher } from '../../core/models';
import { Confirm, submitted, Toasts } from '../../core/ui';
import { Dialog, LoadState } from '../../core/widgets';

@Component({
  imports: [Dialog, LoadState, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Subjects</h1>
        <p class="sub">What each class studies, and who teaches it.</p>
      </div>
      <div class="actions">
        <button type="button" class="btn primary" (click)="edit({})"><i class="bi bi-plus-lg"></i> Add subject</button>
      </div>
    </header>

    <app-load-state [of]="subjects" />
    @if (subjects.value()) {
      @for (group of byClass(); track group.class_id) {
        <section class="card flush">
          <h2 class="pad">
            Class {{ group.class_id }}
            <small class="muted">{{ group.subjects.length }} {{ group.subjects.length === 1 ? 'subject' : 'subjects' }}</small>
            <span class="spacer"></span>
            <a class="btn sm ghost" routerLink="/timetable" [queryParams]="{ class: group.class_id }"><i class="bi bi-calendar-week"></i> Timetable</a>
          </h2>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Subject</th>
                  <th scope="col">Teacher</th>
                  <th scope="col" class="num">Lectures a week</th>
                  <th scope="col"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (s of group.subjects; track s.subject_id) {
                  <tr>
                    <td><strong>{{ s.subject_name }}</strong></td>
                    <td>
                      @if (s.teacher_name) { {{ s.teacher_name }} } @else { <span class="badge" data-tone="amber">No teacher yet</span> }
                    </td>
                    <td class="num">{{ s.weekly_lectures }}</td>
                    <td class="row-actions">
                      <button type="button" class="icon-btn" (click)="edit(s)" [attr.aria-label]="'Edit ' + s.subject_name" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button type="button" class="icon-btn danger" (click)="remove(s)" [attr.aria-label]="'Delete ' + s.subject_name" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @empty {
        <div class="card empty">
          <i class="bi bi-journal-bookmark"></i>
          <p>No subjects yet. Add one for each thing a class studies, then build its timetable.</p>
          <button type="button" class="btn primary" (click)="edit({})">Add the first subject</button>
        </div>
      }
    }

    <app-dialog [heading]="editing()?.subject_id ? 'Edit subject' : 'Add a subject'" [open]="!!editing()" (closed)="editing.set(null)">
      @if (editing(); as s) {
        <form (submit)="save($event)">
          <div class="dialog-body">
            <label class="field">
              <span>Subject name</span>
              <input name="subject_name" required maxlength="60" placeholder="e.g. Mathematics" [value]="s.subject_name ?? ''" />
            </label>
            <label class="field">
              <span>Class</span>
              <select name="class_id" required [disabled]="!!s.subject_id">
                <option value="" disabled [selected]="!s.class_id">Choose…</option>
                @for (c of classes; track c) { <option [value]="c" [selected]="c === s.class_id">Class {{ c }}</option> }
              </select>
              @if (s.subject_id) { <small class="muted">A subject's class can't be changed. Add a new subject instead.</small> }
            </label>
            <label class="field">
              <span>Teacher</span>
              <select name="teacher_id">
                <option value="">No teacher yet</option>
                @for (t of teachers.value() ?? []; track t.teacher_id) {
                  <option [value]="t.teacher_id" [selected]="t.teacher_id === s.teacher_id">
                    {{ name(t) }}{{ t.subject_name ? ' — ' + t.subject_name : '' }}
                  </option>
                }
              </select>
            </label>
            @if (formError()) {
              <div class="alert" data-tone="danger" role="alert"><i class="bi bi-exclamation-octagon"></i> {{ formError() }}</div>
            }
          </div>
          <footer class="dialog-foot">
            <button type="button" class="btn ghost" (click)="editing.set(null)">Cancel</button>
            <button class="btn primary" [disabled]="busy()">{{ s.subject_id ? 'Save changes' : 'Add subject' }}</button>
          </footer>
        </form>
      }
    </app-dialog>
  `,
})
export default class Subjects {
  private api = inject(Api);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);
  protected readonly subjects = new Load(() => this.api.get<Subject[]>('/admin/subjects'));
  protected readonly teachers = new Load(() => this.api.get<Teacher[]>('/admin/teachers'));
  protected readonly editing = signal<Partial<Subject> | null>(null);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected readonly classes = CLASSES;
  protected readonly name = fullName;

  protected readonly byClass = computed(() => {
    const groups = new Map<number, Subject[]>();
    for (const s of this.subjects.value() ?? []) groups.set(s.class_id, [...(groups.get(s.class_id) ?? []), s]);
    return [...groups].map(([class_id, subjects]) => ({ class_id, subjects }));
  });

  constructor() {
    void this.subjects.run();
    void this.teachers.run();
  }

  protected edit(s: Partial<Subject>) {
    this.formError.set('');
    this.editing.set(s);
  }

  protected async save(e: Event) {
    const v = submitted(e);
    const s = this.editing()!;
    // A disabled select is not submitted, so an edit keeps the subject's own class.
    const body = {
      subject_name: v['subject_name'],
      class_id: s.class_id ?? Number(v['class_id']),
      teacher_id: Number(v['teacher_id']) || null,
    };
    this.busy.set(true);
    this.formError.set('');
    try {
      await (s.subject_id ? this.api.put(`/admin/subjects/${s.subject_id}`, body) : this.api.post('/admin/subjects', body));
      this.toasts.success(s.subject_id ? 'Subject updated.' : `${body.subject_name} added to Class ${body.class_id}.`);
      this.editing.set(null);
      void this.subjects.run();
    } catch (err) {
      this.formError.set(errorText(err));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(s: Subject) {
    const ok = await this.confirm.ask({
      title: `Delete ${s.subject_name} for Class ${s.class_id}?`,
      message: `Its ${s.weekly_lectures} weekly lectures, and every attendance record and mark for this subject, will be deleted too. This cannot be undone.`,
      action: 'Delete subject',
      danger: true,
    });
    if (!ok) return;
    try {
      await this.api.delete(`/admin/subjects/${s.subject_id}`);
      this.toasts.success(`${s.subject_name} was deleted.`);
      void this.subjects.run();
    } catch (err) {
      this.toasts.error(err);
    }
  }
}
