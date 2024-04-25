// use actix_web::{web, HttpResponse, Responder, Error, http::Cookie};
use actix_web::{web, HttpResponse, Responder};
use actix_web::cookie::Cookie;

use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, Header, EncodingKey};
use std::time::{SystemTime, UNIX_EPOCH};
use sqlx::{prelude::FromRow,PgPool,Error};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
    pub user_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub login_id: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    
}

#[derive(Debug, Serialize, Deserialize,FromRow)]
pub struct UserCredentials {
    pub login_id: String,
    pub password: String,
    pub role: String,
    pub user_id: i32
}

fn generate_token(login_id: &str, role: &str, user_id: &i32) -> Result<String, String> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + 3600; // Token expires in 1 hour
    let claims = Claims {    // claim - payload that we want to include in JWT
        sub: login_id.to_owned(),
        role: role.to_owned(),
        user_id: user_id.to_owned(),
        exp: expiration as usize,
    };

    let secret_key = "I3gfhgeugjdhHFDjhdrdFTRgGYTFu873t";
    let encoding_key = EncodingKey::from_secret(secret_key.as_bytes()); // creates an encoding key from the secret key 
                                                      //used to sign the JWT to ensure its integrity and authenticity

    encode(&Header::default(), &claims, &encoding_key) 
        .map_err(|_| "Failed to generate token".to_owned())

    // encodes a JWT token using the provided header (Header::default()), claims (&claims), and encoding 
    // key (&encoding_key)
}

   
pub async fn user_login(
    login_info: web::Json<LoginRequest>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    let result: Result<UserCredentials, Error> = sqlx::query_as::<_, UserCredentials>(
        "SELECT * FROM login WHERE login_id = $1 and password = $2",
    )
    .bind(&login_info.login_id)
    .bind(&login_info.password)
    .fetch_one(pool.get_ref())
    .await;
    
    match result {
        Ok(user) => {
            match generate_token(&login_info.login_id, &user.role, &user.user_id) {
                Ok(token) => {
                    // Create cookie containing login ID and role
                    let cookie = Cookie::build("authorization", &token) // Corrected here
                        .http_only(false) // explicitly specifying that the cookie can be accessed by client-side scripts
                        .finish();

                    // Create HTTP response with cookie and token in JSON body
                    HttpResponse::Ok()
                        .cookie(cookie)
                        .json(LoginResponse { token })
                }
                Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Failed to generate token".to_owned() }),
            }
        }
        Err(_) => HttpResponse::NotFound().json(LoginResponse { token: "User not found".to_owned() }),
    }
}

pub async fn change_password(    creds: web::Json<LoginRequest>,
    pool: web::Data<PgPool>,) -> impl Responder{
        let credentials= creds.into_inner();
        let result = sqlx::query(
            "UPDATE login SET password = $1 WHERE login_id = $2",
        )
        .bind(&credentials.password)
        .bind(&credentials.login_id)
        .execute(pool.get_ref())
        .await;
    match result {
        Ok(_) => {
            let response=json!({
                "message": "Password changed"
            });
            HttpResponse::Ok().json(response)
        },
        Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Failed to change password".to_owned() }),
    }

    }

