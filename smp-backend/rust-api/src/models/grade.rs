use serde::{Serialize, Deserialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Grade {
        pub grade_id: i32,
        pub semester: i32,
        pub student_id: i32,
        pub subject_id: i32,
        pub quiz_grade: i32,
        pub homework_grade: i32,
        pub test_grade: i32,
        pub project_grade: i32,
}
