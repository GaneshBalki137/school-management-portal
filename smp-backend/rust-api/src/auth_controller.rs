use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, Header, EncodingKey};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio_postgres::{Client, NoTls, Error};

// Define the JWT claims structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
}

// Define the structure for login requests
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub login_id: String,
    pub password: String,
}

// Define the structure for login responses
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
}

// Define the structure for user credentials
#[derive(Debug, Serialize, Deserialize)]
pub struct UserCredentials {
    pub login_id: String,
    pub password: String,
    pub role: String,
}

// Function to generate a JWT token
fn generate_token(login_id: &str, role: &str) -> Result<String, actix_web::Error> {
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
        .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to generate token"))
}

// Handler for the login endpoint
pub async fn login(login_info: web::Json<LoginRequest>) -> HttpResponse {
    const NOT_FOUND: &str = "HTTP/1.1 404 NOT FOUND\r\n\r\n";
    const INTERNAL_SERVER_ERROR: &str = "HTTP/1.1 500 INTERNAL SERVER ERROR\r\n\r\n";

    // Establish a connection to the database
    match establish_connection().await {
        Ok(client) => {
            // Query the database for the user with the provided login ID
            match client.query_one("SELECT * FROM login WHERE login_id = $1 and password = $2", &[&login_info.login_id,&login_info.password]).await {
                Ok(row) => {
                    let user = UserCredentials {
                        login_id: row.get(0),
                        password: row.get(1),
                        role: row.get(2),
                    };

                    // Generate a JWT token if the user exists
                    match generate_token(&login_info.login_id, &user.role) {
                        Ok(token) => HttpResponse::Ok().json(LoginResponse { token }),
                        Err(_) => HttpResponse::InternalServerError().finish(),
                    }
                }
                _ => HttpResponse::NotFound().finish(),
            }
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

// Function to establish a connection to the database
async fn establish_connection() -> Result<Client, Error> {
    let (client, connection) = tokio_postgres::connect("host=localhost user=postgres dbname=demo password=ganesh", NoTls).await?;

    // Spawn a task to handle the connection
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Connection error: {}", e);
        }
    });

    Ok(client)
}
