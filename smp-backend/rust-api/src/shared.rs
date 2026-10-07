use crate::auth::User;
use crate::error::{ApiResult, AppError};
use crate::AppState;
use actix_web::web;
use serde::Deserialize;
use serde_json::Value;
use sqlx::PgPool;

pub type Db = web::Data<AppState>;
pub type JsonResult = ApiResult<web::Json<Value>>;

/// Wraps a SELECT so Postgres returns all its rows as one JSON array, sorted by `order`.
pub fn rows(select: &str, order: &str) -> String {
    format!("SELECT coalesce(json_agg(r ORDER BY {order}), '[]'::json) FROM ({select}) r")
}

/// Share of lectures attended (late counts as attended), as a percentage with one decimal.
pub const ATTENDED_PCT: &str = "round(100.0 * count(*) FILTER (WHERE status <> 'A') / NULLIF(count(*), 0), 1)";

#[derive(Deserialize)]
pub struct SemesterQuery {
    pub semester: i16,
}

/// Notice board: only published, unexpired notices meant for the reader's role.
pub async fn notices(st: Db, user: User) -> JsonResult {
    let sql = rows(
        "SELECT * FROM notices
         WHERE publish_date <= CURRENT_DATE AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
           AND (audience = 'all' OR audience = $1 OR $1 = 'admin')",
        "r.pinned DESC, r.publish_date DESC, r.notice_id DESC",
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(&user.role).fetch_one(&st.db).await?))
}

/// Weekly lectures matching `filter`, which receives `id` as $1.
pub async fn timetable(db: &PgPool, filter: &str, id: i32) -> ApiResult<Value> {
    let sql = rows(
        &format!(
            "SELECT tt.timetable_id, tt.class_id, tt.day_of_week, tt.start_hour, s.subject_id, s.subject_name,
                    s.teacher_id, t.first_name || ' ' || t.last_name AS teacher_name
             FROM timetable tt
             JOIN subjects s ON s.subject_id = tt.subject_id
             LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
             WHERE {filter}"
        ),
        "r.day_of_week, r.start_hour",
    );
    Ok(sqlx::query_scalar(&sql).bind(id).fetch_one(db).await?)
}

/// Every subject of the student's class with this semester's marks and that subject's attendance.
pub async fn report_card(db: &PgPool, student_id: i32, semester: i16) -> ApiResult<Value> {
    let sql = format!(
        "SELECT json_build_object(
            'semester', $2,
            'attendance', (SELECT {ATTENDED_PCT} FROM attendance a WHERE a.student_id = st.student_id),
            'student', json_build_object('student_id', st.student_id, 'name', st.first_name || ' ' || st.last_name,
                                         'class_id', st.class_id, 'email', st.email, 'guardian_name', st.guardian_name),
            'subjects', (SELECT coalesce(json_agg(x ORDER BY x.subject_name), '[]'::json) FROM (
                SELECT s.subject_id, s.subject_name, t.first_name || ' ' || t.last_name AS teacher_name,
                       g.quiz_grade, g.homework_grade, g.test_grade, g.project_grade, g.average,
                       (SELECT {ATTENDED_PCT} FROM attendance a
                        WHERE a.student_id = st.student_id AND a.subject_id = s.subject_id) AS attendance
                FROM subjects s
                LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
                LEFT JOIN grades g ON g.subject_id = s.subject_id AND g.student_id = st.student_id AND g.semester = $2
                WHERE s.class_id = st.class_id) x))
         FROM students st WHERE st.student_id = $1"
    );
    sqlx::query_scalar(&sql)
        .bind(student_id)
        .bind(semester)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound("Student not found."))
}
