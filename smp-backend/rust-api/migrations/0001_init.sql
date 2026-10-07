-- School portal schema. Applied automatically by the API on startup (sqlx migrate).
-- Constraints live here so bad data is rejected no matter which code path writes it.

CREATE TABLE teachers (
    teacher_id    SERIAL PRIMARY KEY,
    first_name    TEXT NOT NULL CHECK (length(first_name) BETWEEN 1 AND 50),
    last_name     TEXT NOT NULL CHECK (length(last_name) BETWEEN 1 AND 50),
    date_of_birth DATE NOT NULL CHECK (date_of_birth BETWEEN '1900-01-01' AND CURRENT_DATE),
    gender        TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    email         TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    phone_number  TEXT NOT NULL CHECK (phone_number ~ '^\+?[0-9][0-9 -]{6,19}$'),
    address       TEXT NOT NULL DEFAULT '' CHECK (length(address) <= 300),
    qualification TEXT NOT NULL DEFAULT '' CHECK (length(qualification) <= 100),
    subject_name  TEXT NOT NULL DEFAULT '' CHECK (length(subject_name) <= 60),
    hire_date     DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE students (
    student_id     SERIAL PRIMARY KEY,
    first_name     TEXT NOT NULL CHECK (length(first_name) BETWEEN 1 AND 50),
    last_name      TEXT NOT NULL CHECK (length(last_name) BETWEEN 1 AND 50),
    date_of_birth  DATE NOT NULL CHECK (date_of_birth BETWEEN '1900-01-01' AND CURRENT_DATE),
    gender         TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    email          TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    phone_number   TEXT NOT NULL DEFAULT '' CHECK (phone_number = '' OR phone_number ~ '^\+?[0-9][0-9 -]{6,19}$'),
    address        TEXT NOT NULL DEFAULT '' CHECK (length(address) <= 300),
    class_id       SMALLINT NOT NULL CHECK (class_id BETWEEN 1 AND 12),
    guardian_name  TEXT NOT NULL CHECK (length(guardian_name) BETWEEN 1 AND 100),
    guardian_phone TEXT NOT NULL CHECK (guardian_phone ~ '^\+?[0-9][0-9 -]{6,19}$'),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX students_class_idx ON students (class_id);

CREATE TABLE subjects (
    subject_id   SERIAL PRIMARY KEY,
    subject_name TEXT NOT NULL CHECK (length(subject_name) BETWEEN 1 AND 60),
    class_id     SMALLINT NOT NULL CHECK (class_id BETWEEN 1 AND 12),
    teacher_id   INT REFERENCES teachers ON DELETE SET NULL,
    UNIQUE (class_id, subject_name),
    UNIQUE (subject_id, class_id) -- target of timetable's composite FK
);
CREATE INDEX subjects_teacher_idx ON subjects (teacher_id);

-- One-hour lectures. day_of_week is ISO (1 = Monday ... 6 = Saturday).
CREATE TABLE timetable (
    timetable_id SERIAL PRIMARY KEY,
    class_id     SMALLINT NOT NULL,
    subject_id   INT NOT NULL,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    start_hour   SMALLINT NOT NULL CHECK (start_hour BETWEEN 7 AND 17),
    FOREIGN KEY (subject_id, class_id) REFERENCES subjects (subject_id, class_id) ON DELETE CASCADE,
    UNIQUE (class_id, day_of_week, start_hour)
);

-- ponytail: one attendance mark per subject per day; add start_hour to the key if a subject meets twice a day.
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id    INT NOT NULL REFERENCES students ON DELETE CASCADE,
    subject_id    INT NOT NULL REFERENCES subjects ON DELETE CASCADE,
    date          DATE NOT NULL CHECK (date <= CURRENT_DATE),
    status        TEXT NOT NULL CHECK (status IN ('P', 'A', 'L')), -- present, absent, late
    marked_by     INT REFERENCES teachers ON DELETE SET NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, subject_id, date)
);
CREATE INDEX attendance_subject_date_idx ON attendance (subject_id, date);

CREATE TABLE grades (
    grade_id       SERIAL PRIMARY KEY,
    student_id     INT NOT NULL REFERENCES students ON DELETE CASCADE,
    subject_id     INT NOT NULL REFERENCES subjects ON DELETE CASCADE,
    semester       SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    quiz_grade     SMALLINT CHECK (quiz_grade BETWEEN 0 AND 100),
    homework_grade SMALLINT CHECK (homework_grade BETWEEN 0 AND 100),
    test_grade     SMALLINT CHECK (test_grade BETWEEN 0 AND 100),
    project_grade  SMALLINT CHECK (project_grade BETWEEN 0 AND 100),
    -- Mean of the components entered so far; NULL until at least one is graded.
    average        NUMERIC GENERATED ALWAYS AS (round(
        (coalesce(quiz_grade, 0) + coalesce(homework_grade, 0) + coalesce(test_grade, 0) + coalesce(project_grade, 0))::numeric
        / NULLIF((quiz_grade IS NOT NULL)::int + (homework_grade IS NOT NULL)::int
               + (test_grade IS NOT NULL)::int + (project_grade IS NOT NULL)::int, 0), 1)) STORED,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, subject_id, semester)
);

CREATE TABLE notices (
    notice_id    SERIAL PRIMARY KEY,
    title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 150),
    content      TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 5000),
    audience     TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'teacher', 'student')),
    pinned       BOOLEAN NOT NULL DEFAULT false,
    publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date  DATE CONSTRAINT notices_expiry_date_check CHECK (expiry_date >= publish_date),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login accounts. Deleting a student/teacher deletes their account.
CREATE TABLE accounts (
    account_id           SERIAL PRIMARY KEY,
    email                TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
    password_hash        TEXT NOT NULL, -- argon2id PHC string, never plaintext
    role                 TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    student_id           INT UNIQUE REFERENCES students ON DELETE CASCADE,
    teacher_id           INT UNIQUE REFERENCES teachers ON DELETE CASCADE,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    token_version        INT NOT NULL DEFAULT 0, -- bumped to sign out every existing session
    last_login_at        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((role = 'student') = (student_id IS NOT NULL) AND (role = 'teacher') = (teacher_id IS NOT NULL))
);
