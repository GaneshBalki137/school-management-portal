use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Attendance {
    pub attendance_id: u32, // Primary key
    pub date: String,
    pub status: String,
    pub class_id: u32,
    pub subject_id: u32,
    pub student_id: u32, 
} 