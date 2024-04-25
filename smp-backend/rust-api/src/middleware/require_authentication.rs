// use actix_web::{
//     dev::{Service, ServiceRequest, ServiceResponse, Transform},
//     http::header::{COOKIE, HeaderValue},
//     web, HttpResponse, Responder,
// };
// use futures::future::{ok as future_ok, Ready};
// use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
// use serde::{Deserialize, Serialize};
// use sqlx::PgPool;
// use std::pin::Pin;
// use std::rc::Rc;
// use std::task::{Context, Poll};
// use actix_web::Error;
// use crate::handlers::auth_handler::Claims;

// pub fn parse_token_from_cookie(cookie_str: &str) -> Option<String> {
//     // Split the cookie string into individual cookies
//     let cookies: Vec<&str> = cookie_str.split("; ").collect();

//     // Iterate over the cookies to find the one containing the token
//     for cookie in cookies {
//         // Check if the cookie starts with "authorization="
//         if let Some(token) = cookie.strip_prefix("authorization=") {
//             return Some(token.to_owned());
//         }
//     }

//     None
// }


// pub struct AuthenticationMiddleware;

// impl<S, B> Transform<S, ServiceRequest> for AuthenticationMiddleware
// where
//     S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
//     S::Future: 'static,
// {
//     type Response = ServiceResponse<B>;
//     type Error = Error;
//     type Transform = AuthenticationMiddlewareService<S>;
//     type InitError = ();
//     type Future = Ready<Result<Self::Transform, Self::InitError>>;

//     fn new_transform(&self, service: S) -> Self::Future {
//         future_ok(AuthenticationMiddlewareService {
//             service: Rc::new(service),
//         })
//     }
// }

// pub struct AuthenticationMiddlewareService<S> {
//     service: Rc<S>,
// }

// impl<S, B> Service<ServiceRequest> for AuthenticationMiddlewareService<S>
// where
//     S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
// {
//     type Response = ServiceResponse<B>;
//     type Error = Error;
//     type Future = Pin<Box<dyn futures::Future<Output = Result<Self::Response, Self::Error>>>>;

//     fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
//         self.service.poll_ready(ctx)
//     }

//     fn call(&self, req: ServiceRequest) -> Self::Future {
//         if self.skip_authentication(&req) {
//             return Box::pin(self.service.call(req));
//         }

//         match self.authentication(&req) {
//             Ok(_) => {
//                 let fut = self.service.call(req);
//                 Box::pin(async move {
//                     let res = fut.await?;
//                     Ok(res)
//                 })
//             }
//             Err(e) => Box::pin(async { Err(e) }),
//         }
//     }
// }

// impl<S, B> AuthenticationMiddlewareService<S>
// where
//     S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
// {
//     fn skip_authentication(&self, req: &ServiceRequest) -> bool {
//         req.uri().path() == "/login"
//     }

//     fn authentication(&self, req: &ServiceRequest) -> Result<(), Error> {
//         let cookies = req.headers().get_all(COOKIE);
    
//         println!("Cookies received in the request: {:?}", cookies);
    
//         if let Some(cookie) = cookies.last() {
//             if let Ok(cookie_str) = cookie.to_str() {
//                 println!("Cookie string: {}", cookie_str);
//                 if let Some(token) = parse_token_from_cookie(cookie_str) {
//                     println!("Token extracted from cookie: {}", token);
//                     let decoding_key =
//                         DecodingKey::from_secret(b"I3gfhgeugjdhHFDjhdrdFTRgGYTFu873t");
//                     let validation = Validation::new(Algorithm::HS256);
    
//                     match decode::<Claims>(&token, &decoding_key, &validation) {
//                         Ok(_) => {
//                             return Ok(());
//                         }
//                         Err(_) => {
//                             return Err(actix_web::error::ErrorUnauthorized("Invalid token"));
//                         }
//                     }
//                 }
//             }
//         }
    
//         Err(actix_web::error::ErrorUnauthorized("No token provided"))
//     }
    
// }

