use crate::auth::Student;
use crate::shared::{self, Db, JsonResult, SemesterQuery, ATTENDED_PCT};
use actix_web::web;

pub async fn dashboard(st: Db, Student(id): Student) -> JsonResult {
    let sql = format!(
        "SELECT json_build_object(
            'class_id', st.class_id,
            'subjects', (SELECT count(*) FROM subjects s WHERE s.class_id = st.class_id),
            'attendance', (SELECT json_build_object('total', count(*), 'attended', count(*) FILTER (WHERE status <> 'A'),
                                                    'percent', {ATTENDED_PCT})
                           FROM attendance a WHERE a.student_id = st.student_id),
            'average', (SELECT round(avg(g.average), 1) FROM grades g WHERE g.student_id = st.student_id))
         FROM students st WHERE st.student_id = $1"
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(id).fetch_one(&st.db).await?))
}

pub async fn timetable(st: Db, Student(id): Student) -> JsonResult {
    let filter = "tt.class_id = (SELECT class_id FROM students WHERE student_id = $1)";
    Ok(web::Json(shared::timetable(&st.db, filter, id).await?))
}

/// Per-subject totals plus the full day-by-day history.
pub async fn attendance(st: Db, Student(id): Student) -> JsonResult {
    let sql = format!(
        "SELECT json_build_object(
            'subjects', (SELECT coalesce(json_agg(x ORDER BY x.subject_name), '[]'::json) FROM (
                SELECT s.subject_name, count(*) AS total,
                       count(*) FILTER (WHERE status = 'P') AS present,
                       count(*) FILTER (WHERE status = 'L') AS late,
                       count(*) FILTER (WHERE status = 'A') AS absent,
                       {ATTENDED_PCT} AS percent
                FROM attendance a JOIN subjects s ON s.subject_id = a.subject_id
                WHERE a.student_id = $1 GROUP BY s.subject_id) x),
            'records', (SELECT coalesce(json_agg(x ORDER BY x.date DESC, x.subject_name), '[]'::json) FROM (
                SELECT a.date, a.status, s.subject_name
                FROM attendance a JOIN subjects s ON s.subject_id = a.subject_id
                WHERE a.student_id = $1) x))"
    );
    Ok(web::Json(sqlx::query_scalar(&sql).bind(id).fetch_one(&st.db).await?))
}

pub async fn report(st: Db, Student(id): Student, q: web::Query<SemesterQuery>) -> JsonResult {
    Ok(web::Json(shared::report_card(&st.db, id, q.semester).await?))
}
