use actix_web::{web,HttpResponse,Responder,Error};
use sqlx::PgPool;
use crate::models::notice::Notice;

use serde::Serialize;

pub async fn get_notices(pool: web::Data<PgPool>)-> impl Responder{
    let result = sqlx::query_as::<_,Notice>("select * from notice")
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(notices) => HttpResponse::Ok().json(notices),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}