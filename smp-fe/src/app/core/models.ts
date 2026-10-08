// Shapes of the JSON the API returns.

export type Role = 'admin' | 'teacher' | 'student';
export type Status = 'P' | 'A' | 'L';
export type Audience = 'all' | 'teacher' | 'student';
export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export const ACCENTS = ['indigo', 'ocean', 'teal', 'violet', 'berry', 'sunset', 'graphite'] as const;
export type Accent = (typeof ACCENTS)[number];

export interface Profile {
  account_id: number;
  email: string;
  role: Role;
  name: string;
  must_change_password: boolean;
  last_login_at: string | null;
  student_id: number | null;
  teacher_id: number | null;
  class_id: number | null;
  details: Record<string, string | number | null> | null;
  theme: ThemeMode;
  accent: Accent;
}

export interface Person {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone_number: string;
  address: string;
}

export interface Student extends Person {
  student_id: number;
  class_id: number;
  guardian_name: string;
  guardian_phone: string;
  admission_date: string;
  last_login_at: string | null;
}

export interface Teacher extends Person {
  teacher_id: number;
  qualification: string;
  subject_name: string;
  hire_date: string;
  last_login_at: string | null;
  subjects: number;
}

export interface Subject {
  subject_id: number;
  subject_name: string;
  class_id: number;
  teacher_id: number | null;
  teacher_name: string | null;
  weekly_lectures: number;
}

export interface TeacherSubject {
  subject_id: number;
  subject_name: string;
  class_id: number;
  students: number;
}

export interface Slot {
  timetable_id: number;
  class_id: number;
  day_of_week: number;
  start_hour: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number | null;
  teacher_name: string | null;
}

export interface Notice {
  notice_id: number;
  title: string;
  content: string;
  audience: Audience;
  pinned: boolean;
  publish_date: string;
  expiry_date: string | null;
  created_at: string;
}

export interface RosterRow {
  student_id: number;
  first_name: string;
  last_name: string;
  status: Status | null;
}

export interface GradeRow {
  student_id: number;
  first_name: string;
  last_name: string;
  quiz_grade: number | null;
  homework_grade: number | null;
  test_grade: number | null;
  project_grade: number | null;
  average: number | null;
}

export interface ReportCard {
  semester: number;
  attendance: number | null;
  student: { student_id: number; name: string; class_id: number; email: string; guardian_name: string };
  subjects: {
    subject_id: number;
    subject_name: string;
    teacher_name: string | null;
    quiz_grade: number | null;
    homework_grade: number | null;
    test_grade: number | null;
    project_grade: number | null;
    average: number | null;
    attendance: number | null;
  }[];
}

/** Returned when an account is created or its password is reset. */
export interface Credentials {
  email?: string;
  temporary_password: string;
}
