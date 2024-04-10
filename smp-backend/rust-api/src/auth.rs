use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{decode, encode, Header, Algorithm, Validation};
use std::time::{SystemTime, UNIX_EPOCH};

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

fn generate_token(username: &str) -> Result<String, actix_web::Error> {
    let expiration = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 3600; // Token expires in 1 hour
    let claims = Claims {
        sub: username.to_owned(),
        exp: expiration as usize,
    };

    let token = match encode(&Header::default(), &claims, "secret_key".as_ref()) {
        Ok(t) => t,
        Err(_) => return Err(actix_web::error::ErrorInternalServerError("Failed to generate token")),
    };

    Ok(token)
}

pub async fn login(login_info: web::Json<LoginRequest>) -> impl Responder {
    // Validate username and password
    let username = &login_info.username;
    let password = &login_info.password;

    // Your authentication logic goes here
    // For simplicity, let's assume authentication is successful
    // and generate a JWT token
    let token = match generate_token(username) {
        Ok(t) => t,
        Err(_) => return HttpResponse::InternalServerError().finish(),
    };

    HttpResponse::Ok().json(LoginResponse { token })
}

pub async fn validate_token(token: String) -> Result<Claims, actix_web::Error> {
    match decode::<Claims>(&token, "secret_key".as_ref(), &Validation::new(Algorithm::HS256)) {
        Ok(token_data) => Ok(token_data.claims),
        Err(_) => Err(actix_web::error::ErrorUnauthorized("Invalid token")),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/auth/login").route(web::post().to(login)));
}
