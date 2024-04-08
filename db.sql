-- Student table
CREATE TABLE Student (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    admission_date DATE,
    class_id INT REFERENCES Class(class_id)
);

-- Teacher table
CREATE TABLE Teacher (
    teacher_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    hire_date DATE,
    qualification TEXT
);

-- Class table
CREATE TABLE Class (
    class_id SERIAL PRIMARY KEY,
    class_name VARCHAR(100)
);

-- Subject table
CREATE TABLE Subject (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100),
    class_id INT REFERENCES Class(class_id),
    teacher_id INT REFERENCES Teacher(teacher_id)
);

-- Attendance table
CREATE TABLE Attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Student(student_id),
    subject_id INT REFERENCES Subject(subject_id),
    date DATE,
    status VARCHAR(10) -- e.g., Present, Absent, Leave
);

-- Grade table
CREATE TABLE Grade (
    grade_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Student(student_id),
    subject_id INT REFERENCES Subject(subject_id),
    score DECIMAL(5, 2) -- Assuming scores are stored as decimals
);

-- Notice table
CREATE TABLE Notice (
    notice_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    publish_date DATE,
    expiry_date DATE
);

-- Timetable table
CREATE TABLE Timetable (
    timetable_id SERIAL PRIMARY KEY,
    class_id INT REFERENCES Class(class_id),
    subject_id INT REFERENCES Subject(subject_id),
    teacher_id INT REFERENCES Teacher(teacher_id),
    day_of_week VARCHAR(20),
    start_time TIME,
    end_time TIME
);

-- Login table (assuming role is a simple string)
CREATE TABLE Login (
    login_id VARCHAR(100) PRIMARY KEY,
    password VARCHAR(100),
    role VARCHAR(20)
);