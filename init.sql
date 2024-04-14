CREATE TABLE public.Class (
    class_id SERIAL PRIMARY KEY,
    class_name INT
);

CREATE TABLE public.Student (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(50),
    admission_date DATE,
    class_id INT REFERENCES public.Class(class_id)
);

CREATE TABLE public.Teacher (
    teacher_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(50),
    hire_date DATE,
    qualification TEXT,
    subject_name VARCHAR(50)
);

CREATE TABLE public.Subject (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(50),
    class_id INT REFERENCES public.Class(class_id),
    teacher_id INT REFERENCES public.Teacher(teacher_id)
);

CREATE TABLE public.Attendance (
    attendance_id SERIAL PRIMARY KEY,
    date DATE,
    status VARCHAR(10),
    class_id INT REFERENCES public.Class(class_id),
    student_id INT REFERENCES public.Student(student_id),
    subject_id INT REFERENCES public.Subject(subject_id)
);

CREATE TABLE public.Grade (
    grade_id SERIAL PRIMARY KEY,
    score INT, 
    semester INT,
    student_id INT REFERENCES public.Student(student_id),
    subject_id INT REFERENCES public.Subject(subject_id)
);

CREATE TABLE public.Notice (
    notice_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    publish_date DATE,
    expiry_date DATE
);

CREATE TABLE public.Timetable (
    timetable_id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(20),
    start_time TIME,
    end_time TIME,
    class_id INT REFERENCES public.Class(class_id),
    subject_id INT REFERENCES public.Subject(subject_id),
    teacher_id INT REFERENCES public.Teacher(teacher_id)
);

CREATE TABLE public.Login (
    login_id VARCHAR(50),
    password VARCHAR(100),
    role VARCHAR(20)
);