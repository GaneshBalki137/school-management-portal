import redis
import psycopg2
import json
import schedule
import time
from smtp import send_email

# Connect to Redis
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

# Connect to PostgreSQL
def connect_to_postgres():
    return psycopg2.connect(
        dbname="smp_db",
        user="postgres",
        password="hash",
        host="localhost",
        port="5432"
    )

def process_student_data():
    conn = connect_to_postgres()
    cursor = conn.cursor()

    # Process and store data for each student in the Redis queue
    while True:
        # Retrieve data from the list
        student_data = redis_client.rpop("student_queue")
        if not student_data:
            break
        
        processed_data = json.loads(student_data.decode('utf-8'))  # Parse JSON string

        # Extract data from processed_data
        first_name = processed_data.get('first_name')
        last_name = processed_data.get('last_name')
        date_of_birth = processed_data.get('date_of_birth')
        gender = processed_data.get('gender')
        address = processed_data.get('address')
        phone_number = processed_data.get('phone_number')
        email = processed_data.get('email')
        admission_date = processed_data.get('admission_date')
        class_id = processed_data.get('class_id')

        cursor.execute("INSERT INTO students (first_name, last_name, date_of_birth, gender, address, phone_number, email, addmission_date, class_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)", (first_name, last_name, date_of_birth, gender, address, phone_number, email, admission_date, class_id))
        
        sendEmail(email,first_name,date_of_birth)
        print(f"Data processed and stored in PostgreSQL for student {email}")
        

    conn.commit()
    cursor.close()
    conn.close()

def sendEmail(email,first_name,date_of_birth):
        print("Sending email")
        receiver_email = email
        body = f"Dear {first_name},\n\nYour School Management Portal username: {email}\nPassword: {date_of_birth}\n\nBest regards,\nSchool Management Portal Team"
        send_email(receiver_email, body)
        print(f"Email sent to {receiver_email}")


def process_teacher_data():
    conn = connect_to_postgres()
    cursor = conn.cursor()

    while True:
        teacher_data = redis_client.rpop("teacher_queue")
        if not teacher_data:
            break 
        
        processed_data = json.loads(teacher_data.decode('utf-8')) 

        first_name = processed_data.get('first_name')
        last_name = processed_data.get('last_name')
        date_of_birth = processed_data.get('date_of_birth')
        gender = processed_data.get('gender')
        address = processed_data.get('address')
        phone_number = processed_data.get('phone_number')
        email = processed_data.get('email')
        hire_date = processed_data.get('hire_date')
        qualification = processed_data.get('qualification')
        subject_name = processed_data.get('subject_name')

        cursor.execute("INSERT INTO teachers (first_name, last_name, date_of_birth, gender, address, phone_number, email, hire_date, qualification, subject_name) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                                             (first_name, last_name, date_of_birth, gender, address, phone_number, email, hire_date, qualification, subject_name))
        
        sendEmail(email,first_name,date_of_birth)
        print(f"Data processed and stored in PostgreSQL for teacher {email}")

    conn.commit()
    cursor.close()
    conn.close()

def update_student_count():
    conn = connect_to_postgres()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM students")
    student_count = cursor.fetchone()[0]

    redis_client.set("student_count", student_count)
    print("Student count updated in Redis.")

    conn.commit()
    cursor.close()
    conn.close()

def update_teacher_count():
    conn = connect_to_postgres()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM teachers")
    teacher_count = cursor.fetchone()[0]

    redis_client.set("teacher_count", teacher_count)
    print("Teacher count updated in Redis.")

    conn.commit()
    cursor.close()
    conn.close()

# schedule.every(6).hours.do(process_student_data)
schedule.every(2).minutes.do(process_student_data)
schedule.every(2).minutes.do(process_teacher_data)
schedule.every(2).minutes.do(update_student_count)
schedule.every(2).minutes.do(update_teacher_count)


# Run the scheduling loop
while True:
    schedule.run_pending()
    time.sleep(1)