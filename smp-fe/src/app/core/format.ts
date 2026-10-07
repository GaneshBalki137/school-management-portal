// Pure helpers with no Angular imports, so `npm test` can run them directly in Node.

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
export const LOW_ATTENDANCE = 75;

/** Today's date in the user's timezone as YYYY-MM-DD (the format the API and date inputs use). */
export const todayIso = (d = new Date()) => d.toLocaleDateString('en-CA');

/** 1 = Monday ... 7 = Sunday, matching the timetable's day_of_week. */
export const isoDow = (d = new Date()) => d.getDay() || 7;

export const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;

/** Semester 1 runs June to November, semester 2 December to May. */
export const currentSemester = (d = new Date()) => (d.getMonth() >= 5 && d.getMonth() <= 10 ? 1 : 2);

export function academicYear(d = new Date()) {
  const start = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}–${String(start + 1).slice(2)}`;
}

export const fullName = (p: { first_name: string; last_name: string }) => `${p.first_name} ${p.last_name}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Mean of the values that are filled in, to one decimal. Same rule as the database's grade average. */
export function average(values: (number | null | undefined)[]): number | null {
  const given = values.filter((v): v is number => typeof v === 'number');
  return given.length ? Math.round((given.reduce((a, b) => a + b, 0) / given.length) * 10) / 10 : null;
}

export function letterGrade(avg: number | null): string {
  if (avg === null) return '—';
  return avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
}

/** Badge colour for a grade average. */
export const gradeTone = (avg: number | null) =>
  avg === null ? '' : avg >= 80 ? 'green' : avg >= 60 ? 'blue' : avg >= 50 ? 'amber' : 'red';

/** Badge colour for an attendance percentage. */
export const attendanceTone = (pct: number | null) =>
  pct === null ? '' : pct >= 85 ? 'green' : pct >= LOW_ATTENDANCE ? 'amber' : 'red';

/** One CSV cell: always quoted, and formula-like text is defused so spreadsheets show it instead of running it. */
export function csvCell(value: string | number | null | undefined): string {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export const toCsv = (rows: (string | number | null | undefined)[][]) =>
  rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
