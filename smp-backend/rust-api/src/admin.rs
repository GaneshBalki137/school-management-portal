use crate::auth::{self, Admin};
use crate::error::{ApiResult, AppError};
use crate::shared::{self, rows, Db, JsonResult, SemesterQuery, ATTENDED_PCT};
use actix_web::{web, HttpResponse};
use chrono::NaiveDate;
use serde::Deserialize;
use serde_json::json;
use sqlx::postgres::{PgArguments, Postgres};
use sqlx::query::{Query, QueryAs};

pub async fn dashboard(st: Db, _: Admin) -> JsonResult {
    let sql = format!(
        "SELECT json_build_object(
            'students', (SELECT count(*) FROM students),
            'teachers', (SELECT count(*) FROM teachers),
            'subjects', (SELECT count(*) FROM subjects),
            'unassigned_subjects', (SELECT count(*) FROM subjects WHERE teacher_id IS NULL),
            'attendance_today', (SELECT {ATTENDED_PCT} FROM attendance WHERE date = CURRENT_DATE),
            'attendance_trend', (SELECT coalesce(json_agg(x ORDER BY x.date), '[]'::json) FROM (
                SELECT date, {ATTENDED_PCT} AS percent FROM attendance WHERE date > CURRENT_DATE - 14 GROUP BY date) x),
            'admissions', (SELECT coalesce(json_agg(x ORDER BY x.year), '[]'::json) FROM (
                SELECT extract(year FROM admission_date)::int AS year, count(*) AS students FROM students GROUP BY 1) x),
            'class_strength', (SELECT coalesce(json_agg(x ORDER BY x.class_id), '[]'::json) FROM (
                SELECT class_id, count(*) AS students FROM students GROUP BY class_id) x),
            'low_attendance', (SELECT coalesce(json_agg(x ORDER BY x.percent), '[]'::json) FROM (
                SELECT st.student_id, st.first_name || ' ' || st.last_name AS name, st.class_id, {ATTENDED_PCT} AS percent
                FROM attendance a JOIN students st ON st.student_id = a.student_id
                GROUP BY st.student_id HAVING {ATTENDED_PCT} < 75 ORDER BY percent LIMIT 10) x))"
    );
    Ok(web::Json(sqlx::query_scalar(&sql).fetch_one(&st.db).await?))
}

#[derive(Deserialize)]
pub struct ClassFilter {
    class_id: Option<i16>,
}

async fn delete(st: &Db, sql: &str, id: i32, missing: &'static str) -> ApiResult<HttpResponse> {
    match sqlx::query(sql).bind(id).execute(&st.db).await?.rows_affected() {
        0 => Err(AppError::NotFound(missing)),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

// ---------- Students ----------

#[derive(Deserialize)]
pub struct StudentInput {
    first_name: String,
    last_name: String,
    date_of_birth: NaiveDate,
    gender: String,
    email: String,
    #[serde(default)]
    phone_number: String,
    #[serde(default)]
    address: String,
    class_id: i16,
    guardian_name: String,
    guardian_phone: String,
    admission_date: Option<NaiveDate>,
}

fn student_query<'q>(sql: &'q str, s: &'q StudentInput) -> QueryAs<'q, Postgres, (i32, String), PgArguments> {
    sqlx::query_as(sql)
        .bind(&s.first_name)
        .bind(&s.last_name)
        .bind(s.date_of_birth)
        .bind(&s.gender)
        .bind(&s.email)
        .bind(&s.phone_number)
        .bind(&s.address)
        .bind(s.class_id)
        .bind(&s.guardian_name)
        .bind(&s.guardian_phone)
        .bind(s.admission_date)
}

pub async fn list_students(st: Db, _: Admin, q: web::Query<ClassFilter>) -> JsonResult {
    let sql = rows(
        "SELECT s.*, a.last_login_at FROM students s LEFT JOIN accounts a ON a.student_id = s.student_id
         WHERE $1::smallint IS NULL OR s.class_id = $1",
        "r.class_id, r.first_name, r.last_name",
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(q.class_id).fetch_one(&st.db).await?))
}

/// Student and login are created together or not at all.
pub async fn create_student(st: Db, _: Admin, body: web::Json<StudentInput>) -> ApiResult<HttpResponse> {
    let mut tx = st.db.begin().await?;
    let (id, email) = student_query(
        "INSERT INTO students (first_name, last_name, date_of_birth, gender, email, phone_number, address,
                               class_id, guardian_name, guardian_phone, admission_date)
         VALUES (btrim($1), btrim($2), $3, $4, lower(btrim($5)), btrim($6), btrim($7), $8, btrim($9), btrim($10),
                 coalesce($11, CURRENT_DATE))
         RETURNING student_id, email",
        &body,
    )
    .fetch_one(&mut *tx)
    .await?;
    let password = auth::create_account(&mut tx, &email, "student", Some(id), None).await?;
    tx.commit().await?;
    Ok(HttpResponse::Created().json(json!({ "id": id, "email": email, "temporary_password": password })))
}

