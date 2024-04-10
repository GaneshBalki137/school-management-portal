use actix_web::{middleware::Logger, web, App,HttpServer};
use serde::{Deserialize, Serialize};

mod auth_controller;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    sub: String,
    exp: usize,
}


#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .service(web::resource("/login").route(web::post().to(auth_controller::login)))
    })
    .bind("127.0.0.1:3000")?
    .run()
    .await
}
