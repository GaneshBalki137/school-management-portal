// use actix_web::{web, HttpResponse, Responder, Error};
// use serde::{Deserialize, Serialize};
// use jsonwebtoken::{encode, Header, EncodingKey};
// use std::time::{SystemTime, UNIX_EPOCH};
// use sqlx::{PgPool, Pool, Postgres,PgConnection};
// use actix_web::error::ResponseError;
// use sqlx::Row;

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Claims {
//     pub sub: String,
//     pub role: String,
//     pub exp: usize,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct LoginRequest {
//     pub login_id: String,
//     pub password: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct LoginResponse {
//     pub token: String,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub struct UserCredentials {
//     pub login_id: String,
//     pub password: String,
//     pub role: String,
// }

// fn generate_token(login_id: &str, role: &str) -> Result<String, String> {
//     let expiration = SystemTime::now()
//         .duration_since(UNIX_EPOCH)
//         .unwrap()
//         .as_secs()
//         + 3600; // Token expires in 1 hour
//     let claims = Claims {
//         sub: login_id.to_owned(),
//         role: role.to_owned(),
//         exp: expiration as usize,
//     };

//     let secret_key = "your_secret_key";
//     let encoding_key = EncodingKey::from_secret(secret_key.as_bytes());

//     encode(&Header::default(), &claims, &encoding_key)
//         .map_err(|_| "Failed to generate token".to_owned())
// }




// pub async fn login(login_info: web::Json<LoginRequest>) -> impl Responder {
//     match establish_connection().await {
//         Ok(pool) => {
//             match pool.acquire().await {
//                 Ok(mut client) => {
//                     match sqlx::query("SELECT * FROM login WHERE login_id = $1 and password = $2")
//                         .bind(&login_info.login_id)
//                         .bind(&login_info.password)
//                         .fetch_one(&mut client)
//                         .await
//                     {
//                         Ok(row) => {
//                             let user = UserCredentials {
//                                 login_id: row.get(0),
//                                 password: row.get(1),
//                                 role: row.get(2),
//                             };

//                             match generate_token(&login_info.login_id, &user.role) {
//                                 Ok(token) => HttpResponse::Ok().json(LoginResponse { token }),
//                                 Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Failed to generate token".to_owned() }),
//                             }
//                         }
//                         _ => HttpResponse::NotFound().json(LoginResponse { token: "User not found".to_owned() }),
//                     }
//                 }
//                 Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Failed to acquire connection from pool".to_owned() }),
//             }
//         }
//         Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Internal server error".to_owned() }),
//     }
// }


// pub async fn establish_connection() -> Result<PgPool, Error> {
//     let db_url = "postgres://postgres:ganesh@localhost/demo";
//     let pool = PgPool::connect(db_url).await.map_err(|err| {
//         actix_web::error::ErrorInternalServerError(err)
//     })?;

//     Ok(pool)
// }


// use actix_web::{web, HttpResponse, Responder, Error, http::Cookie};
use actix_web::{web, HttpResponse, Responder, Error};
use actix_web::cookie::Cookie;

use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, Header, EncodingKey};
use std::time::{SystemTime, UNIX_EPOCH};
use sqlx::{PgPool};
use sqlx::Row;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct UserCredentials {
    pub login_id: String,
    pub password: String,
    pub role: String,
}

fn generate_token(login_id: &str, role: &str) -> Result<String, String> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + 3600; // Token expires in 1 hour
    let claims = Claims {
        sub: login_id.to_owned(),
        role: role.to_owned(),
        exp: expiration as usize,
    };

    let secret_key = "your_secret_key";
    let encoding_key = EncodingKey::from_secret(secret_key.as_bytes());

    encode(&Header::default(), &claims, &encoding_key)
        .map_err(|_| "Failed to generate token".to_owned())
}

pub async fn login(login_info: web::Json<LoginRequest>) -> impl Responder {
    match establish_connection().await {
        Ok(pool) => {
            match pool.acquire().await {
                Ok(mut client) => {
                    match sqlx::query("SELECT * FROM login WHERE login_id = $1 and password = $2")
                        .bind(&login_info.login_id)
                        .bind(&login_info.password)
                        .fetch_one(&mut client)
                        .await
                    {
                        Ok(row) => {
                            let user = UserCredentials {
                                login_id: row.get(0),
                                password: row.get(1),
                                role: row.get(2),
                            };

                            match generate_token(&login_info.login_id, &user.role) {
                                Ok(token) => {
                                    // Create cookie containing login ID and role
                                    let cookie = Cookie::build("authorization", format!("{}:{}", user.login_id, user.role))
                                        .http_only(true)
                                        .finish();

                                    // Create HTTP response with cookie and token in JSON body
                                    HttpResponse::Ok()
                                        .cookie(cookie)
                                        .json(LoginResponse { token })
                                },
                                Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Failed to generate token".to_owned() }),
                            }
                        },
                        _ => HttpResponse::NotFound().json(LoginResponse { token: "User not found".to_owned() }),
                    }
                },
                Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Failed to acquire connection from pool".to_owned() }),
            }
        },
        Err(_) => HttpResponse::InternalServerError().json(LoginResponse { token: "Internal server error".to_owned() }),
    }
}

pub async fn establish_connection() -> Result<PgPool, Error> {
    let db_url = "postgres://postgres:hash@localhost/smp_db";
    let db_url = "postgres://postgres:hash@localhost/demo";
    let pool = PgPool::connect(db_url).await.map_err(|err| {
        actix_web::error::ErrorInternalServerError(err)
    })?;

    Ok(pool)
}