pub async fn update_student(st: Db, _: Admin, id: web::Path<i32>, body: web::Json<StudentInput>) -> ApiResult<HttpResponse> {
    let mut tx = st.db.begin().await?;
    let (id, email) = student_query(
        "UPDATE students SET first_name = btrim($1), last_name = btrim($2), date_of_birth = $3, gender = $4,
                email = lower(btrim($5)), phone_number = btrim($6), address = btrim($7), class_id = $8,
                guardian_name = btrim($9), guardian_phone = btrim($10), admission_date = coalesce($11, admission_date)
         WHERE student_id = $12 RETURNING student_id, email",
        &body,
    )
    .bind(*id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound("Student not found."))?;
    sqlx::query("UPDATE accounts SET email = $1 WHERE student_id = $2").bind(&email).bind(id).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn delete_student(st: Db, _: Admin, id: web::Path<i32>) -> ApiResult<HttpResponse> {
    delete(&st, "DELETE FROM students WHERE student_id = $1", *id, "Student not found.").await
}

pub async fn student_report(st: Db, _: Admin, id: web::Path<i32>, q: web::Query<SemesterQuery>) -> JsonResult {
    Ok(web::Json(shared::report_card(&st.db, *id, q.semester).await?))
}

// ---------- Teachers ----------

#[derive(Deserialize)]
pub struct TeacherInput {
    first_name: String,
    last_name: String,
    date_of_birth: NaiveDate,
    gender: String,
    email: String,
    phone_number: String,
    #[serde(default)]
    address: String,
    #[serde(default)]
    qualification: String,
    #[serde(default)]
    subject_name: String,
    hire_date: Option<NaiveDate>,
}

fn teacher_query<'q>(sql: &'q str, t: &'q TeacherInput) -> QueryAs<'q, Postgres, (i32, String), PgArguments> {
    sqlx::query_as(sql)
        .bind(&t.first_name)
        .bind(&t.last_name)
        .bind(t.date_of_birth)
        .bind(&t.gender)
        .bind(&t.email)
        .bind(&t.phone_number)
        .bind(&t.address)
        .bind(&t.qualification)
        .bind(&t.subject_name)
        .bind(t.hire_date)
}

pub async fn list_teachers(st: Db, _: Admin) -> JsonResult {
    let sql = rows(
        "SELECT t.*, a.last_login_at,
                (SELECT count(*) FROM subjects s WHERE s.teacher_id = t.teacher_id) AS subjects
         FROM teachers t LEFT JOIN accounts a ON a.teacher_id = t.teacher_id",
        "r.first_name, r.last_name",
    );
    Ok(web::Json(sqlx::query_scalar(&sql).fetch_one(&st.db).await?))
}

pub async fn create_teacher(st: Db, _: Admin, body: web::Json<TeacherInput>) -> ApiResult<HttpResponse> {
    let mut tx = st.db.begin().await?;
    let (id, email) = teacher_query(
        "INSERT INTO teachers (first_name, last_name, date_of_birth, gender, email, phone_number, address,
                               qualification, subject_name, hire_date)
         VALUES (btrim($1), btrim($2), $3, $4, lower(btrim($5)), btrim($6), btrim($7), btrim($8), btrim($9),
                 coalesce($10, CURRENT_DATE))
         RETURNING teacher_id, email",
        &body,
    )
    .fetch_one(&mut *tx)
    .await?;
    let password = auth::create_account(&mut tx, &email, "teacher", None, Some(id)).await?;
    tx.commit().await?;
    Ok(HttpResponse::Created().json(json!({ "id": id, "email": email, "temporary_password": password })))
}

