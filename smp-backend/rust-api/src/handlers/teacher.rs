use actix_web::{web, Error, HttpResponse, Responder};
use crate::models::timetable;
use sqlx::PgPool;

use serde::Serialize;

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
