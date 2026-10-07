# School Portal

One place for a school's daily work: the office manages students, teachers, subjects and the timetable; teachers take attendance and enter marks; students see their timetable, attendance and report card. Everyone gets the notice board.

| Part | Stack | Folder |
| --- | --- | --- |
| API | Rust · actix-web · sqlx · PostgreSQL | `smp-backend/rust-api` |
| Web app | Angular 21 (standalone, signals) · Chart.js · Bootstrap Icons | `smp-fe` |

## What each person can do

**School office (admin)**
- Dashboard: head counts, today's attendance, a 14-day attendance trend, class sizes, admissions by year, and students below 75% attendance.
- Students and teachers: search, filter by class, add, edit, delete, export to CSV. A new account gets a one-time temporary password; the office can reset it at any time.
- Subjects: assign one teacher per subject and class. The timetable refuses to double-book a teacher.
- Timetable: click a period to add, change or clear a lecture.
- Reports: class results (subject averages and student ranking) and printable report cards with marks, grades and attendance.
- Notice board: publish to everyone, only teachers or only students, pin, schedule and expire notices.

**Teachers**
- "Your day": today's lectures, with attendance still to take.
- Attendance: Present / Late / Absent per student, "mark all present", correct any past day. Unsaved changes are never lost silently.
- Gradebook: quiz, homework, test and project marks per semester, with live averages and grades.

**Students**
- Today's classes, overall attendance and average.
- Attendance per subject against the 75% requirement, plus full history.
- Report card for each semester, ready to print.

Everyone can change their password, switch light/dark theme and use the app on a phone.

## Security

- Passwords are hashed with Argon2id. Sessions use an httpOnly, SameSite=Strict cookie, so page scripts cannot read them.
- Changing or resetting a password signs that person out everywhere else.
- Five wrong passwords lock that email for 15 minutes.
- Every endpoint checks the person's role; students and teachers only ever see their own classes.
- All SQL is parameterised. The database enforces valid classes, hours, marks (0–100) and one lecture per class period; the API refuses to double-book a teacher.
- The web app ships a Content Security Policy, and CSV exports are protected against spreadsheet formula injection.
- First-time and reset accounts must choose their own password before using the portal.

## Run it locally

You need PostgreSQL 14+, Rust (stable) and Node.js 20.19+ (or 22.12+).

### 1. Database

```sh
createuser smp --pwprompt          # choose a password
createdb smp_portal --owner smp
```

### 2. API

```sh
cd smp-backend/rust-api
cp .env.example .env               # then fill in DATABASE_URL, JWT_SECRET (openssl rand -hex 32) and ADMIN_PASSWORD
cargo run                          # creates the tables and the first admin account, listens on 127.0.0.1:3000
```

Set `SCHOOL_TIMEZONE` in `.env` to your school's timezone; it decides what "today" means for attendance and notices.

### 3. Demo data (optional, empty database only)

```sh
psql "postgres://smp:YOUR_PASSWORD@localhost:5432/smp_portal" -v ON_ERROR_STOP=1 -f seed.sql
```

This adds classes 6–10 with 40 students, 6 teachers, a full timetable, the last 30 days of attendance, marks and notices. Every demo teacher and student signs in with `Demo@2026` (for example `anita.sharma@school.local` or `aditya.reddy2@school.local`). The admin signs in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

### 4. Web app

```sh
cd smp-fe
npm install
npm start                          # http://localhost:4200, /api is proxied to the API
```

## Tests and builds

```sh
cd smp-fe && npm test && npm run build      # unit tests, then production build in smp-fe/dist
cd smp-backend/rust-api && cargo build --release
```

## Going to production

- Serve `smp-fe/dist/smp-fe/browser` and the API behind the same HTTPS domain, routing `/api` to the API.
- Remove `COOKIE_SECURE=false` from `.env` so the session cookie is HTTPS-only.
- Use a long random `JWT_SECRET`; changing it signs everyone out.
- Back up the PostgreSQL database regularly.
