import asyncio
import os
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from core.logging_config import logger
from database import SessionLocal
from models.task import Task
from models.user import User
from services.email import send_email
from services.email_templates import reminder_email

CHECK_INTERVAL_SECONDS = 60

# Times in reminder emails are shown in this timezone (due dates are stored in UTC)
DISPLAY_TIMEZONE = ZoneInfo(os.getenv("DISPLAY_TIMEZONE", "Asia/Kolkata"))


def format_due_time(due_at_utc: datetime) -> str:
    # e.g. "26 Oct 2026, 03:00 PM IST"
    local = due_at_utc.replace(tzinfo=UTC).astimezone(DISPLAY_TIMEZONE)
    return local.strftime("%d %b %Y, %I:%M %p ") + local.tzname()


def send_due_reminders():
    # Email each incomplete high/medium task once, when it's due within the next hour
    db = SessionLocal()
    try:
        now = datetime.now(UTC).replace(tzinfo=None)
        due_tasks = db.query(Task, User).join(User, Task.user_id == User.id).filter(
            Task.completed.is_(False),
            Task.reminder_sent.is_(False),
            Task.priority.in_(["high", "medium"]),
            Task.due_at >= now,
            Task.due_at <= now + timedelta(hours=1)
        ).all()

        for task, user in due_tasks:
            minutes_left = int((task.due_at - now).total_seconds() // 60)
            text, html = reminder_email(
                name=user.name,
                title=task.title,
                priority=task.priority,
                description=task.description,
                due_text=format_due_time(task.due_at),
                minutes_left=minutes_left
            )
            sent = send_email(user.email, f'Reminder: "{task.title}" is due soon', text, html=html)
            if sent:
                task.reminder_sent = True

        db.commit()
    finally:
        db.close()


async def reminder_loop():
    # Runs for as long as the server is up; started from main.py
    while True:
        try:
            await asyncio.to_thread(send_due_reminders)
        except Exception:
            logger.exception("Reminder check failed")
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)
