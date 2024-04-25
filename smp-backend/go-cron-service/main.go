package main

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/GaneshBalki/go-cron-service/handler"
	"github.com/GaneshBalki/go-cron-service/models"
	"github.com/GaneshBalki/go-cron-service/redis"
	"github.com/gofiber/fiber/v2"
	_ "github.com/lib/pq"
	"github.com/robfig/cron/v3"
)

const (
	host     = "localhost"
	port     = 5432
	user     = "postgres"
	password = "hash"
	dbname   = "smp_db"
)

func main() {
	// Connect to PostgreSQL
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close() //defer will execute at the end of main function

	// Create Fiber app
	app := fiber.New()

	// Define routes
	app.Post("/add-attendance", handler.AddAttendanceHandler)
	// Create a new cron scheduler
	scheduler := cron.New()

	// Add a cron job to execute the task every hour
	// _, err = scheduler.AddFunc("@hourly", func() {

	_, err = scheduler.AddFunc("*/2 * * * *", func() {

		// Retrieve attendance data from Redis
		attendance, err := redis.PopAttendanceFromQueue()
		if err != nil {
			log.Println("Error retrieving attendance data from Redis:", err)
			return
		}

		// Insert attendance data into PostgreSQL
		err = InsertAttendance(db, attendance)
		if err != nil {
			log.Println("Error inserting attendance data into PostgreSQL:", err)
			return
		}

		log.Println("Attendance data inserted into PostgreSQL:", attendance)

	})
	if err != nil {
		log.Fatal("Error scheduling cron job:", err)
	}

	//create new cron for getting total number of classes
	teacherDashboardSceduler := cron.New()

	// Fetch teacher IDs from the database
	teacherIDs, err := fetchTeacherIDs(db)
	if err != nil {
		log.Fatal("Error fetching teacher IDs from the database:", err)
	}
	// Schedule cron job for updating total classes data in Redis
	_, err = scheduler.AddFunc("*/3 * * * *", func() {
		// Update total classes data in Redis for each teacher
		for _, teacherID := range teacherIDs {
			totalClasses, totalSubjects, totalLectures, err := updateTotalClasses(db, teacherID)
			if err != nil {
				log.Printf("Error retrieving total classes, Subject and Lectures data for teacher %d from database: %v", teacherID, err)
				continue
			}
			// err = redis.SetTotalClasses(teacherID, totalClasses)
			// if err != nil {
			// 	log.Printf("Error updating total classes data in Redis for teacher %d: %v", teacherID, err)
			// 	continue
			// }
			log.Printf("Total classes data updated in Redis for teacher %d: %d , subjects: %d, lectures: %d", teacherID, totalClasses, totalSubjects, totalLectures)
		}
	})
	if err != nil {
		log.Fatal("Error scheduling teacher cron job:", err)
	}

	// Start the cron scheduler
	scheduler.Start()
	teacherDashboardSceduler.Start()

	// Start the Fiber app
	log.Fatal(app.Listen(":8080"))
}

//db operations

func InsertAttendance(db *sql.DB, attendance models.Attendance) error {
	_, err := db.Exec("INSERT INTO attendance (date, status, class_id, subject_id, student_id) VALUES ($1, $2, $3, $4, $5)",
		attendance.Date, attendance.Status, attendance.ClassID, attendance.SubjectID, attendance.StudentID)
	return err
}

func updateTotalClasses(db *sql.DB, teacherID int) (int, int, int, error) {
	// Query the database to get the total number of distinct class IDs associated with the teacher
	var totalClasses int
	err := db.QueryRow("SELECT COUNT(DISTINCT class_id) FROM subjects WHERE teacher_id = $1", teacherID).Scan(&totalClasses)
	if err != nil {
		return 0, 0, 0, err
	}

	var totalSubjects int
	err = db.QueryRow("Select count(DISTINCT subject_id) from subjects where teacher_id= $1", teacherID).Scan(&totalSubjects)
	if err != nil {
		return 0, 0, 0, err
	}
	var totalLectures int
	err = db.QueryRow("Select count(*) from timetable where teacher_id= $1", teacherID).Scan(&totalLectures)
	if err != nil {
		return 0, 0, 0, err
	}
	// For example:
	err = redis.SetTotalClassesSubjectsLecure(teacherID, totalClasses, totalSubjects, totalLectures)
	if err != nil {
		return 0, 0, 0, err
	}
	log.Println("Total distinct classes, Subjects, Lectures data updated for teacher ID:", teacherID, "Total distinct classes: %d, S:-%d, L:-%d", totalClasses, totalSubjects, totalLectures)

	return totalClasses, totalSubjects, totalLectures, nil
}

// get all teachers id
func fetchTeacherIDs(db *sql.DB) ([]int, error) {
	var teacherIDs []int

	rows, err := db.Query("SELECT teacher_id FROM teachers")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var teacherID int
		if err := rows.Scan(&teacherID); err != nil {
			return nil, err
		}
		teacherIDs = append(teacherIDs, teacherID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return teacherIDs, nil
}
