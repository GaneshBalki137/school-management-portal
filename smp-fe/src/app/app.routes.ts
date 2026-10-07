import { Routes } from '@angular/router';
import { role, signedIn, signedOut, toHome, unsavedChanges } from './core/session';
import { Shell } from './shell';

const title = (page: string) => `${page} · School Portal`;

export const routes: Routes = [
  { path: 'login', title: title('Sign in'), canActivate: [signedOut], loadComponent: () => import('./pages/login') },
  {
    path: '',
    component: Shell,
    canActivateChild: [signedIn],
    children: [
      { path: '', pathMatch: 'full', canActivate: [toHome], children: [] },
      { path: 'account', title: title('My account'), loadComponent: () => import('./pages/account') },
      { path: 'notices', title: title('Notice board'), loadComponent: () => import('./pages/notices') },
      { path: 'timetable', title: title('Timetable'), loadComponent: () => import('./pages/timetable') },
      {
        path: 'admin',
        canActivate: [role('admin')],
        children: [
          { path: '', title: title('Dashboard'), loadComponent: () => import('./pages/admin/dashboard') },
          {
            path: 'students',
            title: title('Students'),
            data: { kind: 'students' },
            loadComponent: () => import('./pages/admin/people'),
          },
          {
            path: 'teachers',
            title: title('Teachers'),
            data: { kind: 'teachers' },
            loadComponent: () => import('./pages/admin/people'),
          },
          { path: 'subjects', title: title('Subjects'), loadComponent: () => import('./pages/admin/subjects') },
          { path: 'reports', title: title('Reports'), loadComponent: () => import('./pages/admin/reports') },
        ],
      },
      {
        path: 'teacher',
        canActivate: [role('teacher')],
        children: [
          { path: '', title: title('Dashboard'), loadComponent: () => import('./pages/teacher/dashboard') },
          {
            path: 'attendance',
            title: title('Take attendance'),
            canDeactivate: [unsavedChanges],
            loadComponent: () => import('./pages/teacher/attendance'),
          },
          {
            path: 'grades',
            title: title('Gradebook'),
            canDeactivate: [unsavedChanges],
            loadComponent: () => import('./pages/teacher/grades'),
          },
        ],
      },
      {
        path: 'student',
        canActivate: [role('student')],
        children: [
          { path: '', title: title('Dashboard'), loadComponent: () => import('./pages/student/dashboard') },
          { path: 'attendance', title: title('My attendance'), loadComponent: () => import('./pages/student/attendance') },
          { path: 'report', title: title('Report card'), loadComponent: () => import('./pages/student/report') },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
