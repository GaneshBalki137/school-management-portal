use actix_web::{web, HttpResponse, Responder, Error};
use crate::models::{student::Student, teacher::Teacher};
use sqlx::PgPool;
use serde_json::json;
use redis::Commands;

pub async fn add_student(data: web::Json<Student>) -> impl Responder {

    println!("Inside add student");
    // Access the student data from the JSON payload
    let student = data.into_inner();

    // Convert student data to JSON
    let json_data = json!({
        "student_id": student.student_id,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "date_of_birth": student.date_of_birth,
        "gender": student.gender,
        "address": student.address,
        "phone_number": student.phone_number,
        "email": student.email,
        "admission_date": student.addmission_date,
        "class_id": student.class_id,
    });

    // Send HTTP POST request to Python service
    let client = reqwest::Client::new();
    let res = client.post("http://localhost:5000/store-student-data")
        .header("Content-Type", "application/json")
        .body(json_data.to_string())
        .send()
        .await;

    match res {
        Ok(_) => HttpResponse::Ok().body("Student data sent to Python service"),
        Err(e) => HttpResponse::InternalServerError().body(format!("Error: {}", e)),
    }
}

pub async fn add_teacher(data: web::Json<Teacher>) -> impl Responder {
    // Access the teacher data from the JSON payload
    let teacher = data.into_inner();
    print!("add_teacher");
    // Convert teacher data to JSON
    let json_data = json!({
        "teacher_id": teacher.teacher_id,
        "first_name": teacher.first_name,
        "last_name": teacher.last_name,
        "date_of_birth": teacher.date_of_birth,
        "gender": teacher.gender,
        "address": teacher.address,
        "phone_number": teacher.phone_number,
        "email": teacher.email,
        "hire_date": teacher.hire_date,
        "qualification": teacher.qualification,
        "subject_name": teacher.subject_name,
    });

    // Send HTTP POST request to Python service
    let client = reqwest::Client::new();
    let res = client.post("http://localhost:5000/store-teacher-data")
        .header("Content-Type", "application/json")
        .body(json_data.to_string())
        .send()
        .await;

        match res {
            Ok(_) => HttpResponse::Ok().body("Teacher data sent to Python service"),
            Err(e) => HttpResponse::InternalServerError().body(format!("Error: {}", e)),
        }   
}

pub async fn get_total_count() -> impl Responder {
    println!("INside total count");
    
    let redis_client = redis::Client::open("redis://127.0.0.1/").unwrap();
    let mut connection = redis_client.get_connection().unwrap();

    // Get the value of "student_count" key from Redis
    let total_students: Option<i32> = connection.get("student_count").unwrap_or(None);
    let total_teachers: Option<i32> = connection.get("teacher_count").unwrap_or(None);

    HttpResponse::Ok().json(json!({"student_count": total_students,"teacher_count": total_teachers}))
}
