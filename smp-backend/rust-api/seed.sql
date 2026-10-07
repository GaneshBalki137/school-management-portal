-- Demo data for trying the portal out. NOT for a real school.
--
-- Start the API once first (it creates the tables and the admin), then run:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f seed.sql
--
-- Every demo teacher and student signs in with the password  Demo@2026
-- Teachers: <first>.<last>@school.local  e.g. anita.sharma@school.local
-- Students: listed on the admin Students page, e.g. aarav.patel1@school.local

BEGIN;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM students) OR EXISTS (SELECT 1 FROM teachers) THEN
        RAISE EXCEPTION 'This database already has students or teachers. Seed only an empty database.';
    END IF;
    PERFORM setseed(0.42); -- same "random" data on every run
END $$;


-- One teacher per subject. Each teaches that subject in every class.
INSERT INTO teachers (first_name, last_name, date_of_birth, gender, email, phone_number, qualification, subject_name, hire_date)
VALUES
    ('Anita',   'Sharma',  '1982-03-14', 'Female', 'anita.sharma@school.local',   '+91 98200 11001', 'M.Sc Mathematics, B.Ed', 'Mathematics',      '2015-06-01'),
    ('Rahul',   'Verma',   '1986-07-22', 'Male',   'rahul.verma@school.local',    '+91 98200 11002', 'M.Sc Physics, B.Ed',     'Science',          '2017-06-01'),
    ('Priya',   'Nair',    '1990-11-05', 'Female', 'priya.nair@school.local',     '+91 98200 11003', 'M.A English',            'English',          '2019-06-01'),
    ('Suresh',  'Iyer',    '1978-01-30', 'Male',   'suresh.iyer@school.local',    '+91 98200 11004', 'M.A Hindi',              'Hindi',            '2012-06-01'),
    ('Kavita',  'Desai',   '1984-09-18', 'Female', 'kavita.desai@school.local',   '+91 98200 11005', 'M.A History, B.Ed',      'Social Studies',   '2016-06-01'),
    ('Imran',   'Khan',    '1992-04-09', 'Male',   'imran.khan@school.local',     '+91 98200 11006', 'MCA',                    'Computer Science', '2021-06-01');

-- Classes 6 to 10, eight students each.
INSERT INTO students (first_name, last_name, date_of_birth, gender, email, phone_number, address,
                      class_id, guardian_name, guardian_phone, admission_date)
SELECT f.name, l.name,
       make_date(2026 - c - 6, 1 + (n * 5) % 12, 1 + (n * 7) % 28),
       f.gender,
       lower(f.name || '.' || l.name || ((c - 6) * 8 + n)) || '@school.local',
       '', (10 + n) || ' MG Road, Pune',
       c, g.name || ' ' || l.name, '+91 97000 ' || lpad(((c - 6) * 8 + n)::text, 5, '0'),
       make_date(2026 - (c - 6) % 4, 6, 1)
FROM generate_series(6, 10) c
CROSS JOIN generate_series(1, 8) n
JOIN LATERAL (SELECT (ARRAY['Aarav','Diya','Vihaan','Ananya','Aditya','Ishita','Arjun','Saanvi','Kabir','Myra',
                            'Reyansh','Aanya','Krish','Pari','Rohan','Tara'])[1 + ((c * 3 + n) % 16)] AS name,
                     CASE WHEN ((c * 3 + n) % 16) % 2 = 0 THEN 'Male' ELSE 'Female' END AS gender) f ON true
JOIN LATERAL (SELECT (ARRAY['Patel','Gupta','Reddy','Mehta','Joshi','Kulkarni','Singh','Bose','Menon','Chopra'])
                     [1 + ((c + n * 3) % 10)] AS name) l ON true
JOIN LATERAL (SELECT (ARRAY['Rajesh','Sunita','Manoj','Neha','Amit','Pooja'])[1 + (n % 6)] AS name) g ON true;

INSERT INTO subjects (subject_name, class_id, teacher_id)
SELECT t.subject_name, c, t.teacher_id FROM teachers t CROSS JOIN generate_series(6, 10) c;

