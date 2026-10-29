from datetime import UTC, datetime, timedelta

from conftest import get_user
from database import SessionLocal
from models.task import Task
from services.dashboard import build_dashboard, build_period, get_timezone

UTC_ZONE = get_timezone("UTC", "UTC")


def add_task(email, title, created_at, completed_at=None, due_at=None, priority="medium"):
    # Insert directly so tests can control created_at / completed_at (naive UTC, like the app stores them)
    db = SessionLocal()
    try:
        db.add(Task(title=title, priority=priority, user_id=get_user(email).id, created_at=created_at,
                    completed=completed_at is not None, completed_at=completed_at, due_at=due_at))
        db.commit()
    finally:
        db.close()


def dashboard(client, headers, **params):
    response = client.get("/dashboard", params={"tz": "UTC", **params}, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_period_labels_and_buckets():
    year = build_period(2026, None, None, UTC_ZONE)
    assert (year.label, year.compare_label, len(year.buckets)) == ("Full Year 2026", "last year", 12)

    quarter = build_period(2026, 2, None, UTC_ZONE)
    assert quarter.label == "Q2 2026"
    assert [bucket[0] for bucket in quarter.buckets] == ["Apr", "May", "Jun"]
    assert quarter.buckets[0][1] == "April 2026"
    assert quarter.previous_start == datetime(2026, 1, 1, tzinfo=UTC_ZONE)

    february = build_period(2026, None, 2, UTC_ZONE)
    assert (february.label, len(february.buckets)) == ("February 2026", 28)

    january = build_period(2026, None, 1, UTC_ZONE)
    assert january.previous_start == datetime(2025, 12, 1, tzinfo=UTC_ZONE)


def test_months_that_have_not_started_have_no_data():
    period = build_period(2026, None, None, UTC_ZONE)
    data = build_dashboard([], period, UTC_ZONE, now=datetime(2026, 10, 15, tzinfo=UTC))

    october, november = data["series"][9], data["series"][10]
    assert (october["added"], october["completed"]) == (0, 0)        # current month: real zeros
    assert (november["added"], november["completed"]) == (None, None)  # future month: no data yet


def test_year_view_counts_added_and_completed(client, make_user):
    headers = make_user("user@example.com")
    add_task("user@example.com", "Feb task", datetime(2026, 2, 10), priority="high")
    add_task("user@example.com", "May task", datetime(2026, 5, 3), completed_at=datetime(2026, 5, 20), priority="low")
    add_task("user@example.com", "Last year", datetime(2025, 7, 1))

    data = dashboard(client, headers, year=2026)

    assert data["period"] == {"label": "Full Year 2026", "compare_label": "last year"}
    kpis = data["kpis"]
    assert (kpis["added"], kpis["added_change"]) == (2, 1)
    assert (kpis["completed"], kpis["completed_change"]) == (1, 1)
    assert (kpis["total"], kpis["done"], kpis["completion_rate"]) == (3, 1, 33)

    series = {point["label"]: point for point in data["series"]}
    assert series["Feb"] == {"label": "Feb", "full_label": "February 2026", "added": 1, "completed": 0}
    assert series["May"] == {"label": "May", "full_label": "May 2026", "added": 1, "completed": 1}
    assert {row["priority"]: row["count"] for row in data["by_priority"]} == {"high": 1, "medium": 0, "low": 1}


def test_quarter_and_month_views(client, make_user):
    headers = make_user()
    add_task("user@example.com", "April", datetime(2026, 4, 15))
    add_task("user@example.com", "March", datetime(2026, 3, 31, 12, 0))

    q2 = dashboard(client, headers, year=2026, quarter=2)
    assert (q2["kpis"]["added"], q2["kpis"]["added_change"]) == (1, 0)   # Q1 also had one
    assert [point["label"] for point in q2["series"]] == ["Apr", "May", "Jun"]

    april = dashboard(client, headers, year=2026, month=4)
    assert len(april["series"]) == 30
    assert april["series"][14] == {"label": "15", "full_label": "15 Apr 2026", "added": 1, "completed": 0}


def test_periods_follow_the_viewers_timezone(client, make_user):
    headers = make_user()
    # 20:00 UTC on 31 March is already 01:30 on 1 April in India
    add_task("user@example.com", "Late night", datetime(2026, 3, 31, 20, 0))

    assert dashboard(client, headers, year=2026, quarter=2)["kpis"]["added"] == 0
    assert dashboard(client, headers, year=2026, quarter=2, tz="Asia/Kolkata")["kpis"]["added"] == 1


def test_live_status_upcoming_and_activity(client, make_user):
    headers = make_user()
    now = datetime.now(UTC).replace(tzinfo=None)
    add_task("user@example.com", "Overdue", now - timedelta(days=3), due_at=now - timedelta(days=1))
    add_task("user@example.com", "Soon", now - timedelta(days=1), due_at=now + timedelta(days=2), priority="high")
    add_task("user@example.com", "Someday", now - timedelta(days=1))
    add_task("user@example.com", "Done", now - timedelta(days=2), completed_at=now - timedelta(hours=1),
             due_at=now + timedelta(days=1))

    data = dashboard(client, headers)

    kpis = data["kpis"]
    assert (kpis["open"], kpis["overdue"], kpis["due_next_7_days"]) == (3, 1, 1)
    assert (data["health"]["overdue"], data["health"]["no_due_date"]) == (1, 1)
    assert [task["title"] for task in data["upcoming"]] == ["Soon"]
    assert (data["activity"][0]["type"], data["activity"][0]["title"]) == ("completed", "Done")


def test_users_see_only_their_tasks_and_admins_see_everyone(client, make_user, admin_headers):
    alice = make_user("alice@example.com", name="Alice")
    make_user("bob@example.com", name="Bob")
    now = datetime.now(UTC).replace(tzinfo=None)
    add_task("alice@example.com", "Alice task", now - timedelta(minutes=1))
    add_task("bob@example.com", "Bob task", now - timedelta(minutes=5))

    assert dashboard(client, alice)["kpis"]["total"] == 1

    admin_view = dashboard(client, admin_headers)
    assert admin_view["kpis"]["total"] == 2
    assert {(event["title"], event["user_name"]) for event in admin_view["activity"]} == \
        {("Alice task", "Alice"), ("Bob task", "Bob")}


def test_bad_parameters(client, make_user):
    headers = make_user()
    assert client.get("/dashboard").status_code == 401
    assert client.get("/dashboard", params={"quarter": 5}, headers=headers).status_code == 422
    # An unknown timezone falls back to the default instead of failing
    assert client.get("/dashboard", params={"tz": "Not/AZone"}, headers=headers).status_code == 200
