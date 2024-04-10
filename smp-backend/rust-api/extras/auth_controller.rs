use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{decode, encode, Header, Algorithm, Validation};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::generate_token;
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    sub: String,
    exp: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    token: String,
}

// pub async fn login(login_info: web::Json<LoginRequest>) -> impl Responder {
//     // Validate username and password
//     let username = &login_info.username;
//     let password = &login_info.password;

//     // Your authentication logic goes here
//     // For simplicity, let's assume authentication is successful
//     // and generate a JWT token
//     let token = match generate_token(username) {
//         Ok(t) => t,
//         Err(_) => return HttpResponse::InternalServerError().finish(),
//     };

//     HttpResponse::Ok().json(LoginResponse { token })
// }
pub async fn login(login_info: web::Json<LoginRequest>) -> impl Responder {
    // Your authentication logic goes here

    // For simplicity, let's assume authentication is successful
    // and generate a JWT token
    let token = generate_token(&login_info.username);

    match token {
        Ok(token) => HttpResponse::Ok().body(token),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}