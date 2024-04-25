use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Subject {
    pub subject_id: i32,
    pub subject_name: Option<String>,
    pub class_id: i32,
    pub teacher_id: i32
}