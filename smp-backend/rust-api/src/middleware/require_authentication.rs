// use actix_web::{web, Error};
// use sqlx::PgPool;
// use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm, TokenData, errors::Error as JwtError};
// use serde::{Deserialize, Serialize};

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Claims {
//     pub sub: String,
//     pub role: String,
//     pub exp: usize,
// }

// // Function to validate and decode JWT token
// fn decode_token(token: &str) -> Result<TokenData<Claims>, JwtError> {
//     let secret = b"secret"; // Change this to your secret key
//     decode::<Claims>(token, &DecodingKey::from_secret(secret), &Validation::new(Algorithm::HS256))
// }

// // Middleware function to check JWT token
// pub async fn auth_middleware(
//     req: actix_web::HttpRequest,
//     _pool: web::Data<PgPool>
// ) -> Result<actix_web::HttpRequest, Error> {
//     // Extract the JWT token from the request
//     let token = match req.headers().get("Authorization") {
//         Some(value) => {
//             let value_str = value.to_str().unwrap();
//             if value_str.starts_with("Bearer ") {
//                 Some(value_str.trim_start_matches("Bearer ").to_owned())
//             } else {
//                 None
//             }
//         }
//         None => None,
//     };

//     // If no token is provided, return unauthorized
//     let token = match token {
//         Some(t) => t,
//         None => return Err(actix_web::error::ErrorUnauthorized("Missing Authorization header")),
//     };

//     // Validate and decode the token
//     let _token_data = match decode_token(&token) {
//         Ok(data) => data,
//         Err(_) => return Err(actix_web::error::ErrorUnauthorized("Invalid token")),
//     };

//     // If everything is fine, proceed with the request
//     Ok(req)
// }
