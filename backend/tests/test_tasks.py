from datetime import UTC, datetime, timedelta


def create_task(client, headers, title="Write tests", **fields):
    body = {"title": title, "completed": False, **fields}
    return client.post("/tasks/", json=body, headers=headers)


def test_tasks_require_login(client):
    assert client.get("/tasks/tasks").status_code == 401
    assert client.post("/tasks/", json={"title": "Nope", "completed": False}).status_code == 401


def test_create_and_list_task(client, make_user):
    headers = make_user()
    response = create_task(client, headers, description="pytest", priority="high")

    assert response.status_code == 201
    task = response.json()["task"]
    assert task["title"] == "Write tests"
    assert task["priority"] == "high"

    tasks = client.get("/tasks/tasks", headers=headers).json()
    assert [t["id"] for t in tasks] == [task["id"]]


def test_title_validation(client, make_user):
    headers = make_user()
    assert create_task(client, headers, title="ab").status_code == 422
    assert create_task(client, headers, title="x" * 101).status_code == 422


def test_priority_validation(client, make_user):
    headers = make_user()
    assert create_task(client, headers, priority="urgent").status_code == 422


def test_created_at_is_set_per_task(client, make_user):
    headers = make_user()
    create_task(client, headers, title="First")
    create_task(client, headers, title="Second")

    tasks = client.get("/tasks/tasks", headers=headers).json()
    assert all(t["created_at"] is not None for t in tasks)
    # Before the fix, every task got the server's start-up time
    created = datetime.fromisoformat(tasks[0]["created_at"])
    assert abs(datetime.now(UTC).replace(tzinfo=None) - created) < timedelta(minutes=1)


def test_filter_by_completed_and_priority(client, make_user):
    headers = make_user()
    create_task(client, headers, title="Open high", priority="high")
    create_task(client, headers, title="Done low", priority="low", completed=True)

    active = client.get("/tasks/tasks", params={"completed": False}, headers=headers).json()
    done = client.get("/tasks/tasks", params={"completed": True}, headers=headers).json()
    high = client.get("/tasks/tasks", params={"priority": "high"}, headers=headers).json()

    assert [t["title"] for t in active] == ["Open high"]
    assert [t["title"] for t in done] == ["Done low"]
    assert [t["title"] for t in high] == ["Open high"]


def test_pagination(client, make_user):
    headers = make_user()
    for i in range(7):
        create_task(client, headers, title=f"Task {i}")

    page1 = client.get("/tasks/tasks", params={"skip": 0, "limit": 5, "sort": "oldest"}, headers=headers).json()
    page2 = client.get("/tasks/tasks", params={"skip": 5, "limit": 5, "sort": "oldest"}, headers=headers).json()

    assert [t["title"] for t in page1] == [f"Task {i}" for i in range(5)]
    assert [t["title"] for t in page2] == ["Task 5", "Task 6"]


def test_update_task(client, make_user):
    headers = make_user()
    task_id = create_task(client, headers).json()["task"]["id"]

    response = client.put(f"/tasks/{task_id}", json={"title": "Updated", "completed": True, "priority": "low"}, headers=headers)

    assert response.status_code == 200
    assert response.json()["task"]["title"] == "Updated"
    assert response.json()["task"]["completed"] is True


def test_delete_task(client, make_user):
    headers = make_user()
    task_id = create_task(client, headers).json()["task"]["id"]

    assert client.delete(f"/tasks/{task_id}", headers=headers).status_code == 200
    assert client.get(f"/tasks/{task_id}", headers=headers).status_code == 404


def test_users_cannot_touch_each_others_tasks(client, make_user):
    alice = make_user("alice@example.com")
    bob = make_user("bob@example.com")
    task_id = create_task(client, alice, title="Alice's task").json()["task"]["id"]

    assert client.get("/tasks/tasks", headers=bob).json() == []
    assert client.get(f"/tasks/{task_id}", headers=bob).status_code == 404
    assert client.put(f"/tasks/{task_id}", json={"title": "Hacked", "completed": False}, headers=bob).status_code == 404
    assert client.delete(f"/tasks/{task_id}", headers=bob).status_code == 404
    assert client.get(f"/tasks/{task_id}", headers=alice).json()["title"] == "Alice's task"


