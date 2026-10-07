use crate::error::{internal, ApiResult, AppError};
use crate::AppState;
use actix_web::cookie::{time::Duration as CookieAge, Cookie, SameSite};
use actix_web::{dev::Payload, web, FromRequest, HttpRequest, HttpResponse};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{PgConnection, PgPool};
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const COOKIE: &str = "smp_session";
const SESSION_HOURS: i64 = 8;
const EXPIRED: AppError = AppError::Unauthorized("Your session has ended. Please sign in again.");

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: i32, // account_id
    ver: i32, // must match accounts.token_version, so password changes sign out old sessions
    exp: i64,
}

/// Any signed-in account. Role and ids come from the database, never from the client.
#[derive(sqlx::FromRow)]
pub struct User {
    pub account_id: i32,
    pub role: String,
    pub student_id: Option<i32>,
    pub teacher_id: Option<i32>,
    token_version: i32,
}

impl FromRequest for User {
    type Error = AppError;
    type Future = Pin<Box<dyn Future<Output = ApiResult<Self>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let token = req.cookie(COOKIE).map(|c| c.value().to_owned());
        let st = req.app_data::<web::Data<AppState>>().cloned().expect("AppState is registered");
        Box::pin(async move {
            let key = DecodingKey::from_secret(st.jwt_secret.as_bytes());
            let claims = token
                .and_then(|t| decode::<Claims>(&t, &key, &Validation::default()).ok())
                .ok_or(EXPIRED)?
                .claims;
            sqlx::query_as::<_, User>(
                "SELECT account_id, role, student_id, teacher_id, token_version FROM accounts WHERE account_id = $1",
            )
            .bind(claims.sub)
            .fetch_optional(&st.db)
            .await?
            .filter(|u| u.token_version == claims.ver)
            .ok_or(EXPIRED)
        })
    }
}

/// Extractors that admit a single role and hand the handler that role's id.
/// Every role-specific handler takes one of these, so identity can't be spoofed through URLs.
macro_rules! role {
    ($name:ident, $role:literal, $u:ident => $id:expr) => {
        #[allow(dead_code)] // the admin id is not needed by any handler yet
        pub struct $name(pub i32);

        impl FromRequest for $name {
            type Error = AppError;
            type Future = Pin<Box<dyn Future<Output = ApiResult<Self>>>>;

            fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
                let user = User::from_request(req, payload);
                Box::pin(async move {
                    let $u = user.await?;
                    match $id {
                        Some(id) if $u.role == $role => Ok($name(id)),
                        _ => Err(AppError::Forbidden),
                    }
                })
            }
        }
    };
}
role!(Admin, "admin", u => Some(u.account_id));
role!(Teacher, "teacher", u => u.teacher_id);
role!(Student, "student", u => u.student_id);

/// Locks an (IP, email) pair out for 15 minutes after 5 failed attempts.
/// ponytail: in-memory and per-process; move to a shared store if you run several API instances.
#[derive(Default)]
pub struct Limiter(Mutex<HashMap<String, (u32, Instant)>>);

const MAX_FAILURES: u32 = 5;
const LOCKOUT: Duration = Duration::from_secs(15 * 60);

impl Limiter {
    fn check(&self, key: &str) -> ApiResult<()> {
        match self.0.lock().unwrap().get(key) {
            Some(&(failures, since)) if failures >= MAX_FAILURES && since.elapsed() < LOCKOUT => {
                let minutes = (LOCKOUT - since.elapsed()).as_secs() / 60 + 1;
                Err(AppError::TooManyRequests(format!(
                    "Too many failed attempts. Please try again in {minutes} minute(s)."
                )))
            }
            _ => Ok(()),
        }
    }

    fn failed(&self, key: &str) {
        let mut map = self.0.lock().unwrap();
        if map.len() > 10_000 {
            map.retain(|_, (_, since)| since.elapsed() < LOCKOUT);
        }
        let entry = map.entry(key.to_owned()).or_insert((0, Instant::now()));
        if entry.1.elapsed() >= LOCKOUT {
            *entry = (0, Instant::now());
        }
        entry.0 += 1;
    }

    fn clear(&self, key: &str) {
        self.0.lock().unwrap().remove(key);
    }
}

pub fn check_password_strength(password: &str) -> ApiResult<()> {
    let ok = (8..=128).contains(&password.chars().count())
        && password.chars().any(char::is_alphabetic)
        && password.chars().any(|c| c.is_ascii_digit());
    ok.then_some(()).ok_or_else(|| {
        AppError::BadRequest("Password must be 8-128 characters and include at least one letter and one number.".into())
    })
}

