package models

// Attendance represents attendance data
type Attendance struct {
	AttendanceID int    `json:"attendance_id" db:"attendance_id"`
	Date         string `json:"date,omitempty" db:"date"`
	Status       string `json:"status,omitempty" db:"status"`
	ClassID      int    `json:"class_id" db:"class_id"`
	SubjectID    int    `json:"subject_id" db:"subject_id"`
	StudentID    int    `json:"student_id" db:"student_id"`
}
