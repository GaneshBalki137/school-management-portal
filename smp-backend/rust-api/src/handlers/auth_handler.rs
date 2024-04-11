use axum::{extract::Json, response::Json as JsonResponse, response::IntoResponse};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, Header, EncodingKey};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio_postgres::{Client, NoTls, Error};
//added to handle error in generate_token()
// use axum::{Error as AxumError};
// use axum::{
//     body::Bytes,
//     body::Full,
//     http::{Response, StatusCode},
// };
// use std::convert::Infallible;
// use serde_json;

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

    // encode(&Header::default(), &claims, &encoding_key)
    // .map_err(|_| axum::Error::new("Failed to generate token"))
    encode(&Header::default(), &claims, &encoding_key)
        .map_err(|_| "Failed to generate token".to_owned())
    
}

pub async fn login(Json(login_info): Json<LoginRequest>) -> impl IntoResponse {
    const NOT_FOUND: &str = "HTTP/1.1 404 NOT FOUND\r\n\r\n";
    const INTERNAL_SERVER_ERROR: &str = "HTTP/1.1 500 INTERNAL SERVER ERROR\r\n\r\n";

    match establish_connection().await {
        Ok(client) => {
            match client.query_one("SELECT * FROM login WHERE login_id = $1 and password = $2", &[&login_info.login_id,&login_info.password]).await {
                Ok(row) => {
                    let user = UserCredentials {
                        login_id: row.get(0),
                        password: row.get(1),
                        role: row.get(2),
                    };

                    match generate_token(&login_info.login_id, &user.role) {
                        Ok(token) => JsonResponse(LoginResponse { token }),
                        Err(_) => JsonResponse(LoginResponse { token: "Failed to generate token".to_owned() }),
                    }
                }
                _ => JsonResponse(LoginResponse { token: "User not found".to_owned() }),
            }
        }
        Err(_) => JsonResponse(LoginResponse { token: "Internal server error".to_owned() }),
    }
}

async fn establish_connection() -> Result<Client, Error> {
    let (client, connection) = tokio_postgres::connect("host=localhost user=postgres dbname=demo password=hash", NoTls).await?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Connection error: {}", e);
        }
    });

    Ok(client)
}