pub async fn update_teacher(st: Db, _: Admin, id: web::Path<i32>, body: web::Json<TeacherInput>) -> ApiResult<HttpResponse> {
    let mut tx = st.db.begin().await?;
    let (id, email) = teacher_query(
        "UPDATE teachers SET first_name = btrim($1), last_name = btrim($2), date_of_birth = $3, gender = $4,
                email = lower(btrim($5)), phone_number = btrim($6), address = btrim($7), qualification = btrim($8),
                subject_name = btrim($9), hire_date = coalesce($10, hire_date)
         WHERE teacher_id = $11 RETURNING teacher_id, email",
        &body,
    )
    .bind(*id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound("Teacher not found."))?;
    sqlx::query("UPDATE accounts SET email = $1 WHERE teacher_id = $2").bind(&email).bind(id).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn delete_teacher(st: Db, _: Admin, id: web::Path<i32>) -> ApiResult<HttpResponse> {
    delete(&st, "DELETE FROM teachers WHERE teacher_id = $1", *id, "Teacher not found.").await
}

// ---------- Subjects ----------

#[derive(Deserialize)]
pub struct SubjectInput {
    subject_name: String,
    class_id: i16,
    teacher_id: Option<i32>,
}

pub async fn list_subjects(st: Db, _: Admin, q: web::Query<ClassFilter>) -> JsonResult {
    let sql = rows(
        "SELECT s.*, t.first_name || ' ' || t.last_name AS teacher_name,
                (SELECT count(*) FROM timetable tt WHERE tt.subject_id = s.subject_id) AS weekly_lectures
         FROM subjects s LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
         WHERE $1::smallint IS NULL OR s.class_id = $1",
        "r.class_id, r.subject_name",
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(q.class_id).fetch_one(&st.db).await?))
}

pub async fn create_subject(st: Db, _: Admin, body: web::Json<SubjectInput>) -> ApiResult<HttpResponse> {
    sqlx::query("INSERT INTO subjects (subject_name, class_id, teacher_id) VALUES (btrim($1), $2, $3)")
        .bind(&body.subject_name)
        .bind(body.class_id)
        .bind(body.teacher_id)
        .execute(&st.db)
        .await?;
    Ok(HttpResponse::Created().finish())
}