/// Argon2 is deliberately slow, so it runs on the blocking pool instead of stalling request handling.
pub async fn hash_password(password: String) -> ApiResult<String> {
    web::block(move || {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default().hash_password(password.as_bytes(), &salt).map(|h| h.to_string())
    })
    .await
    .map_err(internal)?
    .map_err(internal)
}

async fn verify_password(password: String, hash: String) -> ApiResult<bool> {
    web::block(move || {
        PasswordHash::new(&hash).is_ok_and(|h| Argon2::default().verify_password(password.as_bytes(), &h).is_ok())
    })
    .await
    .map_err(internal)
}

/// Checked against when the email is unknown, so response time doesn't reveal which emails exist.
fn dummy_hash() -> String {
    static HASH: OnceLock<String> = OnceLock::new();
    HASH.get_or_init(|| {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default().hash_password(b"timing-equaliser", &salt).unwrap().to_string()
    })
    .clone()
}

/// One-time password without look-alike characters (0/O, 1/l/I), easy to read out to someone.
fn temporary_password() -> String {
    const CHARS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let mut rng = rand::thread_rng();
    (0..10).map(|_| CHARS[rng.gen_range(0..CHARS.len())] as char).collect()
}

/// Creates a login that must change its password at first sign-in. Returns the one-time password.
pub async fn create_account(
    conn: &mut PgConnection,
    email: &str,
    role: &str,
    student_id: Option<i32>,
    teacher_id: Option<i32>,
) -> ApiResult<String> {
    let password = temporary_password();
    sqlx::query("INSERT INTO accounts (email, password_hash, role, student_id, teacher_id) VALUES ($1, $2, $3, $4, $5)")
        .bind(email)
        .bind(hash_password(password.clone()).await?)
        .bind(role)
        .bind(student_id)
        .bind(teacher_id)
        .execute(conn)
        .await?;
    Ok(password)
}

/// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when no admin exists yet.
pub async fn ensure_admin(db: &PgPool) -> ApiResult<()> {
    let exists: bool = sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM accounts WHERE role = 'admin')")
        .fetch_one(db)
        .await?;
    if exists {
        return Ok(());
    }
    let (Ok(email), Ok(password)) = (std::env::var("ADMIN_EMAIL"), std::env::var("ADMIN_PASSWORD")) else {
        log::warn!("No admin account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD, then restart to create one.");
        return Ok(());
    };
    check_password_strength(&password)?;
    sqlx::query(
        "INSERT INTO accounts (email, password_hash, role, must_change_password) VALUES (lower(btrim($1)), $2, 'admin', false)",
    )
    .bind(&email)
    .bind(hash_password(password).await?)
    .execute(db)
    .await?;
    log::info!("Created admin account {email}");
    Ok(())
}

fn session_cookie(st: &AppState, account_id: i32, ver: i32) -> ApiResult<Cookie<'static>> {
    let claims = Claims { sub: account_id, ver, exp: chrono::Utc::now().timestamp() + SESSION_HOURS * 3600 };
    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(st.jwt_secret.as_bytes())).map_err(internal)?;
    // httpOnly: page scripts can't read it. SameSite=Strict: other sites can't ride on it.
    Ok(Cookie::build(COOKIE, token)
        .path("/api")
        .http_only(true)
        .secure(st.cookie_secure)
        .same_site(SameSite::Strict)
        .max_age(CookieAge::hours(SESSION_HOURS))
        .finish())
}

async fn profile(db: &PgPool, account_id: i32) -> ApiResult<Value> {
    Ok(sqlx::query_scalar(
        "SELECT json_build_object(
            'account_id', a.account_id, 'email', a.email, 'role', a.role,
            'must_change_password', a.must_change_password, 'last_login_at', a.last_login_at,
            'name', coalesce(s.first_name || ' ' || s.last_name, t.first_name || ' ' || t.last_name, 'Administrator'),
            'student_id', a.student_id, 'teacher_id', a.teacher_id, 'class_id', s.class_id,
            'details', coalesce(to_jsonb(s), to_jsonb(t)))
         FROM accounts a
         LEFT JOIN students s ON s.student_id = a.student_id
         LEFT JOIN teachers t ON t.teacher_id = a.teacher_id
         WHERE a.account_id = $1",
    )
    .bind(account_id)
    .fetch_one(db)
    .await?)
}

#[derive(Deserialize)]
pub struct LoginBody {
    email: String,
    password: String,
}

