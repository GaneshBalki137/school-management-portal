from flask import Flask, request
import redis
import json

# redis connection
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

app = Flask(__name__)

@app.route('/store-student-data', methods=['POST'])
def store_student_data():
    # extract student data from the request
    student_data = request.json

    print("Received data:", student_data)

    email = student_data.get('email')

    # Serialize student_data dictionary to JSON string
    json_student_data = json.dumps(student_data)

    redis_client.lpush("student_queue", json_student_data)
    print(f"Stored data for student {email} in Redis.")

    return "Student data stored successfully in Redis"


@app.route('/store-teacher-data', methods=['POST'])
def store_teacher_data():
    teacher_data = request.json

    print("Received data:", teacher_data)

    email = teacher_data.get('email')

    json_teacher_data = json.dumps(teacher_data)

    redis_client.lpush("teacher_queue", json_teacher_data)
    print(f"Stored data for teacher {email} in Redis.")

    return "Teacher data stored successfully in Redis"

if __name__ == '__main__':
    app.run(debug=True)