-- Rotating timetable: 6 periods a day, Mon-Sat. At any hour each class has a different subject,
-- so no teacher is ever in two places at once.
INSERT INTO timetable (class_id, subject_id, day_of_week, start_hour)
SELECT c, s.subject_id, d, (ARRAY[8, 9, 10, 11, 13, 14])[p + 1]
FROM generate_series(6, 10) c
CROSS JOIN generate_series(1, 6) d
CROSS JOIN generate_series(0, 5) p
JOIN subjects s ON s.class_id = c
 AND s.teacher_id = (SELECT teacher_id FROM teachers ORDER BY teacher_id OFFSET (p + c + d) % 6 LIMIT 1);

-- Last 30 days of attendance for every lecture. A few students are often absent,
-- so the "low attendance" alerts have something to show.
WITH lectures AS MATERIALIZED ( -- materialized so random() is drawn once per row
    SELECT st.student_id, tt.subject_id, day::date AS date, s.teacher_id,
           random() AS r, st.student_id % 9 = 0 AS often_absent
    FROM generate_series(CURRENT_DATE - 30, CURRENT_DATE - 1, interval '1 day') day
    JOIN timetable tt ON tt.day_of_week = extract(isodow FROM day)
    JOIN subjects s ON s.subject_id = tt.subject_id
    JOIN students st ON st.class_id = tt.class_id)
INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
SELECT student_id, subject_id, date,
       CASE WHEN r < (CASE WHEN often_absent THEN 0.35 ELSE 0.06 END) THEN 'A'
            WHEN r < (CASE WHEN often_absent THEN 0.40 ELSE 0.10 END) THEN 'L'
            ELSE 'P' END,
       teacher_id
FROM lectures;

-- Semester 1 fully graded, semester 2 in progress (quiz and homework only).
INSERT INTO grades (student_id, subject_id, semester, quiz_grade, homework_grade, test_grade, project_grade)
SELECT st.student_id, s.subject_id, sem,
       least(100, greatest(0, base + (random() * 20 - 10)::int)),
       least(100, greatest(0, base + (random() * 20 - 5)::int)),
       CASE WHEN sem = 1 THEN least(100, greatest(0, base + (random() * 24 - 12)::int)) END,
       CASE WHEN sem = 1 THEN least(100, greatest(0, base + (random() * 16 - 4)::int)) END
FROM students st
JOIN subjects s ON s.class_id = st.class_id
CROSS JOIN generate_series(1, 2) sem
CROSS JOIN LATERAL (SELECT 45 + (st.student_id * 37 + s.subject_id * 11) % 45 AS base) b;

INSERT INTO notices (title, content, audience, pinned, publish_date, expiry_date) VALUES
    ('Welcome to the new school portal',
     'Check your timetable, attendance and report card here. Please change your password after your first sign-in.',
     'all', true, CURRENT_DATE - 7, NULL),
    ('Half-yearly exams begin next month',
     'The exam timetable will be shared in class. Revise regularly and ask your teachers if you need help.',
     'student', false, CURRENT_DATE - 2, CURRENT_DATE + 40),
    ('Staff meeting on Friday',
     'All teachers please meet in the staff room at 3:30 PM to plan the annual day.',
     'teacher', false, CURRENT_DATE - 1, CURRENT_DATE + 5),
    ('Annual Day celebrations',
     'Parents are invited to the Annual Day function in the school auditorium. Students taking part will get a separate schedule.',
     'all', false, CURRENT_DATE, CURRENT_DATE + 30);

-- Logins for everyone above, all with the demo password (argon2id hash of Demo@2026).
INSERT INTO accounts (email, password_hash, role, teacher_id, must_change_password)
SELECT email, '$argon2id$v=19$m=19456,t=2,p=1$QQAU6wLexxmi4Bh4tSe91g$W5M8JsWqnTzsMZzrM1G5tLXvK1Ud3Q91rgf5jWbCQ/0',
       'teacher', teacher_id, false
FROM teachers;

INSERT INTO accounts (email, password_hash, role, student_id, must_change_password)
SELECT email, '$argon2id$v=19$m=19456,t=2,p=1$QQAU6wLexxmi4Bh4tSe91g$W5M8JsWqnTzsMZzrM1G5tLXvK1Ud3Q91rgf5jWbCQ/0',
       'student', student_id, false
FROM students;

COMMIT;
