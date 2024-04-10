struct Timetable {
    timetable_id: u32,
    day_of_week: String,
    start_time: NaiveTime,
    end_time: NaiveTime,
    class_id: u32,
    subject_id: u32,
    teacher_id: u32
}