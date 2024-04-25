use actix_web::{web,HttpResponse,Responder};
use sqlx::PgPool;
use crate::models::notice::Notice;

pub async fn get_notices(pool: web::Data<PgPool>)-> impl Responder{
    print!("get_notices");
    let result = sqlx::query_as::<_,Notice>("select * from notice")
    .fetch_all(pool.get_ref())
    .await;
    match result {
        Ok(notices) => HttpResponse::Ok().json(notices),
        Err(e) =>{ println!(" e = {:?}",e);
             HttpResponse::InternalServerError().finish()},
    }
}