def test_summary_counts_all_tasks(client, make_user):
    headers = make_user()
    in_two_hours = (datetime.now(UTC) + timedelta(hours=2)).isoformat()
    create_task(client, headers, title="High open", priority="high", due_at=in_two_hours)
    create_task(client, headers, title="Medium done", priority="medium", completed=True)
    create_task(client, headers, title="Low open", priority="low")

    summary = client.get("/tasks/summary", headers=headers).json()

    assert {k: summary[k] for k in ("high", "medium", "low", "total", "completed", "active")} == \
        {"high": 1, "medium": 1, "low": 1, "total": 3, "completed": 1, "active": 2}
    assert [t["title"] for t in summary["upcoming"]] == ["High open"]


def test_calendar_returns_only_my_tasks_in_range(client, make_user):
    alice = make_user("alice@example.com")
    bob = make_user("bob@example.com")
    create_task(client, alice, title="In range", due_at="2026-11-10T09:00:00Z")
    create_task(client, alice, title="Out of range", due_at="2026-12-05T09:00:00Z")
    create_task(client, alice, title="No due date")
    create_task(client, bob, title="Bob's task", due_at="2026-11-10T09:00:00Z")

    params = {"start": "2026-11-01T00:00:00Z", "end": "2026-12-01T00:00:00Z"}
    tasks = client.get("/tasks/calendar", params=params, headers=alice).json()

    assert [t["title"] for t in tasks] == ["In range"]


def test_calendar_rejects_backwards_range(client, make_user):
    headers = make_user()
    params = {"start": "2026-12-01T00:00:00Z", "end": "2026-11-01T00:00:00Z"}
    assert client.get("/tasks/calendar", params=params, headers=headers).status_code == 400


def test_search_matches_title_or_description(client, make_user):
    headers = make_user()
    create_task(client, headers, title="Write report")
    create_task(client, headers, title="Buy milk", description="For the REPORT meeting")
    create_task(client, headers, title="Call mom")

    tasks = client.get("/tasks/tasks", params={"search": "report"}, headers=headers).json()

    assert {t["title"] for t in tasks} == {"Write report", "Buy milk"}


def test_search_treats_wildcards_literally(client, make_user):
    headers = make_user()
    create_task(client, headers, title="Reach 100% coverage")
    create_task(client, headers, title="Review 1000 lines")

    tasks = client.get("/tasks/tasks", params={"search": "100%"}, headers=headers).json()

    assert [t["title"] for t in tasks] == ["Reach 100% coverage"]


def test_sort_options(client, make_user):
    headers = make_user()
    now = datetime.now(UTC)
    create_task(client, headers, title="First", due_at=(now + timedelta(days=3)).isoformat())
    create_task(client, headers, title="Second")
    create_task(client, headers, title="Third", due_at=(now + timedelta(days=1)).isoformat())

    def titles(sort):
        return [t["title"] for t in client.get("/tasks/tasks", params={"sort": sort}, headers=headers).json()]

    assert titles("newest") == ["Third", "Second", "First"]
    assert titles("oldest") == ["First", "Second", "Third"]
    assert titles("due_date") == ["Third", "First", "Second"]   # no due date goes last
    assert client.get("/tasks/tasks", params={"sort": "random"}, headers=headers).status_code == 422


def test_completed_at_tracks_completion(client, make_user):
    headers = make_user()
    task_id = create_task(client, headers).json()["task"]["id"]
    assert client.get(f"/tasks/{task_id}", headers=headers).json()["completed_at"] is None

    done = client.put(f"/tasks/{task_id}", json={"title": "Write tests", "completed": True}, headers=headers).json()["task"]
    assert done["completed_at"] is not None

    # Editing a completed task keeps its original completion time
    edited = client.put(f"/tasks/{task_id}", json={"title": "Write more tests", "completed": True}, headers=headers).json()["task"]
    assert edited["completed_at"] == done["completed_at"]

    reopened = client.put(f"/tasks/{task_id}", json={"title": "Write more tests", "completed": False}, headers=headers).json()["task"]
    assert reopened["completed_at"] is None

    created_done = create_task(client, headers, title="Already done", completed=True).json()["task"]
    assert client.get(f"/tasks/{created_done['id']}", headers=headers).json()["completed_at"] is not None


def test_reminders_only_include_tasks_due_within_an_hour(client, make_user):
    headers = make_user()
    now = datetime.now(UTC)
    create_task(client, headers, title="Soon", priority="high", due_at=(now + timedelta(minutes=30)).isoformat())
    create_task(client, headers, title="Later", priority="high", due_at=(now + timedelta(hours=3)).isoformat())
    create_task(client, headers, title="Low soon", priority="low", due_at=(now + timedelta(minutes=30)).isoformat())

    reminders = client.get("/tasks/reminders", headers=headers).json()

    assert [t["title"] for t in reminders] == ["Soon"]
