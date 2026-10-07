use crate::auth::Teacher;
use crate::error::{ApiResult, AppError};
use crate::shared::{self, rows, Db, JsonResult};
use actix_web::{web, HttpResponse};
use chrono::NaiveDate;
use serde::Deserialize;
use sqlx::PgPool;

#[derive(Deserialize)]
pub struct DateQuery {
    date: NaiveDate,
}

/// `date` is the teacher's local date, so "today" matches their clock rather than the server's.
pub async fn dashboard(st: Db, Teacher(id): Teacher, q: web::Query<DateQuery>) -> JsonResult {
    let sql = "SELECT json_build_object(
        'subjects', (SELECT count(*) FROM subjects WHERE teacher_id = $1),
        'classes', (SELECT count(DISTINCT class_id) FROM subjects WHERE teacher_id = $1),
        'students', (SELECT count(*) FROM students WHERE class_id IN (SELECT class_id FROM subjects WHERE teacher_id = $1)),
        'weekly_lectures', (SELECT count(*) FROM timetable tt JOIN subjects s ON s.subject_id = tt.subject_id
                            WHERE s.teacher_id = $1),
        'today', (SELECT coalesce(json_agg(x ORDER BY x.start_hour), '[]'::json) FROM (
            SELECT tt.timetable_id, tt.class_id, tt.start_hour, s.subject_id, s.subject_name,
                   EXISTS (SELECT 1 FROM attendance a WHERE a.subject_id = s.subject_id AND a.date = $2) AS attendance_taken
            FROM timetable tt JOIN subjects s ON s.subject_id = tt.subject_id
            WHERE s.teacher_id = $1 AND tt.day_of_week = extract(isodow FROM $2::date)) x))";
    Ok(web::Json(sqlx::query_scalar(sql).bind(id).bind(q.date).fetch_one(&st.db).await?))
}

pub async fn subjects(st: Db, Teacher(id): Teacher) -> JsonResult {
    let sql = rows(
        "SELECT s.subject_id, s.subject_name, s.class_id,
                (SELECT count(*) FROM students st WHERE st.class_id = s.class_id) AS students
         FROM subjects s WHERE s.teacher_id = $1",
        "r.class_id, r.subject_name",
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(id).fetch_one(&st.db).await?))
}

pub async fn timetable(st: Db, Teacher(id): Teacher) -> JsonResult {
    Ok(web::Json(shared::timetable(&st.db, "s.teacher_id = $1", id).await?))
}

/// The class a subject belongs to, but only if this teacher teaches it.
async fn own_subject_class(db: &PgPool, teacher_id: i32, subject_id: i32) -> ApiResult<i16> {
    sqlx::query_scalar("SELECT class_id FROM subjects WHERE subject_id = $1 AND teacher_id = $2")
        .bind(subject_id)
        .bind(teacher_id)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::Forbidden)
}

/// Rejects a batch if any student in it is not in the subject's class. Called inside the write's transaction.
fn all_saved(saved: u64, sent: usize) -> ApiResult<()> {
    if saved == sent as u64 {
        Ok(())
    } else {
        Err(AppError::BadRequest("Some students are no longer in this class. Reload the page and try again.".into()))
    }
}

// ---------- Attendance ----------

#[derive(Deserialize)]
pub struct RosterQuery {
    subject_id: i32,
    date: NaiveDate,
}

/// Class list with any attendance already marked for that subject and date.
pub async fn attendance(st: Db, Teacher(id): Teacher, q: web::Query<RosterQuery>) -> JsonResult {
    let class_id = own_subject_class(&st.db, id, q.subject_id).await?;
    let sql = rows(
        "SELECT st.student_id, st.first_name, st.last_name, a.status
         FROM students st
         LEFT JOIN attendance a ON a.student_id = st.student_id AND a.subject_id = $1 AND a.date = $2
         WHERE st.class_id = $3",
        "r.first_name, r.last_name",
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(q.subject_id).bind(q.date).bind(class_id).fetch_one(&st.db).await?))
}

#[derive(Deserialize)]
pub struct Mark {
    student_id: i32,
    status: String,
}

#[derive(Deserialize)]
pub struct AttendanceInput {
    subject_id: i32,
    date: NaiveDate,
    records: Vec<Mark>,
}

