use actix_web::{web, HttpResponse, Responder, Error};
use crate::models::student::Student;
use crate::models::teacher::Teacher;
use sqlx::PgPool;

use serde::Serialize;

pub async fn add_student(student: web::Json<Student>, pool: web::Data<PgPool>) -> impl Responder {
    let student = student.into_inner(); // Extract student data from request body
    let result = sqlx::query_as::<_, Student>(
        "INSERT INTO students (first_name, last_name, date_of_birth, gender, address, phone_number, email, addmission_date, class_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING student_id",
    )
    .bind(student.first_name)
    .bind(student.last_name)
    .bind(student.date_of_birth)
    .bind(student.gender)
    .bind(student.address)
    .bind(student.phone_number)
    .bind(student.email)
    .bind(student.addmission_date)
    .bind(student.class_id as i32)
    .fetch_one(pool.get_ref())
    .await;
    
    match result {
        Ok(inserted_student) => {
           //add login
           let password: String = match inserted_student.last_name {
            Some(last_name) => {
                // Concatenate strings if last_name is Some(String)
                let student_id = inserted_student.student_id.to_string();
                let class_id = inserted_student.class_id.to_string(); // Convert Option<i32> to String
                format!("{}@{}{}", last_name, student_id, class_id)
            }
            None => {
                // Handle the case where last_name is None
                // For example, provide a default password
                "default_password".to_string()
            }
        };
            let mut role = String::from("student");

            sqlx::query_as::<_, Student>("INSERT INTO login (username,password,role) VALUES ($1,$2,$3)",)
                .bind(inserted_student.email)
                .bind(password)
                .bind(role)
                .fetch_one(pool.get_ref())
                 .await;
            HttpResponse::Ok().body(inserted_student.student_id.to_string())
        },
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn get_all_students(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Student>("SELECT * FROM students")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(students) => HttpResponse::Ok().json(students), // Return a JSON array of students
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

// Update student handler function
pub async fn update_student(path: web::Path<i32>, // Path parameter for student_id
    new_student: web::Json<Student>, pool: web::Data<PgPool>) -> impl Responder {
    let student_id = path.into_inner(); 
    let new_student = new_student.into_inner(); 

    // Execute the update query and fetch the updated student details
    let result = sqlx::query_as::<_, Student>(
        "UPDATE students SET address = $1, phone_number = $2, email = $3, class_id = $4 WHERE student_id = $5 RETURNING *", // Fetch updated student details
    )
    .bind(new_student.address)
    .bind(new_student.phone_number)
    .bind(new_student.email)
    .bind(new_student.class_id as i32)
    .bind(student_id) 
    .fetch_one(pool.get_ref()) 
    .await;

    // Handle the result of the update query
    match result {
        Ok(updated_student) => HttpResponse::Ok().json(updated_student), 
        Err(_) => HttpResponse::InternalServerError().finish(), 
    }
}


// Delete student handler function
pub async fn delete_student(path: web::Path<i32>, pool: web::Data<PgPool>, ) -> impl Responder {
    let student_id = path.into_inner();

    let result = sqlx::query!(
        "DELETE FROM students WHERE student_id = $1", student_id
    )
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().body("Student Deleted Successfully"), 
        Err(_) => HttpResponse::InternalServerError().finish(), 
    }
}

