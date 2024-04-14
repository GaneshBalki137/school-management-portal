use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Debug,Serialize,Deserialize,FromRow)]
pub struct Timetable {
    timetable_id: i32,
    day_of_week: Option<String>,
    start_time: Option<String>,
    end_time: Option<String>,
    subject_name: Option<String>,
    class_id: i32,
    subject_id: i32,
    teacher_id: i32
}