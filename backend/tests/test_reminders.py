from datetime import UTC, datetime, timedelta

from database import SessionLocal
from models.task import Task
from services import reminders


def test_reminder_email_sent_once_per_task(client, make_user, monkeypatch):
    headers = make_user("user@example.com")
    soon = (datetime.now(UTC) + timedelta(minutes=30)).isoformat()
    client.post("/tasks/", json={"title": "Due soon", "priority": "high", "completed": False, "due_at": soon}, headers=headers)
    client.post("/tasks/", json={"title": "Low priority", "priority": "low", "completed": False, "due_at": soon}, headers=headers)

    sent = []
    monkeypatch.setattr(reminders, "send_email", lambda to, subject, body, html=None: sent.append((to, subject)) or True)

    reminders.send_due_reminders()
    reminders.send_due_reminders()  # second run must not email again

    assert sent == [("user@example.com", 'Reminder: "Due soon" is due soon')]
    db = SessionLocal()
    assert db.query(Task).filter(Task.title == "Due soon").first().reminder_sent is True
    db.close()


def test_changing_due_date_allows_a_new_reminder(client, make_user, monkeypatch):
    headers = make_user("user@example.com")
    soon = (datetime.now(UTC) + timedelta(minutes=30)).isoformat()
    task_id = client.post("/tasks/", json={"title": "Movable", "priority": "high", "completed": False, "due_at": soon}, headers=headers).json()["task"]["id"]

    sent = []
    monkeypatch.setattr(reminders, "send_email", lambda to, subject, body, html=None: sent.append(subject) or True)
    reminders.send_due_reminders()

    sooner = (datetime.now(UTC) + timedelta(minutes=10)).isoformat()
    client.put(f"/tasks/{task_id}", json={"title": "Movable", "priority": "high", "completed": False, "due_at": sooner}, headers=headers)
    reminders.send_due_reminders()

    assert len(sent) == 2


def test_due_time_shown_in_indian_time():
    # 09:30 UTC is 3:00 PM in India (UTC+5:30)
    assert reminders.format_due_time(datetime(2026, 10, 26, 9, 30)) == "26 Oct 2026, 03:00 PM IST"


def test_failed_email_is_retried(client, make_user, monkeypatch):
    headers = make_user("user@example.com")
    soon = (datetime.now(UTC) + timedelta(minutes=30)).isoformat()
    client.post("/tasks/", json={"title": "Flaky", "priority": "medium", "completed": False, "due_at": soon}, headers=headers)

    monkeypatch.setattr(reminders, "send_email", lambda to, subject, body, html=None: False)
    reminders.send_due_reminders()

    db = SessionLocal()
    assert db.query(Task).filter(Task.title == "Flaky").first().reminder_sent is False
    db.close()
