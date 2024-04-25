use crate::models::{student::Student,timetable};
use actix_web::{web, HttpResponse, Responder};
use serde::{Serialize,Deserialize};
use sqlx::{prelude::FromRow, PgPool};

pub async fn get_student_by_class(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder {
    let class_id = path.into_inner();
    let result = sqlx::query_as::<_, Student>("SELECT * FROM students WHERE class_id = $1")
        .bind(class_id)
        .fetch_all(pool.get_ref())
        .await;
    match result {
        Ok(students) => HttpResponse::Ok().json(students),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}
#[derive(Debug, Serialize, Deserialize, FromRow)]
struct GradeWithSubjectName {
    grade_id: i32,
    semester: i32,
    student_id: i32,
    subject_id: i32,
    quiz_grade: i32,
    homework_grade: i32,
    test_grade: i32,
    project_grade: i32,
    subject_name: Option<String>,
}

pub async fn get_grades_of_sem(
    path: web::Path<(i32, i32)>, 
    pool: web::Data<PgPool>,
) -> impl Responder {
    let (student_id, semester) = path.into_inner(); 

    let sql = "
        SELECT g.*, s.subject_name
        FROM grades AS g
        INNER JOIN subjects AS s ON g.subject_id = s.subject_id
        INNER JOIN students AS st ON g.student_id = st.student_id
        WHERE g.student_id = $1 AND g.semester = $2
          AND st.class_id = s.class_id
    ";
    
    // Fetch grades and corresponding subject names for the specified student_id and semester
    match sqlx::query_as::<_, GradeWithSubjectName>(&sql)
        .bind(student_id)
        .bind(semester)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(grades) => HttpResponse::Ok().json(grades),
        Err(e) => {
            eprintln!("Error fetching grades: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Debug, Serialize, Deserialize,FromRow)]
struct AttendanceRecord {
    attendance_id: i32,
    date: String,
    status: String,
    class_id: i32,
    subject_id: i32,
    student_id: i32,
    subject_name: String,
}
pub async fn get_attendance_for_student(
    student_id: web::Path<i32>, 
    pool: web::Data<PgPool>,
) -> impl Responder {
    let student_id = student_id.into_inner();
      let sql=" SELECT a.*, s.subject_name
      FROM attendance AS a
      INNER JOIN subjects AS s ON a.subject_id = s.subject_id
      WHERE a.student_id = $1";

      match sqlx::query_as::<_,AttendanceRecord>(&sql)
       .bind(student_id)
       .fetch_all(pool.get_ref())
       .await
       {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(e) => {
            eprintln!("Error fetching grades: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
     
}
pub async fn get_timetable_for_student(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder{
    let student_id = path.into_inner();
    let query="SELECT t.* FROM timetable AS t
    INNER JOIN students AS s ON t.class_id = s.class_id
    WHERE s.student_id = $1";
    let result = sqlx::query_as::<_,timetable::Timetable>(&query)
       .bind(&student_id)
       .fetch_all(pool.get_ref())
       .await;
    match result {
        Ok(timetable) => HttpResponse::Ok().json(timetable),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

use sqlx::Result;


// Define a struct to represent the result of the query
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UpcomingLecture {
    pub subject_name: Option<String>,
    pub start_time: Option<String>,
}

pub async fn get_todays_lectures(
    path: web::Path<(i32,String)>, 
    pool: web::Data<PgPool>,
) -> impl Responder {
    let (student_id,day_of_week) = path.into_inner();

    let query = "
    SELECT t.subject_name, t.start_time 
    FROM timetable t
    INNER JOIN students s ON t.class_id = s.class_id
    WHERE s.student_id = $1 
      AND t.day_of_week = $2 
    ORDER BY t.start_time ASC 
    LIMIT 5
    ";

    match sqlx::query_as::<_, UpcomingLecture>(query
    )
    .bind(student_id)
    .bind(day_of_week)
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(lectures) => HttpResponse::Ok().json(lectures),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}