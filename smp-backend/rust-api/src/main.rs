use actix_web::{web, App, HttpServer, Responder, middleware::Logger};
use actix_cors::Cors;
use actix_web::http::header; // Import the header module

mod handlers;
// use handlers::auth_handler::{login, establish_connection}; 
use crate::handlers::auth_handler::{login, establish_connection};
// Adjust this path based on your project structure
use sqlx::PgPool;
use crate::handlers::admin::{add_student,get_all_students,update_student,delete_student,
                             add_teacher,get_all_teachers,update_teacher,delete_teacher};
use crate::handlers::shared::{get_notices};
use crate::handlers::teacher::{get_timetable};
use crate::handlers::student::{get_student_by_class};
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPool::connect("postgres://postgres:hash@localhost/demo").await.unwrap();

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
            .service(web::resource("/add_teacher").route(web::post().to(add_teacher)))
            .service(web::resource("/get_all_teachers").route(web::get().to(get_all_teachers)))
            .service(web::resource("/update_teacher/{teacher_id}").route(web::put().to(update_teacher)))
            .service(web::resource("/delete_teacher/{teacher_id}").route(web::delete().to(delete_teacher)))
            .service(web::resource("/get/all/notices").route(web::get().to(get_notices)))
            .service(web::resource("/get_timetable/{teacher_id}/{day_of_week}").route(web::get().to(get_timetable)))
            .service(web::resource("/get/student-by/class/{class_id}").route(web::get().to(get_student_by_class)))

    })
    .bind("127.0.0.1:3000")?
    .run()
    .await
}
