use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use std::fmt;

/// Every handler error becomes `{"error": "<message safe to show the user>"}`.
#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized(&'static str),
    Forbidden,
    NotFound(&'static str),
    Conflict(String),
    TooManyRequests(String),
    Internal,
}

pub type ApiResult<T> = Result<T, AppError>;

/// Logs the real cause and hides it from the client.
pub fn internal(e: impl fmt::Display) -> AppError {
    log::error!("{e}");
    AppError::Internal
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::BadRequest(m) | AppError::Conflict(m) | AppError::TooManyRequests(m) => f.write_str(m),
            AppError::Unauthorized(m) | AppError::NotFound(m) => f.write_str(m),
            AppError::Forbidden => f.write_str("You don't have permission to do that."),
            AppError::Internal => f.write_str("Something went wrong on our side. Please try again."),
        }
    }
}

impl ResponseError for AppError {
    fn status_code(&self) -> StatusCode {
        match self {
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            AppError::Forbidden => StatusCode::FORBIDDEN,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::TooManyRequests(_) => StatusCode::TOO_MANY_REQUESTS,
            AppError::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).json(serde_json::json!({ "error": self.to_string() }))
    }
}

/// Turns database constraint violations into friendly messages, so the schema is the single source of validation.
impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        let sqlx::Error::Database(db) = &e else {
            return match e {
                sqlx::Error::RowNotFound => AppError::NotFound("That record no longer exists."),
                e => internal(e),
            };
        };
        let constraint = db.constraint().unwrap_or_default();
        match db.code().as_deref() {
            Some("23505") if constraint.contains("email") => AppError::Conflict("That email address is already registered.".into()),
            Some("23505") if constraint.starts_with("subjects_class_id") => {
                AppError::Conflict("This class already has a subject with that name.".into())
            }
            Some("23505") => AppError::Conflict("This record already exists.".into()),
            Some("23503") => AppError::BadRequest("A linked record doesn't exist (it may have been deleted).".into()),
            Some("23514") => AppError::BadRequest(check_message(constraint)),
            Some("22007" | "22008") => AppError::BadRequest("Please enter a valid date.".into()),
            _ => internal(e),
        }
    }
}

/// `students_guardian_phone_check` -> "Please check the guardian phone field."
fn check_message(constraint: &str) -> String {
    let field = constraint
        .strip_suffix("_check")
        .and_then(|c| c.split_once('_'))
        .map(|(_, field)| field.replace('_', " "))
        .unwrap_or_default();
    if field.is_empty() {
        "Some of the values you entered are not valid.".into()
    } else {
        format!("Please check the {field} field.")
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn check_messages() {
        assert_eq!(super::check_message("students_guardian_phone_check"), "Please check the guardian phone field.");
        assert_eq!(super::check_message("accounts_check"), "Some of the values you entered are not valid.");
        assert_eq!(super::check_message("notices_check1"), "Some of the values you entered are not valid.");
    }
}
