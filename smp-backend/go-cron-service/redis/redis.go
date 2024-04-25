package redis

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/GaneshBalki/go-cron-service/models"
	"github.com/go-redis/redis/v8"
)

var ctx = context.Background()

// PushAttendanceToQueue pushes a serialized attendance object to the Redis queue
func PushAttendanceToQueue(serializedAttendance []byte) error {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	// Push serialized attendance object to the Redis queue
	_, err := rdb.LPush(ctx, "attendanceQueue", string(serializedAttendance)).Result()
	return err
}

// PopAttendanceFromQueue retrieves a attendanc object from the Redis queue
func PopAttendanceFromQueue() (models.Attendance, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	// Pop a serialized attendance object from the Redis queue
	serializedAttendance, err := rdb.RPop(ctx, "attendanceQueue").Result()
	if err != nil {
		return models.Attendance{}, err
	}

	// Unmarshal the serialized attendance object into a Attendence struct
	var attendance models.Attendance
	err = json.Unmarshal([]byte(serializedAttendance), &attendance)
	if err != nil {
		return models.Attendance{}, err
	}

	return attendance, nil
}
func SetTotalClassesSubjectsLecure(teacherId int, totalClasses int, totalSubjects int, totalLectures int) error {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})
	key1 := fmt.Sprintf("total_classes:%d", teacherId)
	key2 := fmt.Sprintf("total_subjects:%d", teacherId)
	key3 := fmt.Sprintf("total_lectures:%d", teacherId)
	err := rdb.Set(ctx, key1, totalClasses, 0).Err()
	if err != nil {
		return err
	}
	err = rdb.Set(ctx, key2, totalSubjects, 0).Err()
	if err != nil {
		return err
	}
	err = rdb.Set(ctx, key3, totalLectures, 0).Err()
	if err != nil {
		return err
	}
	return nil
}
func SetTotalSubjects(teacherId int, totalSubjects int) error {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})
	key := fmt.Sprintf("total_subjects:%d", teacherId)
	err := rdb.Set(ctx, key, totalSubjects, 0).Err()
	if err != nil {
		return err
	}
	return nil
}