use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::header::{HeaderMap, HeaderValue, AUTHORIZATION},
    web, HttpResponse, Responder,
};
use futures::future::{ok as future_ok, Ready};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll};
use actix_web::Error;
use crate::handlers::auth_handler::Claims;

pub fn parse_token_from_header(headers: &HeaderMap) -> Option<String> {
    if let Some(auth_header) = headers.get(AUTHORIZATION) {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                return Some(auth_str["Bearer ".len()..].to_owned());
            } else {
                return Some(auth_str.to_owned());
            }
        }
    }
    None
}

pub struct AuthenticationMiddleware;
//defines how incoming requests are transformed or processed by the middleware before being passed 
//to the underlying service (It specifies how the middleware should transform or process incoming requests (ServiceRequest) )
impl<S, B> Transform<S, ServiceRequest> for AuthenticationMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<B>;  // defines type of response produced by middleware
    type Error = Error;
    type Transform = AuthenticationMiddlewareService<S>; //Specifies the type of transformation applied to the 
                                                         //incoming request, which is AuthenticationMiddlewareService<S>
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    // new_transform method of AuthenticationMiddleware is called to initialize the middleware means 
    // that Actix Web is setting up middleware for processing incoming requests
    fn new_transform(&self, service: S) -> Self::Future {
        future_ok(AuthenticationMiddlewareService {
            service: Rc::new(service),
        })
    }
}

pub struct AuthenticationMiddlewareService<S> {
    service: Rc<S>,
}

// this struct handles the incoming http request
// Service trait defines the behavior of types that can handle HTTP requests and produce HTTP responses in Actix Web
impl<S, B> Service<ServiceRequest> for AuthenticationMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
{
    type Response = ServiceResponse<B>;  // implements the Service trait for processing ServiceRequest and producing ServiceResponse<B>.
    type Error = Error;
    type Future = Pin<Box<dyn futures::Future<Output = Result<Self::Response, Self::Error>>>>;

    // called to check if the underlying service is ready to process requests
    fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(ctx)
    }

    //entry point for handling incoming requests , whenever a req comes this method is invoked
    fn call(&self, req: ServiceRequest) -> Self::Future {
        if self.skip_authentication(&req) {          // checks whether authentication should be skipped for the current request path
            println!("Skipping authentication for path: {:?}", req.path());
            return Box::pin(self.service.call(req));   // the req is then forwarded to the underline service i.e. poll_ready
        }

        match self.authentication(&req) {
            Ok(_) => {
                println!("Authentication successful for path: {:?}", req.path());
                let fut = self.service.call(req);
                Box::pin(async move {
                    let res = fut.await?;
                    Ok(res)
                })
            }
            Err(e) => {
                println!("Authentication failed for path: {:?} - Error: {:?}", req.path(), e);
                Box::pin(async { Err(e) })
            }
        }
    }
}

impl<S, B> AuthenticationMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
{
    fn skip_authentication(&self, req: &ServiceRequest) -> bool {
        req.uri().path() == "/login" || req.uri().path() == "/change_password"
    }

    fn authentication(&self, req: &ServiceRequest) -> Result<(), Error> {
        let headers = req.headers().clone();   // to obtain a copy of the request headers

        //println!("Headers received in the request: {:?}", headers);

        if let Some(token) = parse_token_from_header(&headers) { // returns the extracted token
            println!("Token extracted from header: {}", token);
            let decoding_key = DecodingKey::from_secret(b"I3gfhgeugjdhHFDjhdrdFTRgGYTFu873t"); // it creates a decoding key from a secret
            let validation = Validation::new(Algorithm::HS256);

            // this function call to decode and validate the JWT token using the decoding key and 
            // validation settings (&validation)
            match decode::<Claims>(&token, &decoding_key, &validation) {
                Ok(_) => return Ok(()),
                Err(_) => return Err(actix_web::error::ErrorUnauthorized("Invalid token")),
            }
        }

        Err(actix_web::error::ErrorUnauthorized("No token provided"))
    }
}