/// Renames a subject or changes its teacher. A subject's class is fixed once created.
pub async fn update_subject(st: Db, _: Admin, id: web::Path<i32>, body: web::Json<SubjectInput>) -> ApiResult<HttpResponse> {
    if let Some(teacher_id) = body.teacher_id {
        // The new teacher must be free in every slot this subject already occupies.
        let clash: Option<String> = sqlx::query_scalar(
            "SELECT 'Class ' || other.class_id || ' ' || s2.subject_name || ' on '
                    || (ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[other.day_of_week]
                    || ' at ' || other.start_hour || ':00'
             FROM timetable mine
             JOIN timetable other ON other.day_of_week = mine.day_of_week AND other.start_hour = mine.start_hour
                                 AND other.subject_id <> mine.subject_id
             JOIN subjects s2 ON s2.subject_id = other.subject_id
             WHERE mine.subject_id = $1 AND s2.teacher_id = $2 LIMIT 1",
        )
        .bind(*id)
        .bind(teacher_id)
        .fetch_optional(&st.db)
        .await?;
        if let Some(clash) = clash {
            return Err(AppError::Conflict(format!("That teacher is already busy with {clash}.")));
        }
    }
    match sqlx::query("UPDATE subjects SET subject_name = btrim($1), teacher_id = $2 WHERE subject_id = $3")
        .bind(&body.subject_name)
        .bind(body.teacher_id)
        .bind(*id)
        .execute(&st.db)
        .await?
        .rows_affected()
    {
        0 => Err(AppError::NotFound("Subject not found.")),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub async fn delete_subject(st: Db, _: Admin, id: web::Path<i32>) -> ApiResult<HttpResponse> {
    delete(&st, "DELETE FROM subjects WHERE subject_id = $1", *id, "Subject not found.").await
}

// ---------- Timetable ----------

#[derive(Deserialize)]
pub struct ClassQuery {
    class_id: i16,
}

#[derive(Deserialize)]
pub struct SlotInput {
    class_id: i16,
    day_of_week: i16,
    start_hour: i16,
    subject_id: i32,
}

pub async fn timetable(st: Db, _: Admin, q: web::Query<ClassQuery>) -> JsonResult {
    Ok(web::Json(shared::timetable(&st.db, "tt.class_id = $1", q.class_id.into()).await?))
}

/// Puts a subject in a class's weekly slot, replacing whatever was there, unless its teacher is busy elsewhere.
/// ponytail: check-then-write; two admins editing the same teacher at the same instant could double-book.
pub async fn set_slot(st: Db, _: Admin, body: web::Json<SlotInput>) -> ApiResult<HttpResponse> {
    let clash: Option<String> = sqlx::query_scalar(
        "SELECT 'Class ' || tt.class_id || ' ' || s.subject_name
         FROM timetable tt JOIN subjects s ON s.subject_id = tt.subject_id
         WHERE s.teacher_id = (SELECT teacher_id FROM subjects WHERE subject_id = $1)
           AND tt.day_of_week = $2 AND tt.start_hour = $3 AND tt.class_id <> $4 LIMIT 1",
    )
    .bind(body.subject_id)
    .bind(body.day_of_week)
    .bind(body.start_hour)
    .bind(body.class_id)
    .fetch_optional(&st.db)
    .await?;
    if let Some(clash) = clash {
        return Err(AppError::Conflict(format!("This subject's teacher is already teaching {clash} at that time.")));
    }
    sqlx::query(
        "INSERT INTO timetable (class_id, subject_id, day_of_week, start_hour) VALUES ($1, $2, $3, $4)
         ON CONFLICT (class_id, day_of_week, start_hour) DO UPDATE SET subject_id = EXCLUDED.subject_id",
    )
    .bind(body.class_id)
    .bind(body.subject_id)
    .bind(body.day_of_week)
    .bind(body.start_hour)
    .execute(&st.db)
    .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn clear_slot(st: Db, _: Admin, id: web::Path<i32>) -> ApiResult<HttpResponse> {
    delete(&st, "DELETE FROM timetable WHERE timetable_id = $1", *id, "That lecture was already removed.").await
}

// ---------- Notices ----------

#[derive(Deserialize)]
pub struct NoticeInput {
    title: String,
    content: String,
    audience: String,
    #[serde(default)]
    pinned: bool,
    publish_date: Option<NaiveDate>,
    expiry_date: Option<NaiveDate>,
}

fn notice_query<'q>(sql: &'q str, n: &'q NoticeInput) -> Query<'q, Postgres, PgArguments> {
    sqlx::query(sql)
        .bind(&n.title)
        .bind(&n.content)
        .bind(&n.audience)
        .bind(n.pinned)
        .bind(n.publish_date)
        .bind(n.expiry_date)
}

/// All notices, including scheduled and expired ones.
pub async fn list_notices(st: Db, _: Admin) -> JsonResult {
    let sql = rows("SELECT * FROM notices", "r.pinned DESC, r.publish_date DESC, r.notice_id DESC");
    Ok(web::Json(sqlx::query_scalar(&sql).fetch_one(&st.db).await?))
}

pub async fn create_notice(st: Db, _: Admin, body: web::Json<NoticeInput>) -> ApiResult<HttpResponse> {
    notice_query(
        "INSERT INTO notices (title, content, audience, pinned, publish_date, expiry_date)
         VALUES (btrim($1), btrim($2), $3, $4, coalesce($5, CURRENT_DATE), $6)",
        &body,
    )
    .execute(&st.db)
    .await?;
    Ok(HttpResponse::Created().finish())
}

pub async fn update_notice(st: Db, _: Admin, id: web::Path<i32>, body: web::Json<NoticeInput>) -> ApiResult<HttpResponse> {
    match notice_query(
        "UPDATE notices SET title = btrim($1), content = btrim($2), audience = $3, pinned = $4,
                publish_date = coalesce($5, publish_date), expiry_date = $6
         WHERE notice_id = $7",
        &body,
    )
    .bind(*id)
    .execute(&st.db)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::NotFound("Notice not found.")),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub async fn delete_notice(st: Db, _: Admin, id: web::Path<i32>) -> ApiResult<HttpResponse> {
    delete(&st, "DELETE FROM notices WHERE notice_id = $1", *id, "Notice not found.").await
}

// ---------- Reports ----------

#[derive(Deserialize)]
pub struct ClassSemester {
    class_id: i16,
    semester: i16,
}

/// Subject averages and a student ranking for one class and semester.
pub async fn class_report(st: Db, _: Admin, q: web::Query<ClassSemester>) -> JsonResult {
    let sql = format!(
        "SELECT json_build_object(
            'subjects', (SELECT coalesce(json_agg(x ORDER BY x.subject_name), '[]'::json) FROM (
                SELECT s.subject_id, s.subject_name, t.first_name || ' ' || t.last_name AS teacher_name,
                       round(avg(g.average), 1) AS average, count(g.average) AS graded
                FROM subjects s
                LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
                LEFT JOIN grades g ON g.subject_id = s.subject_id AND g.semester = $2
                WHERE s.class_id = $1 GROUP BY s.subject_id, t.teacher_id) x),
            'students', (SELECT coalesce(json_agg(x ORDER BY x.average DESC NULLS LAST, x.name), '[]'::json) FROM (
                SELECT st.student_id, st.first_name || ' ' || st.last_name AS name,
                       (SELECT round(avg(g.average), 1) FROM grades g
                        WHERE g.student_id = st.student_id AND g.semester = $2) AS average,
                       (SELECT {ATTENDED_PCT} FROM attendance a WHERE a.student_id = st.student_id) AS attendance
                FROM students st WHERE st.class_id = $1) x))"
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(q.class_id).bind(q.semester).fetch_one(&st.db).await?))
}
