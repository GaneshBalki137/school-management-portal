use actix_web::{web,HttpResponse,Error,Responder};
use crate::models::student::{Student};
use sqlx::PgPool;
use serde::Serialize;

pub async fn get_student_by_class(path: web::Path<i32>,pool: web::Data<PgPool>)-> impl Responder{
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

