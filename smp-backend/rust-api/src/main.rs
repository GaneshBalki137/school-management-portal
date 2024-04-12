use actix_web::{web, App, HttpServer, Responder, middleware::Logger};
use actix_cors::Cors;
use actix_web::http::header; // Import the header module

mod handlers;
// use handlers::auth_handler::{login, establish_connection}; 
use crate::handlers::auth_handler::{login, establish_connection};
// Adjust this path based on your project structure
use sqlx::PgPool;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPool::connect("postgres://postgres:ganesh@localhost/demo").await.unwrap();

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE])
            .supports_credentials();
            

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(web::Data::new(pool.clone())) // Use app_data instead of data
            .service(web::resource("/login").route(web::post().to(login)))
    })
    .bind("127.0.0.1:3000")?
    .run()
    .await
}
