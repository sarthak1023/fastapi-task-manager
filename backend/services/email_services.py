import smtplib
import random
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def generate_verification_code():
    # Generates a random 6-digit code, e.g. "483920"
    return str(random.randint(100000, 999999))


def send_verification_email(to_email: str, code: str):
    msg = MIMEMultipart()
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_email
    msg["Subject"] = "Verify your email - Todo App"

    body = f"Your verification code is: {code}\n\nEnter this code in the app to verify your account."
    msg.attach(MIMEText(body, "plain"))

    print("DEBUG - Gmail address loaded:", GMAIL_ADDRESS)
    print("DEBUG - App password loaded:", repr(GMAIL_APP_PASSWORD))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.send_message(msg)