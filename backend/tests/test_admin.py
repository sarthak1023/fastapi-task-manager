from conftest import ADMIN_EMAIL, PASSWORD, get_user


def test_admin_endpoints_forbidden_for_normal_users(client, make_user):
    headers = make_user()

    assert client.get("/admin/stats", headers=headers).status_code == 403
    assert client.get("/users", headers=headers).status_code == 403
    assert client.get("/tasks/admin/all", headers=headers).status_code == 403
    assert client.delete("/users/someone@example.com", headers=headers).status_code == 403


def test_admin_sees_all_users_and_tasks(client, make_user, admin_headers):
    alice = make_user("alice@example.com", name="Alice")
    client.post("/tasks/", json={"title": "Alice's task", "completed": False}, headers=alice)

    emails = {u["email"] for u in client.get("/users", headers=admin_headers).json()}
    tasks = client.get("/tasks/admin/all", headers=admin_headers).json()

    assert {"alice@example.com", ADMIN_EMAIL} <= emails
    assert [(t["title"], t["user_name"]) for t in tasks] == [("Alice's task", "Alice")]


def test_admin_task_search_also_matches_owner_name(client, make_user, admin_headers):
    alice = make_user("alice@example.com", name="Alice")
    bob = make_user("bob@example.com", name="Bob")
    client.post("/tasks/", json={"title": "Plan sprint", "completed": False}, headers=alice)
    client.post("/tasks/", json={"title": "Fix bug", "completed": False}, headers=bob)

    by_owner = client.get("/tasks/admin/all", params={"search": "alice"}, headers=admin_headers).json()
    paged = client.get("/tasks/admin/all", params={"limit": 1}, headers=admin_headers).json()

    assert [t["title"] for t in by_owner] == ["Plan sprint"]
    assert [t["title"] for t in paged] == ["Fix bug"]   # newest first by default


def test_admin_deletes_user_and_their_tasks(client, make_user, admin_headers):
    alice = make_user("alice@example.com")
    client.post("/tasks/", json={"title": "Alice's task", "completed": False}, headers=alice)

    response = client.delete("/users/alice@example.com", headers=admin_headers)

    assert response.status_code == 200
    assert get_user("alice@example.com") is None
    assert client.get("/tasks/admin/all", headers=admin_headers).json() == []


def test_admin_stats(client, make_user, admin_headers):
    alice = make_user("alice@example.com", name="Alice")
    client.post("/tasks/", json={"title": "Open task", "completed": False, "due_at": "2020-01-01T00:00:00Z"}, headers=alice)
    client.post("/tasks/", json={"title": "Done task", "completed": True}, headers=alice)
    client.post("/signup", json={"name": "Unverified", "email": "new@example.com", "password": PASSWORD})

    stats = client.get("/admin/stats", headers=admin_headers).json()

    assert stats["users"] == {"total": 3, "verified": 2, "unverified": 1, "admins": 1}
    assert stats["tasks"] == {"total": 2, "completed": 1, "active": 1, "overdue": 1, "created_this_week": 2}
    counts = {u["email"]: u["task_count"] for u in stats["user_list"]}
    assert counts["alice@example.com"] == 2 and counts["new@example.com"] == 0
    assert {t["title"] for t in stats["recent_tasks"]} == {"Open task", "Done task"}


def test_admin_can_open_any_task_but_users_cannot(client, make_user, admin_headers):
    alice = make_user("alice@example.com", name="Alice")
    bob = make_user("bob@example.com")
    task_id = client.post("/tasks/", json={"title": "Alice's task", "completed": False}, headers=alice).json()["task"]["id"]

    admin_view = client.get(f"/tasks/{task_id}", headers=admin_headers)

    assert admin_view.status_code == 200
    assert admin_view.json()["user_name"] == "Alice"
    assert client.get(f"/tasks/{task_id}", headers=bob).status_code == 404


def test_admin_cannot_delete_self(client, admin_headers):
    response = client.delete(f"/users/{ADMIN_EMAIL}", headers=admin_headers)
    assert response.status_code == 400


def test_delete_unknown_user(client, admin_headers):
    assert client.delete("/users/nobody@example.com", headers=admin_headers).status_code == 404
