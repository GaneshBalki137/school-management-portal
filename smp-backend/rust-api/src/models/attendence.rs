struct Attendance {
    attendance_id: u32 // Primary key
    date: NaiveDate,
    status: String,
    subject_id: u32,
    student_id: u32, 
} 