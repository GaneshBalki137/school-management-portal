import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, errorText, Load, reloadOn } from '../../core/api';
import { CLASSES, fullName, initials, todayIso, toCsv } from '../../core/format';
import { Credentials, Student, Teacher } from '../../core/models';
import { Confirm, submitted, Toasts } from '../../core/ui';
import { Dialog, LoadState } from '../../core/widgets';

type Kind = 'students' | 'teachers';
type Row = Student | Teacher;
type Draft = Partial<Student & Teacher>;

const idOf = (r: Draft) => r.student_id ?? r.teacher_id;
const PHONE = '\\+?[0-9][0-9 \\-]{6,19}';

/** Students and teachers share one page: same list, search, form and account actions. */
@Component({
  imports: [DatePipe, Dialog, LoadState, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>{{ students() ? 'Students' : 'Teachers' }}</h1>
        <p class="sub">
          {{ students() ? 'Admissions, class lists and student sign-ins.' : 'Staff records, subjects and teacher sign-ins.' }}
        </p>
      </div>
      <div class="actions">
        <button type="button" class="btn" (click)="exportCsv()" [disabled]="!shown().length">
          <i class="bi bi-download"></i> Export CSV
        </button>
        <button type="button" class="btn primary" (click)="edit({})">
          <i class="bi bi-plus-lg"></i> {{ students() ? 'Add student' : 'Add teacher' }}
        </button>
      </div>
    </header>

    <div class="toolbar">
      <label class="search">
        <i class="bi bi-search"></i>
        <span class="sr-only">Search</span>
        <input type="search" placeholder="Search by name, email or phone" (input)="query.set($any($event.target).value)" />
      </label>
      @if (students()) {
        <label class="field inline">
          <span>Class</span>
          <select (change)="classFilter.set(+$any($event.target).value)">
            <option value="0">All classes</option>
            @for (c of classes; track c) { <option [value]="c">Class {{ c }}</option> }
          </select>
        </label>
      }
      <span class="spacer"></span>
      @if (people.value()) {
        <span class="small muted">Showing {{ shown().length }} of {{ people.value()!.length }}</span>
      }
    </div>

    <app-load-state [of]="people" />
    @if (people.value()) {
      <div class="card flush">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                @if (students()) {
                  <th scope="col">Class</th>
                  <th scope="col">Guardian</th>
                } @else {
                  <th scope="col">Specialisation</th>
                  <th scope="col">Phone</th>
                  <th scope="col" class="num">Subjects</th>
                }
                <th scope="col">Last sign-in</th>
                <th scope="col"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (p of shown(); track idOf(p)) {
                @let r = $any(p);
                <tr>
                  <td>
                    <span class="person">
                      <span class="avatar">{{ initials(name(p)) }}</span>
                      <span><strong>{{ name(p) }}</strong><small>{{ p.email }}</small></span>
                    </span>
                  </td>
                  @if (students()) {
                    <td>
                      <a routerLink="/admin/reports" [queryParams]="{ class: r.class_id, student: r.student_id }" title="Open report card">
                        Class {{ r.class_id }}
                      </a>
                    </td>
                    <td>{{ r.guardian_name }}<small class="block muted">{{ r.guardian_phone }}</small></td>
                  } @else {
                    <td>{{ r.subject_name || '—' }}<small class="block muted">{{ r.qualification }}</small></td>
                    <td>{{ p.phone_number }}</td>
                    <td class="num">{{ r.subjects }}</td>
                  }
                  <td>
                    @if (p.last_login_at) {
                      <span [title]="p.last_login_at | date: 'medium'">{{ p.last_login_at | date: 'mediumDate' }}</span>
                    } @else {
                      <span class="badge">Never</span>
                    }
                  </td>
                  <td class="row-actions">
                    <button type="button" class="icon-btn" (click)="edit(p)" [attr.aria-label]="'Edit ' + name(p)" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="icon-btn" (click)="resetPassword(p)" [attr.aria-label]="'Reset password for ' + name(p)" title="Reset password">
                      <i class="bi bi-key"></i>
                    </button>
                    <button type="button" class="icon-btn danger" (click)="remove(p)" [attr.aria-label]="'Delete ' + name(p)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">
                    @if (people.value()!.length) {
                      No one matches your search.
                    } @else {
                      <i class="bi bi-people"></i> No {{ kind() }} yet. Add the first one to get started.
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <app-dialog [heading]="dialogHeading()" [open]="!!editing()" (closed)="editing.set(null)" [wide]="true">
      @if (editing(); as p) {
        <form (submit)="save($event)">
          <div class="dialog-body">
            <fieldset>
              <legend>Personal details</legend>
              <div class="form-grid">
                <label class="field"><span>First name</span><input name="first_name" required maxlength="50" [value]="p.first_name ?? ''" autocomplete="off" /></label>
                <label class="field"><span>Last name</span><input name="last_name" required maxlength="50" [value]="p.last_name ?? ''" autocomplete="off" /></label>
                <label class="field"><span>Date of birth</span><input name="date_of_birth" type="date" required min="1900-01-01" [max]="today" [value]="p.date_of_birth ?? ''" /></label>
                <label class="field">
                  <span>Gender</span>
                  <select name="gender" required>
                    <option value="" disabled [selected]="!p.gender">Choose…</option>
                    @for (g of genders; track g) { <option [value]="g" [selected]="g === p.gender">{{ g }}</option> }
                  </select>
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend>Contact</legend>
              <div class="form-grid">
                <label class="field">
                  <span>Email <small class="muted">(used to sign in)</small></span>
                  <input name="email" type="email" required maxlength="254" [value]="p.email ?? ''" autocomplete="off" />
                </label>
                <label class="field">
                  <span>Phone @if (students()) { <small class="muted">(optional)</small> }</span>
                  <input name="phone_number" type="tel" [required]="!students()" [pattern]="phone" title="Digits, spaces or dashes, optionally starting with +" [value]="p.phone_number ?? ''" />
                </label>
                <label class="field span-2"><span>Address <small class="muted">(optional)</small></span><input name="address" maxlength="300" [value]="p.address ?? ''" /></label>
              </div>
            </fieldset>
            @if (students()) {
              <fieldset>
                <legend>School</legend>
                <div class="form-grid">
                  <label class="field">
                    <span>Class</span>
                    <select name="class_id" required>
                      <option value="" disabled [selected]="!p.class_id">Choose…</option>
                      @for (c of classes; track c) { <option [value]="c" [selected]="c === p.class_id">Class {{ c }}</option> }
                    </select>
                  </label>
                  <label class="field"><span>Admission date</span><input name="admission_date" type="date" [max]="today" [value]="p.admission_date ?? today" /></label>
                  <label class="field"><span>Guardian's name</span><input name="guardian_name" required maxlength="100" [value]="p.guardian_name ?? ''" /></label>
                  <label class="field">
                    <span>Guardian's phone</span>
                    <input name="guardian_phone" type="tel" required [pattern]="phone" title="Digits, spaces or dashes, optionally starting with +" [value]="p.guardian_phone ?? ''" />
                  </label>
                </div>
              </fieldset>
            } @else {
              <fieldset>
                <legend>Work</legend>
                <div class="form-grid">
                  <label class="field"><span>Specialisation</span><input name="subject_name" maxlength="60" placeholder="e.g. Mathematics" [value]="p.subject_name ?? ''" /></label>
                  <label class="field"><span>Qualification</span><input name="qualification" maxlength="100" placeholder="e.g. M.Sc, B.Ed" [value]="p.qualification ?? ''" /></label>
                  <label class="field"><span>Joining date</span><input name="hire_date" type="date" [max]="today" [value]="p.hire_date ?? today" /></label>
                </div>
              </fieldset>
            }
            @if (!idOf(p)) {
              <p class="small muted"><i class="bi bi-info-circle"></i> A sign-in with a one-time password is created automatically.</p>
            }
            @if (formError()) {
              <div class="alert" data-tone="danger" role="alert"><i class="bi bi-exclamation-octagon"></i> {{ formError() }}</div>
            }
          </div>
          <footer class="dialog-foot">
            <button type="button" class="btn ghost" (click)="editing.set(null)">Cancel</button>
            <button class="btn primary" [disabled]="busy()">{{ idOf(p) ? 'Save changes' : students() ? 'Add student' : 'Add teacher' }}</button>
          </footer>
        </form>
      }
    </app-dialog>

    <app-dialog heading="Sign-in details" [open]="!!credentials()" (closed)="credentials.set(null)">
      @if (credentials(); as c) {
        <div class="dialog-body">
          <div class="alert" data-tone="info">
            <i class="bi bi-shield-lock"></i>
            <span>Share these privately with {{ c.name }}. They will choose their own password the first time they sign in. <strong>This password will not be shown again.</strong></span>
          </div>
          <dl class="details">
            <div><dt>Email</dt><dd>{{ c.email }}</dd></div>
            <div>
              <dt>One-time password</dt>
              <dd class="secret">
                <code>{{ c.temporary_password }}</code>
                <button type="button" class="btn sm" (click)="copy(c.temporary_password)"><i class="bi bi-clipboard"></i> Copy</button>
              </dd>
            </div>
          </dl>
        </div>
        <footer class="dialog-foot"><button type="button" class="btn primary" (click)="credentials.set(null)">Done</button></footer>
      }
    </app-dialog>
  `,
})
export default class People implements OnInit {
  private api = inject(Api);
  private toasts = inject(Toasts);
  private confirm = inject(Confirm);
  /** From the route's data. */
  readonly kind = input.required<Kind>();
  /** `?add=1` opens the form straight away. */
  readonly add = input<string>();
  protected readonly students = computed(() => this.kind() === 'students');
  protected readonly people = new Load(() => this.api.get<Row[]>(`/admin/${this.kind()}`));
  protected readonly query = signal('');
  protected readonly classFilter = signal(0);
  protected readonly editing = signal<Draft | null>(null);
  protected readonly credentials = signal<(Credentials & { name: string }) | null>(null);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected readonly classes = CLASSES;
  protected readonly genders = ['Female', 'Male', 'Other'];
  protected readonly phone = PHONE;
  protected readonly today = todayIso();
  protected readonly initials = initials;
  protected readonly idOf = idOf;
  protected readonly name = fullName;

  protected readonly shown = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cls = this.classFilter();
    return (this.people.value() ?? []).filter(
      (p) =>
        (!cls || (p as Student).class_id === cls) &&
        (!q || `${fullName(p)} ${p.email} ${p.phone_number} ${(p as Student).guardian_phone ?? ''}`.toLowerCase().includes(q)),
    );
  });

  protected readonly dialogHeading = computed(() => {
    const p = this.editing();
    if (p && idOf(p)) return `Edit ${fullName(p as Row)}`;
    return this.students() ? 'Add a student' : 'Add a teacher';
  });

  constructor() {
    reloadOn(this.people, () => this.kind());
  }

  ngOnInit() {
    if (this.add()) this.edit({});
  }

  protected edit(p: Draft) {
    this.formError.set('');
    this.editing.set(p);
  }

  protected async save(e: Event) {
    const v = submitted(e);
    const id = idOf(this.editing()!);
    const body = this.students()
      ? { ...v, class_id: Number(v['class_id']), admission_date: v['admission_date'] || null }
      : { ...v, hire_date: v['hire_date'] || null };
    this.busy.set(true);
    this.formError.set('');
    try {
      const who = `${v['first_name']} ${v['last_name']}`;
      if (id) {
        await this.api.put(`/admin/${this.kind()}/${id}`, body);
        this.toasts.success(`${who}'s details were saved.`);
      } else {
        const created = await this.api.post<Credentials>(`/admin/${this.kind()}`, body);
        this.credentials.set({ ...created, name: who });
        this.toasts.success(`${who} was added.`);
      }
      this.editing.set(null);
      void this.people.run();
    } catch (err) {
      this.formError.set(errorText(err));
    } finally {
      this.busy.set(false);
    }
  }

  protected async resetPassword(p: Row) {
    const ok = await this.confirm.ask({
      title: `Reset ${fullName(p)}'s password?`,
      message: 'They will be signed out everywhere and must use a new one-time password to sign in again.',
      action: 'Reset password',
    });
    if (!ok) return;
    try {
      const c = await this.api.post<Credentials>(`/admin/${this.kind()}/${idOf(p)}/reset-password`);
      this.credentials.set({ ...c, email: p.email, name: fullName(p) });
    } catch (err) {
      this.toasts.error(err);
    }
  }

  protected async remove(p: Row) {
    const ok = await this.confirm.ask({
      title: `Delete ${fullName(p)}?`,
      message: this.students()
        ? 'This permanently removes the student, their sign-in, and all of their attendance and marks. This cannot be undone.'
        : 'This permanently removes the teacher and their sign-in. Their subjects will be left without a teacher until you assign someone else. This cannot be undone.',
      action: 'Delete permanently',
      danger: true,
    });
    if (!ok) return;
    try {
      await this.api.delete(`/admin/${this.kind()}/${idOf(p)}`);
      this.toasts.success(`${fullName(p)} was deleted.`);
      void this.people.run();
    } catch (err) {
      this.toasts.error(err);
    }
  }

  protected async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.toasts.success('Copied to the clipboard.');
    } catch {
      this.toasts.error('Could not copy. Select the password and copy it by hand.');
    }
  }

  protected exportCsv() {
    const rows = this.shown().map((p) => {
      const a = p as Student & Teacher;
      return this.students()
        ? [a.first_name, a.last_name, a.class_id, a.email, a.phone_number, a.gender, a.date_of_birth, a.guardian_name, a.guardian_phone, a.admission_date]
        : [a.first_name, a.last_name, a.email, a.phone_number, a.gender, a.date_of_birth, a.subject_name, a.qualification, a.hire_date];
    });
    const head = this.students()
      ? ['First name', 'Last name', 'Class', 'Email', 'Phone', 'Gender', 'Date of birth', 'Guardian', 'Guardian phone', 'Admitted']
      : ['First name', 'Last name', 'Email', 'Phone', 'Gender', 'Date of birth', 'Specialisation', 'Qualification', 'Joined'];
    const url = URL.createObjectURL(new Blob(['﻿' + toCsv([head, ...rows])], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${this.kind()}-${this.today}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }
}
