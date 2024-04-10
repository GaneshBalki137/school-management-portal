use axum::{handler::post, Router};
use serde::{Deserialize, Serialize};
use jsonwebtoken::EncodingKey;
use tokio_postgres::{Client, NoTls};
mod handlers;
use handlers::auth_handler::login;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    sub: String,
    exp: usize,
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/login", post(login));
    
    axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

