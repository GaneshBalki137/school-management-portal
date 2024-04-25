package handler

import (
	"encoding/json"

	"github.com/GaneshBalki/go-cron-service/models"
	"github.com/GaneshBalki/go-cron-service/redis"
	"github.com/gofiber/fiber/v2"
)

// AddAttendanceHandler handles the HTTP POST request to add a new Attendance
func AddAttendanceHandler(c *fiber.Ctx) error {
	// Parse request body to get attendanec data
	var attendance models.Attendance
	if err := c.BodyParser(&attendance); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	// Serialize attendance object
	serializedAttendance, err := json.Marshal(attendance)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to serialize attendance object",
		})
	}

	// Store serialized attendance object in Redis
	err = redis.PushAttendanceToQueue(serializedAttendance)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store attendance data in Redis",
		})
	}

	return c.SendStatus(fiber.StatusOK)
}