/// Saves (or corrects) a whole class's attendance in one statement.
pub async fn save_attendance(st: Db, Teacher(id): Teacher, body: web::Json<AttendanceInput>) -> ApiResult<HttpResponse> {
    let class_id = own_subject_class(&st.db, id, body.subject_id).await?;
    let (students, statuses): (Vec<i32>, Vec<&str>) =
        body.records.iter().map(|m| (m.student_id, m.status.as_str())).unzip();
    let mut tx = st.db.begin().await?;
    let saved = sqlx::query(
        "INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
         SELECT r.student_id, $1, $2, r.status, $3
         FROM unnest($4::int[], $5::text[]) AS r(student_id, status)
         JOIN students st ON st.student_id = r.student_id AND st.class_id = $6
         ON CONFLICT (student_id, subject_id, date)
         DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, updated_at = now()",
    )
    .bind(body.subject_id)
    .bind(body.date)
    .bind(id)
    .bind(&students)
    .bind(&statuses)
    .bind(class_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();
    all_saved(saved, students.len())?;
    tx.commit().await?;
    Ok(HttpResponse::NoContent().finish())
}

// ---------- Grades ----------

#[derive(Deserialize)]
pub struct GradeQuery {
    subject_id: i32,
    semester: i16,
}

pub async fn grades(st: Db, Teacher(id): Teacher, q: web::Query<GradeQuery>) -> JsonResult {
    let class_id = own_subject_class(&st.db, id, q.subject_id).await?;
    let sql = rows(
        "SELECT st.student_id, st.first_name, st.last_name,
                g.quiz_grade, g.homework_grade, g.test_grade, g.project_grade, g.average
         FROM students st
         LEFT JOIN grades g ON g.student_id = st.student_id AND g.subject_id = $1 AND g.semester = $2
         WHERE st.class_id = $3",
        "r.first_name, r.last_name",
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(q.subject_id).bind(q.semester).bind(class_id).fetch_one(&st.db).await?))
}

#[derive(Deserialize)]
pub struct GradeRow {
    student_id: i32,
    quiz_grade: Option<i16>,
    homework_grade: Option<i16>,
    test_grade: Option<i16>,
    project_grade: Option<i16>,
}

#[derive(Deserialize)]
pub struct GradesInput {
    subject_id: i32,
    semester: i16,
    records: Vec<GradeRow>,
}

/// Saves the whole gradebook for a subject and semester in one statement.
pub async fn save_grades(st: Db, Teacher(id): Teacher, body: web::Json<GradesInput>) -> ApiResult<HttpResponse> {
    let class_id = own_subject_class(&st.db, id, body.subject_id).await?;
    let column = |f: fn(&GradeRow) -> Option<i16>| body.records.iter().map(f).collect::<Vec<_>>();
    let students: Vec<i32> = body.records.iter().map(|r| r.student_id).collect();
    let mut tx = st.db.begin().await?;
    let saved = sqlx::query(
        "INSERT INTO grades (student_id, subject_id, semester, quiz_grade, homework_grade, test_grade, project_grade)
         SELECT r.student_id, $1, $2, r.quiz, r.homework, r.test, r.project
         FROM unnest($3::int[], $4::smallint[], $5::smallint[], $6::smallint[], $7::smallint[])
              AS r(student_id, quiz, homework, test, project)
         JOIN students st ON st.student_id = r.student_id AND st.class_id = $8
         ON CONFLICT (student_id, subject_id, semester) DO UPDATE SET
             quiz_grade = EXCLUDED.quiz_grade, homework_grade = EXCLUDED.homework_grade,
             test_grade = EXCLUDED.test_grade, project_grade = EXCLUDED.project_grade, updated_at = now()",
    )
    .bind(body.subject_id)
    .bind(body.semester)
    .bind(&students)
    .bind(column(|r| r.quiz_grade))
    .bind(column(|r| r.homework_grade))
    .bind(column(|r| r.test_grade))
    .bind(column(|r| r.project_grade))
    .bind(class_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();
    all_saved(saved, students.len())?;
    tx.commit().await?;
    Ok(HttpResponse::NoContent().finish())
}