pub async fn login(st: web::Data<AppState>, req: HttpRequest, body: web::Json<LoginBody>) -> ApiResult<HttpResponse> {
    let LoginBody { email, password } = body.into_inner();
    let email = email.trim().to_lowercase();
    let ip = req.peer_addr().map(|a| a.ip().to_string()).unwrap_or_default();
    let key = format!("{ip}|{email}");
    st.limiter.check(&key)?;

    let account: Option<(i32, String, i32)> =
        sqlx::query_as("SELECT account_id, password_hash, token_version FROM accounts WHERE email = $1")
            .bind(&email)
            .fetch_optional(&st.db)
            .await?;
    let hash = account.as_ref().map_or_else(dummy_hash, |a| a.1.clone());
    let valid = verify_password(password, hash).await?;
    let Some((account_id, _, ver)) = account.filter(|_| valid) else {
        st.limiter.failed(&key);
        return Err(AppError::Unauthorized("Incorrect email or password."));
    };
    st.limiter.clear(&key);

    sqlx::query("UPDATE accounts SET last_login_at = now() WHERE account_id = $1")
        .bind(account_id)
        .execute(&st.db)
        .await?;
    Ok(HttpResponse::Ok().cookie(session_cookie(&st, account_id, ver)?).json(profile(&st.db, account_id).await?))
}

pub async fn logout() -> HttpResponse {
    let mut cookie = Cookie::build(COOKIE, "").path("/api").finish();
    cookie.make_removal();
    HttpResponse::NoContent().cookie(cookie).finish()
}

pub async fn me(st: web::Data<AppState>, user: User) -> ApiResult<web::Json<Value>> {
    Ok(web::Json(profile(&st.db, user.account_id).await?))
}

#[derive(Deserialize)]
pub struct PasswordBody {
    current_password: String,
    new_password: String,
}

pub async fn change_password(
    st: web::Data<AppState>,
    user: User,
    body: web::Json<PasswordBody>,
) -> ApiResult<HttpResponse> {
    let PasswordBody { current_password, new_password } = body.into_inner();
    check_password_strength(&new_password)?;
    if new_password == current_password {
        return Err(AppError::BadRequest("Choose a password different from your current one.".into()));
    }
    let key = format!("password|{}", user.account_id);
    st.limiter.check(&key)?;
    let hash: String = sqlx::query_scalar("SELECT password_hash FROM accounts WHERE account_id = $1")
        .bind(user.account_id)
        .fetch_one(&st.db)
        .await?;
    if !verify_password(current_password, hash).await? {
        st.limiter.failed(&key);
        return Err(AppError::BadRequest("Your current password is incorrect.".into()));
    }
    st.limiter.clear(&key);

    let ver: i32 = sqlx::query_scalar(
        "UPDATE accounts SET password_hash = $1, must_change_password = false, token_version = token_version + 1
         WHERE account_id = $2 RETURNING token_version",
    )
    .bind(hash_password(new_password).await?)
    .bind(user.account_id)
    .fetch_one(&st.db)
    .await?;
    // Every other session is now signed out; this one gets a fresh cookie.
    Ok(HttpResponse::NoContent().cookie(session_cookie(&st, user.account_id, ver)?).finish())
}

/// Admin: issue a new one-time password for a student or teacher and sign out their sessions.
pub async fn reset_password(
    st: web::Data<AppState>,
    _: Admin,
    path: web::Path<(String, i32)>,
) -> ApiResult<web::Json<Value>> {
    let (kind, id) = path.into_inner();
    let column = match kind.as_str() {
        "students" => "student_id",
        "teachers" => "teacher_id",
        _ => return Err(AppError::NotFound("Unknown account type.")),
    };
    let password = temporary_password();
    let updated = sqlx::query(&format!(
        "UPDATE accounts SET password_hash = $1, must_change_password = true, token_version = token_version + 1
         WHERE {column} = $2"
    ))
    .bind(hash_password(password.clone()).await?)
    .bind(id)
    .execute(&st.db)
    .await?
    .rows_affected();
    if updated == 0 {
        return Err(AppError::NotFound("That person no longer exists."));
    }
    Ok(web::Json(json!({ "temporary_password": password })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn password_rules() {
        assert!(check_password_strength("abcdefg1").is_ok());
        assert!(check_password_strength("short1").is_err());
        assert!(check_password_strength("onlyletters").is_err());
        assert!(check_password_strength("12345678").is_err());
    }

    #[test]
    fn lockout_after_five_failures() {
        let limiter = Limiter::default();
        for _ in 0..MAX_FAILURES {
            assert!(limiter.check("k").is_ok());
            limiter.failed("k");
        }
        assert!(limiter.check("k").is_err());
        assert!(limiter.check("other").is_ok());
        limiter.clear("k");
        assert!(limiter.check("k").is_ok());
    }

    #[test]
    fn temporary_passwords_avoid_lookalikes() {
        let p = temporary_password();
        assert_eq!(p.len(), 10);
        assert!(!p.contains(['0', 'O', '1', 'l', 'I']));
    }
}
