import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_email(receiver_email, body):
    # Email configuration
    sender_email = "smpofficialacc@gmail.com"
    password = "htqp owoc dmxd jmae"

    # Create a multipart message
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = "School Management Portal Credentials"

    # Add body to email
    message.attach(MIMEText(body, "plain"))

    # Connect to SMTP server and send email
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()  # Secure the connection
            server.login(sender_email, password)
            text = message.as_string()
            server.sendmail(sender_email, receiver_email, text)
            print("Email sent successfully.")
    except Exception as e:
        print(f"Error sending email: {e}")



