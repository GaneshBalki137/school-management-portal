mod admin;
mod auth;
mod error;
mod shared;
mod student;
mod teacher;

use actix_web::middleware::{DefaultHeaders, Logger};
use actix_web::web::{delete, get, post, put};
use actix_web::{web, App, HttpResponse, HttpServer};
use error::{ApiResult, AppError};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::{env, time::Duration};

pub struct AppState {
    pub db: PgPool,
    pub jwt_secret: String,
    pub cookie_secure: bool,
    pub limiter: auth::Limiter,
}

fn required_env(name: &str) -> String {
    env::var(name).unwrap_or_else(|_| panic!("{name} is not set. Copy .env.example to .env and fill it in."))
}

fn bad_input(e: impl std::fmt::Display) -> actix_web::Error {
    AppError::BadRequest(format!("Invalid request: {e}")).into()
}

async fn health(st: shared::Db) -> ApiResult<HttpResponse> {
    sqlx::query("SELECT 1").execute(&st.db).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "status": "ok" })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let jwt_secret = required_env("JWT_SECRET");
    assert!(jwt_secret.len() >= 32, "JWT_SECRET must be at least 32 characters (try: openssl rand -hex 32)");
    // "Today" in SQL (CURRENT_DATE) must be the school's date, not UTC's.
    let timezone = env::var("SCHOOL_TIMEZONE").unwrap_or_else(|_| "UTC".into());
    let db = PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(5))
        .after_connect(move |conn, _| {
            let timezone = timezone.clone();
            Box::pin(async move {
                sqlx::query("SELECT set_config('TimeZone', $1, false)").bind(timezone).execute(conn).await?;
                Ok(())
            })
        })
        .connect(&required_env("DATABASE_URL"))
        .await
        .expect("Could not connect to Postgres. Is it running, and is DATABASE_URL correct?");
    sqlx::migrate!().run(&db).await.expect("Database migration failed");
    if let Err(e) = auth::ensure_admin(&db).await {
        panic!("Could not create the admin account: {e}");
    }

    let state = web::Data::new(AppState {
        db,
        jwt_secret,
        cookie_secure: env::var("COOKIE_SECURE").map_or(true, |v| v != "false"),
        limiter: auth::Limiter::default(),
    });
    let bind = env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".into());
    log::info!("API listening on http://{bind}");

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .app_data(web::JsonConfig::default().limit(256 * 1024).error_handler(|e, _| bad_input(e)))
            .app_data(web::QueryConfig::default().error_handler(|e, _| bad_input(e)))
            .app_data(web::PathConfig::default().error_handler(|e, _| bad_input(e)))
            .wrap(
                DefaultHeaders::new()
                    .add(("Cache-Control", "no-store"))
                    .add(("X-Content-Type-Options", "nosniff"))
                    .add(("X-Frame-Options", "DENY"))
                    .add(("Referrer-Policy", "no-referrer")),
            )
            .wrap(Logger::new("%a \"%r\" %s %Dms"))
            .service(
                web::scope("/api")
                    .route("/health", get().to(health))
                    .route("/auth/login", post().to(auth::login))
                    .route("/auth/logout", post().to(auth::logout))
                    .route("/auth/me", get().to(auth::me))
                    .route("/auth/password", put().to(auth::change_password))
                    .route("/auth/theme", put().to(auth::set_theme))
                    .route("/notices", get().to(shared::notices))
                    .service(
                        web::scope("/admin")
                            .route("/dashboard", get().to(admin::dashboard))
                            .route("/students", get().to(admin::list_students))
                            .route("/students", post().to(admin::create_student))
                            .route("/students/{id}", put().to(admin::update_student))
                            .route("/students/{id}", delete().to(admin::delete_student))
                            .route("/students/{id}/report", get().to(admin::student_report))
                            .route("/teachers", get().to(admin::list_teachers))
                            .route("/teachers", post().to(admin::create_teacher))
                            .route("/teachers/{id}", put().to(admin::update_teacher))
                            .route("/teachers/{id}", delete().to(admin::delete_teacher))
                            .route("/{kind}/{id}/reset-password", post().to(auth::reset_password))
                            .route("/subjects", get().to(admin::list_subjects))
                            .route("/subjects", post().to(admin::create_subject))
                            .route("/subjects/{id}", put().to(admin::update_subject))
                            .route("/subjects/{id}", delete().to(admin::delete_subject))
                            .route("/timetable", get().to(admin::timetable))
                            .route("/timetable", put().to(admin::set_slot))
                            .route("/timetable/{id}", delete().to(admin::clear_slot))
                            .route("/notices", get().to(admin::list_notices))
                            .route("/notices", post().to(admin::create_notice))
                            .route("/notices/{id}", put().to(admin::update_notice))
                            .route("/notices/{id}", delete().to(admin::delete_notice))
                            .route("/reports/class", get().to(admin::class_report)),
                    )
                    .service(
                        web::scope("/teacher")
                            .route("/dashboard", get().to(teacher::dashboard))
                            .route("/subjects", get().to(teacher::subjects))
                            .route("/timetable", get().to(teacher::timetable))
                            .route("/attendance", get().to(teacher::attendance))
                            .route("/attendance", put().to(teacher::save_attendance))
                            .route("/grades", get().to(teacher::grades))
                            .route("/grades", put().to(teacher::save_grades)),
                    )
                    .service(
                        web::scope("/student")
                            .route("/dashboard", get().to(student::dashboard))
                            .route("/timetable", get().to(student::timetable))
                            .route("/attendance", get().to(student::attendance))
                            .route("/report", get().to(student::report)),
                    ),
            )
    })
    .bind(bind)?
    .run()
    .await
}
