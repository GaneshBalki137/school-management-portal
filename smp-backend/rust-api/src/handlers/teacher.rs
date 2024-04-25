use actix_web::{web::{self}, HttpResponse, Responder};
use crate::models::{attendance, grade, student, subject, timetable};
use sqlx::PgPool;
use reqwest;
use serde::{Serialize,Deserialize};
use serde_json::json;

pub async fn get_timetable(path: web::Path<(i32, String)>, pool: web::Data<PgPool>) -> impl Responder{
    let (teacher_id, day_of_week) = path.into_inner();

    let result = sqlx::query_as::<_, timetable::Timetable>("SELECT * FROM timetable WHERE teacher_id = $1 AND day_of_week = $2")
        .bind(teacher_id)
        .bind(day_of_week)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(timetables) =>HttpResponse::Ok().json(timetables),
        
        Err(e) => {
            eprintln!("Error fetching timetables: {:?}", e);
           HttpResponse::InternalServerError().finish()
        }
    }
}
pub async fn get_timetable_by_day_hour(path: web::Path<(i32, String, String)>, pool: web::Data<PgPool>) -> impl Responder{
    let (teacher_id, day_of_week,current_hour) = path.into_inner();

    let result = sqlx::query_as::<_, timetable::Timetable>("SELECT * FROM timetable WHERE teacher_id = $1 AND day_of_week = $2 And start_time = $3")
        .bind(teacher_id)
        .bind(day_of_week)
        .bind(current_hour)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(timetables) =>HttpResponse::Ok().json(timetables),
        
        Err(e) => {
            eprintln!("Error fetching timetables: {:?}", e);
           HttpResponse::InternalServerError().finish()
        }
    }
}
pub async fn get_teacher_schedule(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder{
    let teacher_id = path.into_inner();

    let result = sqlx::query_as::<_, timetable::Timetable>("SELECT * FROM timetable WHERE teacher_id = $1")
        .bind(teacher_id)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(schedule) => HttpResponse::Ok().json(schedule),
        
        Err(e) => {
            eprintln!("Error fetching subjects: {:?}", e);
           HttpResponse::InternalServerError().finish()
        }
    }
}
pub async fn get_subjects(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder{
    let teacher_id=path.into_inner();

    let result= sqlx::query_as::<_,subject::Subject>("SELECT * FROM subjects where teacher_id = $1")
    .bind(teacher_id)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(subjects) =>HttpResponse::Ok().json(subjects),
        
        Err(e) => {
            eprintln!("Error fetching subjects: {:?}", e);
           HttpResponse::InternalServerError().finish()
        }
    }



}
    

pub async fn get_students_by_class(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder {
    let class_id = path.into_inner();

    let result = sqlx::query_as::<_, student::Student>("SELECT * FROM students where class_id = $1 ORDER BY student_id ASC")
        .bind(class_id)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(students) => HttpResponse::Ok().json(students),
        Err(e) => {
            eprintln!("Error fetching students: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn get_grades_for_subject_semester_student(path: web::Path<(i32,i32,i32)>, pool: web::Data<PgPool>) -> impl Responder{
    print!("grade");
    let (subject_id,student_id,semester)=path.into_inner();
    let result = sqlx::query_as::<_,grade::Grade>(
        "SELECT * FROM grades WHERE subject_id = $1 AND student_id = $2 AND semester = $3",
    )
    .bind(subject_id)
    .bind(student_id)
    .bind(semester)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(grade) => HttpResponse::Ok().json(grade.get((0))),
        Err(e) => {
            eprintln!("Error fetching grades: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
pub async fn add_grade(grades: web::Json<grade::Grade>, pool: web::Data<PgPool> ) -> impl Responder{
    let grade =grades.into_inner();
    let result = sqlx::query_as::<_,grade::Grade>(
        "INSERT INTO grades (semester,student_id,subject_id,quiz_grade,homework_grade,test_grade,project_grade) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    )
    .bind(grade.semester)
    .bind(grade.student_id)
    .bind(grade.subject_id)
    .bind(grade.quiz_grade)
    .bind(grade.homework_grade)
    .bind(grade.test_grade)
    .bind(grade.project_grade)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(inserted_grade) => HttpResponse::Ok().json(inserted_grade),
        Err(e) => {
            eprintln!("Error inserting grade: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }



}

pub async fn update_grade(grade: web::Json<grade::Grade>, pool: web::Data<PgPool> ) -> impl Responder{
    let grade =grade.into_inner();
    let result = sqlx::query(
        "UPDATE grades SET quiz_grade = $1, homework_grade = $2, test_grade = $3, project_grade = $4 WHERE semester = $5 AND student_id = $6 AND subject_id = $7",
    )
    .bind(grade.quiz_grade)
    .bind(grade.homework_grade)
    .bind(grade.test_grade)
    .bind(grade.project_grade)
    .bind(grade.semester)
    .bind(grade.student_id)
    .bind(grade.subject_id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(updated_grade) => HttpResponse::Ok().finish(),
        Err(e) => {
            eprintln!("Error updating grade: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }

}


#[derive(Serialize)]
struct ResponseMessage {
    message: String,
}

pub async fn submit_attendance(path: web::Path<i32>,data: web::Json<attendance::Attendance>, pool: web::Data<PgPool>) -> impl Responder{
    let subject_id =path.into_inner();
    let attendance = data.into_inner();

     // Convert student data to JSON
     let json_data = json!({
        "attendance_id": attendance.attendance_id,
        "date": attendance.date,
        "status": attendance.status,
        "class_id": attendance.class_id,
        "subject_id": attendance.subject_id,
        "student_id": attendance.student_id
    });

  // Send HTTP POST request to go service
    let client = reqwest::Client::new();
    let result = client.post("http://localhost:8080/add-attendance")
        .header("Content-Type", "application/json")
        .body(json_data.to_string())
        .send()
        .await;    
    let response_message = ResponseMessage {
        message: "data send to go cron service".to_string(),
    };
    match result {
        Ok(_) =>{
            print!("{:?}",result);
            HttpResponse::Ok().json(response_message)
        },
        Err(e) => {
            eprintln!("Error submitting attendance: {:?}", e);
            HttpResponse::InternalServerError().finish()
        },
    }
}


use redis::Commands; 
// Define a response struct
#[derive(Debug, Serialize, Deserialize)]
struct TotalClassesResponse {
    total_classes: Option<i32>,
    total_subjects: Option<i32>,
    total_lectures: Option<i32>,
}
// Define the handler function
pub async fn get_total_classes_for_teacher(
    teacher_id: web::Path<i32>,
) -> impl Responder {
    // Retrieve teacher ID from the path
    let teacher_id = teacher_id.into_inner();

    // Create a Redis connection
    let redis_client = redis::Client::open("redis://127.0.0.1/").unwrap();
    let mut connection = redis_client.get_connection().unwrap();

    // Fetch total subjects from Redis
    let total_subjects: Option<i32> = connection.get(&format!("total_subjects:{}", teacher_id))
        .unwrap_or(None); // Handle case where key doesn't exist

    // Fetch total classes from Redis
    let total_classes: Option<i32> = connection.get(&format!("total_classes:{}", teacher_id))
        .unwrap_or(None); // Handle case where key doesn't exist

    let total_lectures: Option<i32> = connection.get(&format!("total_lectures:{}", teacher_id))
    .unwrap_or(None); // Handle case where key doesn't exist

    // Return the total classes as JSON response
    HttpResponse::Ok().json(TotalClassesResponse { total_classes,total_subjects,total_lectures })
}