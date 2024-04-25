use actix_web::web::get;
use actix_web::{web, App, HttpServer, Responder, middleware::Logger};
use actix_cors::Cors;
use actix_web::http::header;
//use handlers::admin::add_notice; // Import the header module
use crate::handlers::student_handler::{add_student,get_total_count,add_teacher};
mod middleware;
use middleware::require_authentication::AuthenticationMiddleware;
mod handlers;
// use handlers::auth_handler::{login, establish_connection}; 
use crate::handlers::auth_handler::{user_login,change_password};

use sqlx::PgPool;
use crate::handlers::admin::{add_student_details,get_all_students,update_student,delete_student,
                             add_teacher_details,get_all_teachers,update_teacher,delete_teacher,
                             get_all_notices,add_notice,delete_notice,
                             get_student_grades,get_subjects_by_class_id,get_teacher_by_sub_id,
                             get_teacher_by_subject_name,get_subject_details,add_subject_details,
                             add_schedule,total_admissions_report_for_each_year,get_class_grades
                            //  get_subject_name,
                            };
use crate::handlers::shared::{get_notices};
use crate::handlers::teacher::{get_timetable,get_subjects,get_students_by_class,submit_attendance,get_teacher_schedule,
                             get_timetable_by_day_hour,get_grades_for_subject_semester_student,add_grade,update_grade,get_total_classes_for_teacher};
use crate::handlers::student::{get_student_by_class,get_grades_of_sem,get_attendance_for_student,get_todays_lectures,
                             get_timetable_for_student};
// use crate::handlers::shared::{get_notices};
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPool::connect("postgres://postgres:hash@localhost/smp_db").await.unwrap();
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST", "DELETE", "PUT"])
            .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE])
            .supports_credentials();// Allow credentials (cookies) to be sent with requests
            

        App::new()
            .wrap(AuthenticationMiddleware)
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(web::Data::new(pool.clone())) // Use app_data instead of data
            .service(web::resource("/login").route(web::post().to(user_login)))
            .service(web::resource("/change_password").route(web::put().to(change_password)))
            // ADMIN
            .service(web::resource("/add_student").route(web::post().to(add_student))) // student_handler
            .service(web::resource("/get_total_count").route(web::get().to(get_total_count)))
            .service(web::resource("/add_teacher").route(web::post().to(add_teacher)))

            .service(web::resource("/add_student_details").route(web::post().to(add_student_details))) // admin_handler
            .service(web::resource("/get_all_students/{class_id}").route(web::get().to(get_all_students)))
            .service(web::resource("/update_student/{student_id}").route(web::put().to(update_student)))
            .service(web::resource("/delete_student/{student_id}/{class_id}").route(web::delete().to(delete_student)))

            .service(web::resource("/add_teacher_details").route(web::post().to(add_teacher_details)))
            .service(web::resource("/get_all_teachers").route(web::get().to(get_all_teachers)))
            .service(web::resource("/update_teacher/{teacher_id}").route(web::put().to(update_teacher)))
            .service(web::resource("/delete_teacher/{teacher_id}").route(web::delete().to(delete_teacher)))

            .service(web::resource("/get_all_notices").route(web::get().to(get_all_notices)))
            .service(web::resource("/add_notice").route(web::post().to(add_notice)))
            .service(web::resource("/delete_notice/{notice_id}").route(web::delete().to(delete_notice)))

            .service(web::resource("/get_student_grades/{student_id}").route(web::get().to(get_student_grades)))
            // .service(web::resource("/get_subject_name/{subject_id}").route(web::get().to(get_subject_name)))

            .service(web::resource("/get_subjects_by_class_id/{class_id}").route(web::get().to(get_subjects_by_class_id)))
            .service(web::resource("/get_teacher_by_subject_name/{subject_name}").route(web::get().to(get_teacher_by_subject_name)))
            .service(web::resource("/get_teacher_by_sub_id/{subject_id}").route(web::get().to(get_teacher_by_sub_id)))
            .service(web::resource("/get_subject_details").route(web::get().to(get_subject_details)))
            .service(web::resource("/add_subject_details").route(web::post().to(add_subject_details)))

            .service(web::resource("/add_schedule").route(web::post().to(add_schedule)))
            .service(web::resource("/total_admissions_report_for_each_year").route(web::get().to(total_admissions_report_for_each_year)))
            .service(web::resource("/get_class_grades").route(web::get().to(get_class_grades)))

            // STUDENT
            .service(web::resource("/get/all/notices").route(web::get().to(get_notices)))


            .service(web::resource("/get_timetable/{teacher_id}/{day_of_week}").route(web::get().to(get_timetable)))
            .service(web::resource("/get/student-by/class/{class_id}").route(web::get().to(get_student_by_class)))
            .service(web::resource("/get_subjects/{teacher_id}").route(web::get().to(get_subjects)))
            .service(web::resource("/students/{class_id}").route(web::get().to(get_students_by_class)))

            .service(web::resource("/submit/attendance/{subject_id}").route(web::post().to(submit_attendance)))
            .service(web::resource("/get_teacher_schedule/{teacher_id}").route(web::get().to(get_teacher_schedule)))
            .service(web::resource("/get_timetable_by_day_hour/{teacher_id}/{day_of_week}/{current_hour}").route(web::get().to(get_timetable_by_day_hour)))

            .service(web::resource("/get_grades_for_subject_semester_student/{subject_id}/{student_id}/{semester}").route(web::get().to(get_grades_for_subject_semester_student)))
            .service(web::resource("/add/grade").route(web::post().to(add_grade)))
            .service(web::resource("/update/grade").route(web::put().to(update_grade)))

            
            .service(web::resource("/get_timetable_for_student/{student_id}").route(web::get().to(get_timetable_for_student)))
            //for student - to display grades for subject of specified semester
            .service(web::resource("/get_grades_of_sem/{student_id}/{semester}").route(web::get().to(get_grades_of_sem)))
            .service(web::resource("/get_attendance_for_student/{student_id}").route(web::get().to(get_attendance_for_student)))
            .service(web::resource("/get_todays_lectures/{student_id}/{day_of_week}").route(web::get().to(get_todays_lectures)))
            .service(web::resource("/get_total_classes_for_teacher/{teacher_id}").route(web::get().to(get_total_classes_for_teacher)))

    })
    .bind("127.0.0.1:3000")?
    .run()
    .await
}