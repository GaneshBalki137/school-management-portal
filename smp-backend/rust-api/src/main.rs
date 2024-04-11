use axum::{handler::post, http::header::AUTHORIZATION, Router};
use serde::{Deserialize, Serialize};
use dotenv::dotenv;
use sqlx::{postgres::PgPoolOptions,Pool,Postgres};
mod handlers;
use handlers::auth_handler::login;
use tower_http::cors::CorsLayer;
use tower_http::cors::AllowOrigin;
use axum::http::HeaderValue;
use axum::http::Method;
use axum::http::header::{ ACCEPT, CONTENT_TYPE};


#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    sub: String,
    exp: usize,
}

#[tokio::main]
async fn main() {

    dotenv().ok();

    // DB_CONNECTION
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = match PgPoolOptions::new()
        .connect(&db_url)   
        .await
        //.expect("Error connecting to database: {}", e)
        {
            Ok(pool) => {
                println!("Connection Succesfully established");
            }
            Err(e) => {
                eprintln!("Error connecting to database: {}", e);
                std::process::exit(1);
            } 
        };       

    axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

