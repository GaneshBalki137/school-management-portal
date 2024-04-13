use actix_web::{web, App, HttpServer, Responder, middleware::Logger};
use actix_cors::Cors;
use actix_web::http::header; // Import the header module

mod handlers;
// use handlers::auth_handler::{login, establish_connection}; 
use crate::handlers::auth_handler::{login, establish_connection};
// Adjust this path based on your project structure
use sqlx::PgPool;
use crate::handlers::admin::{add_student,get_all_students,update_student,delete_student};
mod models;
//add_teacher,get_all_teachers,update_teacher,delete_teacher

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPool::connect("postgres://postgres:hash@localhost/smp_db").await.unwrap();

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST","DELETE","PUT"])
            .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE])
            .supports_credentials();
            

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(web::Data::new(pool.clone())) // Use app_data instead of data
            .service(web::resource("/login").route(web::post().to(login)))
            .service(web::resource("/add_student").route(web::post().to(add_student)))
            .service(web::resource("/get_all_students").route(web::get().to(get_all_students)))
            .service(web::resource("/update_student/{student_id}").route(web::put().to(update_student)))
            .service(web::resource("/delete_student/{student_id}").route(web::delete().to(delete_student)))
            // .service(web::resource("/add_teacher").route(web::post().to(add_teacher)))
            // .service(web::resource("/get_all_teachers").route(web::get().to(get_all_teachers)))
            // .service(web::resource("/update_teacher/{teacher_id}").route(web::put().to(update_teacher)))
            // .service(web::resource("/delete_teacher/{teacher_id}").route(web::delete().to(delete_teacher)))
    })
    .bind("127.0.0.1:3000")?
    .run()
    .await
}
