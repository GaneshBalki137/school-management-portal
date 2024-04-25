use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Timetable {
    pub timetable_id: i32,
    pub day_of_week: String,
    pub subject_name: String,
    pub start_time: String,
    pub end_time: String,
    pub class_id: i32,
    pub subject_id: i32,
    pub teacher_id: i32
}