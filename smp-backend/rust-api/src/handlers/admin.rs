use std::string;

use actix_web::{web, HttpResponse, Responder, Error};
use reqwest::ResponseBuilderExt;
use crate::models::notice::Notice;
use crate::models::student::Student;
use crate::models::teacher::Teacher;
use crate::models::grade::Grade;
use crate::models::subject::{self, Subject};
use crate::models::timetable::{self, Timetable};
use sqlx::{PgPool,Row};
use serde_json::json;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow};
use sqlx::types::BigDecimal;



pub async fn add_student_details(student: web::Json<Student>, pool: web::Data<PgPool>) -> impl Responder {
    let student = student.into_inner(); // Extract student data from request body
    let result = sqlx::query_as::<_, Student>(
        "INSERT INTO students (first_name, last_name, date_of_birth, gender, address, phone_number, email, addmission_date, class_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    )
    .bind(student.first_name)
    .bind(student.last_name)
    .bind(student.date_of_birth)
    .bind(student.gender)
    .bind(student.address)
    .bind(student.phone_number)
    .bind(student.email)
    .bind(student.addmission_date)
    .bind(student.class_id as i32)
    .fetch_one(pool.get_ref())
    .await;
    
    // match result {
    //     Ok(inserted_student) => HttpResponse::Ok().body(inserted_student.student_id.to_string()),
    //     Err(e) => {
    //         eprintln!("Error inserting student: {:?}", e);
    //         HttpResponse::InternalServerError().finish()
    //     }
        
    // }

    let result = sqlx::query_as::<_, Student>("SELECT * FROM students WHERE class_id = $1 ORDER BY student_id ASC")
    .bind(student.class_id )
    .fetch_all(pool.get_ref())
    .await;

    match result {
    Ok(students) => HttpResponse::Ok().json(students), // Return a JSON array of students
    Err(e) => {
        println!("Error getting students: {:?}", e);
        HttpResponse::InternalServerError().finish()
    },
    } 
    
}

pub async fn get_all_students(class_id: web::Path<i32>,pool: web::Data<PgPool>) -> impl Responder {
    let class_id = class_id.into_inner();
    
    let result = sqlx::query_as::<_, Student>("SELECT * FROM students WHERE class_id = $1 ORDER BY student_id ASC")
        .bind(class_id)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(students) => HttpResponse::Ok().json(students), // Return a JSON array of students
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

// Update student handler function
pub async fn update_student(path: web::Path<i32>, // Path parameter for student_id
    new_student: web::Json<Student>, pool: web::Data<PgPool>) -> impl Responder {
    let student_id = path.into_inner(); 
    let new_student = new_student.into_inner(); 

    // Execute the update query and fetch the updated student details
    let result = sqlx::query_as::<_, Student>(
        "UPDATE students SET first_name = $1,last_name = $2,date_of_birth = $3,gender = $4,address = $5, 
        phone_number = $6, email = $7, class_id = $8 WHERE student_id = $9 RETURNING *", 
    )
    .bind(new_student.first_name)
    .bind(new_student.last_name)
    .bind(new_student.date_of_birth)
    .bind(new_student.gender)
    .bind(new_student.address)
    .bind(new_student.phone_number)
    .bind(new_student.email)
    .bind(new_student.class_id as i32)
    .bind(student_id) 
    .fetch_one(pool.get_ref()) 
    .await;

    // match result {
    //     Ok(updated_student) => HttpResponse::Ok().json(updated_student), 
    //     Err(_) => HttpResponse::InternalServerError().finish(), 
    // }

    // to get the updated list of students
    let result = sqlx::query_as::<_, Student>("SELECT * FROM students WHERE class_id = $1 ORDER BY student_id ASC")
        .bind(new_student.class_id)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(students) => HttpResponse::Ok().json(students), 
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}


// Delete student handler function
pub async fn delete_student(path: web::Path<(i32,i32)>, pool: web::Data<PgPool>, ) -> impl Responder {
    print!("Deleting student");
    let (student_id,class_id) = path.into_inner();

    let result = sqlx::query!(
        "DELETE FROM students WHERE student_id = $1", student_id
    )
    .execute(pool.get_ref())
    .await;

    let result = sqlx::query_as::<_, Student>("SELECT * FROM students WHERE class_id = $1 ORDER BY student_id ASC")
        .bind(class_id)
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(students) => HttpResponse::Ok().json(students), // Return a JSON array of students
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn add_teacher_details(teacher: web::Json<Teacher>,pool: web::Data<PgPool>) -> impl Responder{
    let teacher = teacher.into_inner();
    let result = sqlx::query_as::<_, Teacher>(
        "INSERT INTO teachers (first_name, last_name, date_of_birth, gender, address, phone_number, email, qualification,hire_date,subject_name) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
    )
    .bind(teacher.first_name)
    .bind(teacher.last_name)
    .bind(teacher.date_of_birth)
    .bind(teacher.gender)
    .bind(teacher.address)
    .bind(teacher.phone_number)
    .bind(teacher.email)
    .bind(teacher.qualification)
    .bind(teacher.hire_date)
    .bind(teacher.subject_name)
    .fetch_one(pool.get_ref())
    .await;

    // match result {
    //     Ok(inserted_teacher) => HttpResponse::Ok().body(inserted_teacher.teacher_id.to_string()),
    //     Err(_) => HttpResponse::InternalServerError().finish(),
    // }

    // to get the updated list back after adding student
    let result = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers ORDER BY teacher_id ASC")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(teachers) => HttpResponse::Ok().json(teachers),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
    
}

pub async fn get_all_teachers(pool: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers ORDER BY teacher_id ASC")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(teachers) => HttpResponse::Ok().json(teachers),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn update_teacher(teacher: web::Json<Teacher>, pool: web::Data<PgPool>) -> impl Responder {
    print!("inside update teacher");
    let teacher = teacher.into_inner();
    let result = sqlx::query_as::<_, Teacher>(
        "UPDATE teachers SET first_name = $1,last_name = $2,date_of_birth = $3,gender = $4,address = $5, 
        phone_number = $6, email = $7, hire_date = $8, qualification = $9, subject_name =$10 
        WHERE teacher_id = $11 RETURNING *", 
    )
    .bind(teacher.first_name)
    .bind(teacher.last_name)
    .bind(teacher.date_of_birth)
    .bind(teacher.gender)
    .bind(teacher.address)
    .bind(teacher.phone_number)
    .bind(teacher.email)
    .bind(teacher.hire_date)
    .bind(teacher.qualification)
    .bind(teacher.subject_name)
    .bind(teacher.teacher_id)
    .fetch_one(pool.get_ref())
    .await;

    let result = sqlx::query_as::<_,Teacher>("SELECT * FROM teachers ORDER BY teacher_id ASC")
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(teachers) => HttpResponse::Ok().json(teachers),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn delete_teacher(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder{
    eprint!("delete called");
    let teacher_id = path.into_inner();
    let result = sqlx::query!(
        "DELETE FROM teachers WHERE teacher_id= $1", teacher_id
    )
    .execute(pool.get_ref())
    .await;

    // match result {
    //     Ok(_) => {
    //         //afterDelete();

    //         HttpResponse::Ok().body("Teacher Deleted Successfully")
    //     }
    //     Err(_) => HttpResponse::InternalServerError().finish(),
    // }

    // to get the updated list back after deleting student
    let result = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers ORDER BY teacher_id ASC")
        .fetch_all(pool.get_ref())
        .await;

    match result {
        Ok(teachers) => HttpResponse::Ok().json(teachers),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

// async fn afterDelete(){
//     async fn some_function(pool: web::Data<PgPool>) -> impl Responder {
//         let response = get_all_teachers(pool).await; 
//         eprint!("afterDelete");
//         // Return the response from get_all_teachers
//         response
//     }
//}

pub async fn get_all_notices(pool: web::Data<PgPool>) -> impl Responder{
    print!("get_all_notices request");
    let result = sqlx::query_as::<_,Notice>("SELECT * FROM notice")
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(notice) => HttpResponse::Ok().json(notice),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }   
}

pub async fn add_notice(notice: web::Json<Notice>, pool: web::Data<PgPool>) -> impl Responder{
    print!("\n\nadd notice\n\n");
    let notice = notice.into_inner();
    let result = sqlx::query_as::<_,Notice>(
        "INSERT INTO notice (title,content,publish_date,expiry_date)
        VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(notice.title)
    .bind(notice.content)
    .bind(notice.publish_date)
    .bind(notice.expiry_date)
    .fetch_one(pool.get_ref())
    .await;


    let result = sqlx::query_as::<_, Notice>("SELECT * FROM notice")
    .fetch_all(pool.get_ref())
    .await;
        // print!("{:?}",result);
        // print!("check");
    match result {
        Ok(notice) => HttpResponse::Ok().json(notice),
        Err(_) => HttpResponse::InternalServerError().finish(),
    } 
}

pub async fn delete_notice(path: web::Path<i32>,pool: web::Data<PgPool>) -> impl Responder {
    let notice_id = path.into_inner();
    let result = sqlx::query!(
        "DELETE FROM notice WHERE notice_id = $1",notice_id)
    .execute(pool.get_ref())
    .await;

    print!("get_all_notices request");
    let result = sqlx::query_as::<_,Notice>("SELECT * FROM notice")
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(notice) => HttpResponse::Ok().json(notice),
        Err(_) => HttpResponse::InternalServerError().finish(),
    } 
}

pub async fn get_student_grades(path: web::Path<i32>,pool: web::Data<PgPool>) -> impl Responder{
    let student_id = path.into_inner();
    let result  = sqlx::query_as::<_,Grade>("SELECT * FROM grades WHERE student_id = $1")
    .bind(student_id)
    .fetch_all(pool.get_ref())
    .await;
    
    match result {
        Ok(grades) => HttpResponse::Ok().json(grades),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

// pub async fn get_subject_name(path: web::Path<i32>,pool: web::Data<PgPool>) -> impl Responder{
//     let subject_id = path.into_inner();
//     let result = sqlx::query_as::<_,Subject>("SELECT * FROM 
//     subjects WHERE subject_id = $1")
//     .bind(subject_id)
//     .fetch_all(pool.get_ref())
//     .await;

//     match result {
//         Ok(subject) => HttpResponse::Ok().json(subject),
//         Err(_) => HttpResponse::InternalServerError().finish(),
//     }
// }

pub async fn get_subjects_by_class_id(path: web::Path<i32>,pool: web::Data<PgPool>) -> impl Responder{
    let class_id = path.into_inner();
    let result = sqlx::query_as::<_,Subject>("SELECT * FROM subjects WHERE class_id = $1")
    .bind(class_id)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(subjects) => HttpResponse::Ok().json(subjects), 
        Err(e) => { eprint!("{}",e);
            HttpResponse::InternalServerError().finish()}
    }
}

pub async fn get_teacher_by_subject_name(path: web::Path<String>,pool: web::Data<PgPool>) -> impl Responder{
    let subject_name = path.into_inner();
    let result = sqlx::query_as::<_,Teacher>("SELECT * FROM teachers WHERE subject_name = $1")
    .bind(subject_name)
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(teacher) => HttpResponse::Ok().json(teacher),
        Err(_) => HttpResponse::InternalServerError().finish()
    }
}

pub async fn get_subject_details(pool: web::Data<PgPool>) -> impl Responder{
    print!("inside get subject details");
    let result = sqlx::query_as::<_,Subject>("SELECT * FROM subjects")
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(subjects) => HttpResponse::Ok().json(subjects),
        Err(_) => HttpResponse::InternalServerError().finish()
    }
}

pub async fn add_subject_details(subject: web::Json<Subject>, pool: web::Data<PgPool>) -> impl Responder {
    let subject = subject.into_inner();
    let result = sqlx::query_as::<_,Subject>(
        "INSERT INTO subjects (subject_name,class_id,teacher_id)
        VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(subject.subject_name)
    .bind(subject.class_id)
    .bind(subject.teacher_id)
    .fetch_one(pool.get_ref())
    .await;

    let result = sqlx::query_as::<_, Subject>("SELECT * FROM subjects")
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(subjects) => HttpResponse::Ok().json(subjects),
        Err(_) => HttpResponse::InternalServerError().finish()
    }
}

pub async fn add_schedule(data: web::Json<Timetable>, pool: web::Data<PgPool>) -> impl Responder{
    let data = data.into_inner();

    // let start_time_string = data.start_time.clone();
    // let start_time_integer: i32 = start_time_string.parse().unwrap_or_default();
    // let incremented_start_time = start_time_integer + 1;
    // let incremented_start_time_string = incremented_start_time.to_string();
     
    let result = sqlx::query_as::<_, Timetable>(
        "INSERT INTO timetable (day_of_week,subject_name,class_id, teacher_id,subject_id, start_time, end_time) 
        VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING *",
    )
    .bind(data.day_of_week)
    .bind(data.subject_name)
    .bind(data.class_id as i32)
    .bind(data.teacher_id)
    .bind(data.subject_id)
    .bind(data.start_time)
    .bind(data.end_time)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(inserted_schedule) => HttpResponse::Ok().json(inserted_schedule),
        Err(e) => {
                println!("{}", e);
                HttpResponse::InternalServerError().finish()
        },
    }
}

pub async fn get_teacher_by_sub_id(path: web::Path<i32>, pool: web::Data<PgPool>) -> impl Responder {
    let subject_id = path.into_inner();

    // Define the SQL query to join subject table with teacher table
    let query = r#"SELECT teachers.teacher_id, teachers.first_name,teachers.last_name FROM subjects JOIN teachers ON subjects.teacher_id = teachers.teacher_id 
    WHERE subjects.subject_id = $1"#;

    // Execute the query and fetch the result
    match sqlx::query(query)
        .bind(subject_id)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(row) => {
            let teacher_id: i32 = row.get("teacher_id");
            let teacher_name: String = row.get("first_name");
            let teacher_surname: String = row.get("last_name");
            let response = json!({
                "teacher_id": teacher_id,
                "first_name": teacher_name,
                "last_name": teacher_surname,
            });
            HttpResponse::Ok().json(response)
        },
        Err(_) => {
            HttpResponse::NotFound().finish()
        }
    }

}

pub async fn total_admissions_report_for_each_year(pool: web::Data<PgPool>) -> impl Responder {
    let query = sqlx::query!(
        "SELECT SUBSTRING(addmission_date FROM 1 FOR 4) AS year, COUNT(*) as total_admissions FROM students GROUP BY year ORDER BY year ASC"
    );

    let result = query.fetch_all(pool.get_ref()).await;

    match result {
        Ok(rows) => {
            let mut response_body = vec![];
            for row in rows {
                let year = row.year.clone().unwrap_or_default();
                let total_admissions: i64 = row.total_admissions.unwrap_or_default();
                let data = json!({ "year": year, "total_admissions": total_admissions });
                response_body.push(data);
            }
            HttpResponse::Ok().json(response_body)
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}


#[derive(Debug, Serialize,FromRow)]
pub struct AttendanceReport {
    pub class_id: i32,
    pub subject_id: i32,
    pub total_attendance_count: i64,
    pub present_count: i64,
    pub absent_count: i64,
    pub attendance_rate: f64,
}

async fn get_attendance_report(pool: web::Data<PgPool>) -> impl Responder {
    let query = r#"
    SELECT
    att.class_id,
    att.subject_id,
    COUNT(att.attendance_id) AS total_attendance_count,
    COUNT(CASE WHEN att.status = 'P' THEN 1 END) AS present_count,
    COUNT(CASE WHEN att.status = 'A' THEN 1 END) AS absent_count,
    ROUND((COUNT(CASE WHEN att.status = 'P' THEN 1 END)::numeric / COUNT(att.attendance_id)::numeric) * 100, 2) AS attendance_rate
FROM
    Attendance att
GROUP BY
    att.class_id,
    att.subject_id;

    "#;
    match sqlx::query_as::<_, AttendanceReport>(query
    )
    .fetch_all(pool.get_ref())
    .await

    {
        Ok(report) => HttpResponse::Ok().json(report),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
   
}

#[derive(Debug, Serialize, FromRow)]
pub struct ClassGradeData {
    pub class_id: i32,
    pub quiz_grade: f32,
    pub homework_grade: f32,
    pub test_grade: f32,
    pub project_grade: f32,
}

// Define a function to fetch class-wise grade data from the database
pub async fn get_class_grades(pool: web::Data<PgPool>) -> impl Responder {
    // Perform SQL query to fetch class-wise grade data
    let query = r#"
    SELECT subjects.class_id, ROUND(AVG((quiz_grade + homework_grade + test_grade + project_grade)::FLOAT4 / 4),2) AS average_grade
    FROM grades
    JOIN subjects ON grades.subject_id = subjects.subject_id
    GROUP BY subjects.class_id;
    "#;
    match sqlx::query_as::<_, ClassGradeData>(query
    )
    .fetch_all(pool.get_ref())
    .await

    {
        Ok(report) => HttpResponse::Ok().json(report),
        Err(e) => {
            print!("{}", e);
            HttpResponse::InternalServerError().finish()
        },
    }
   
}