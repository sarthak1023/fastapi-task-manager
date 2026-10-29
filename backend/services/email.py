import os
import secrets
import smtplib
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv

from core.logging_config import logger
from services.email_templates import verification_email, password_reset_email

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
# Gmail shows app passwords as "abcd efgh ijkl mnop"; the spaces are not part of the password
SMTP_PASSWORD = (os.getenv("SMTP_PASSWORD") or "").replace(" ", "")
SMTP_FROM = os.getenv("SMTP_FROM") or SMTP_USER


def generate_code():
    # 6-digit code like "042917", generated with a cryptographically secure random source
    return f"{secrets.randbelow(1_000_000):06d}"


def send_email(to: str, subject: str, body: str, html: str | None = None) -> bool:
    # Without SMTP settings (e.g. local dev), log the email instead of failing
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured, email not sent.\nTo: %s\nSubject: %s\n%s", to, subject, body)
        return True

    message = EmailMessage()
    message["From"] = f"TaskMaster <{SMTP_FROM}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)                    # plain-text version for apps that don't show HTML
    if html:
        message.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


def send_verification_email(to: str, name: str, code: str):
    text, html = verification_email(name, code)
    send_email(to, f"{code} is your TaskMaster verification code", text, html=html)


def send_password_reset_email(to: str, name: str, code: str):
    text, html = password_reset_email(name, code)
    send_email(to, "Reset your TaskMaster password", text, html=html)
