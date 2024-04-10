use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer};
use jsonwebtoken::{decode, encode, Algorithm, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

mod auth_controller;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    sub: String,
    exp: usize,
}

fn generate_token(username: &str) -> Result<String, actix_web::Error> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + 3600; // Token expires in 1 hour
    let claims = Claims {
        sub: username.to_owned(),
        exp: expiration as usize,
    };

    let secret_key = "your_secret_key";
    let encoding_key = jsonwebtoken::EncodingKey::from_secret(secret_key.as_ref());

    encode(&Header::default(), &claims, &encoding_key)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to generate token"))
        .map(|token| token.into())
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
