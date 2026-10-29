from conftest import PASSWORD, get_user, login


def signup(client, email="new@example.com"):
    return client.post("/signup", json={"name": "New", "email": email, "password": PASSWORD})


def test_signup_creates_unverified_user_with_code(client):
    response = signup(client)

    assert response.status_code == 201
    assert response.json()["email"] == "new@example.com"
    assert "password" not in response.json() and "hashed_password" not in response.json()
    user = get_user("new@example.com")
    assert user.is_verified is False
    assert len(user.verification_code) == 6


def test_signup_rejects_duplicate_email(client):
    signup(client)
    response = signup(client)

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already exists"


def test_signup_rejects_weak_passwords(client):
    cases = {
        "Ab1!": "at least 8 characters",
        "password123!": "an uppercase letter",
        "PASSWORD123!": "a lowercase letter",
        "Password!!!": "a number",
        "Password123": "a special character",
    }
    for password, missing_rule in cases.items():
        response = client.post("/signup", json={"name": "Weak", "email": "weak@example.com", "password": password})
        assert response.status_code == 400, password
        assert missing_rule in response.json()["detail"], password
    assert get_user("weak@example.com") is None


def test_weak_password_error_lists_every_missing_rule(client):
    response = client.post("/signup", json={"name": "Weak", "email": "weak@example.com", "password": "abc"})
    assert response.json()["detail"] == (
        "Password must contain at least 8 characters, an uppercase letter, a number, a special character"
    )


def test_reset_and_change_password_enforce_rules(client, make_user):
    headers = make_user("user@example.com")

    change = client.post("/me/change-password", json={"current_password": PASSWORD, "new_password": "weakpass"}, headers=headers)
    assert change.status_code == 400

    client.post("/forgot-password", json={"email": "user@example.com"})
    code = get_user("user@example.com").reset_code
    reset = client.post("/reset-password", json={"email": "user@example.com", "code": code, "new_password": "weakpass"})
    assert reset.status_code == 400
    assert login(client, "user@example.com").status_code == 200  # password unchanged


def test_signup_rejects_invalid_email(client):
    response = client.post("/signup", json={"name": "X", "email": "not-an-email", "password": PASSWORD})
    assert response.status_code == 422


def test_login_blocked_until_email_verified(client):
    signup(client)

    assert login(client, "new@example.com").status_code == 403

    code = get_user("new@example.com").verification_code
    verify = client.post("/verify-email", json={"email": "new@example.com", "code": code})
    assert verify.status_code == 200

    response = login(client, "new@example.com")
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


def test_verify_rejects_wrong_code(client):
    signup(client)
    response = client.post("/verify-email", json={"email": "new@example.com", "code": "000000"})

    assert response.status_code == 400
    assert get_user("new@example.com").is_verified is False


def test_resend_verification_issues_working_code(client):
    signup(client)

    response = client.post("/resend-verification", json={"email": "new@example.com"})
    assert response.status_code == 200

    new_code = get_user("new@example.com").verification_code
    verify = client.post("/verify-email", json={"email": "new@example.com", "code": new_code})
    assert verify.status_code == 200
    assert login(client, "new@example.com").status_code == 200


def test_login_wrong_password(client, make_user):
    make_user("user@example.com")
    assert login(client, "user@example.com", "wrong-password").status_code == 401


def test_login_unknown_email(client):
    assert login(client, "nobody@example.com").status_code == 401


def test_me_requires_token(client):
    assert client.get("/me").status_code == 401


def test_me_returns_profile(client, make_user):
    headers = make_user("user@example.com", name="Sam")
    response = client.get("/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == get_user("user@example.com").id
    assert {k: body[k] for k in ("name", "email", "is_admin")} == {"name": "Sam", "email": "user@example.com", "is_admin": False}


def test_update_profile_name(client, make_user):
    headers = make_user("user@example.com", name="Old Name")

    response = client.put("/me", json={"name": "  New Name  "}, headers=headers)

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"
    assert client.get("/me", headers=headers).json()["name"] == "New Name"


def test_update_profile_rejects_blank_name(client, make_user):
    headers = make_user()
    assert client.put("/me", json={"name": ""}, headers=headers).status_code == 422
    assert client.put("/me", json={"name": "   "}, headers=headers).status_code == 400


def test_change_password(client, make_user):
    headers = make_user("user@example.com")

    response = client.post("/me/change-password", json={"current_password": PASSWORD, "new_password": "New-Secret-1"}, headers=headers)

    assert response.status_code == 200
    assert login(client, "user@example.com", PASSWORD).status_code == 401
    assert login(client, "user@example.com", "New-Secret-1").status_code == 200


def test_change_password_rejects_wrong_current_password(client, make_user):
    headers = make_user("user@example.com")

    response = client.post("/me/change-password", json={"current_password": "wrong", "new_password": "New-Secret-1"}, headers=headers)

    assert response.status_code == 400
    assert login(client, "user@example.com", PASSWORD).status_code == 200


def test_change_password_rejects_same_password(client, make_user):
    headers = make_user()
    response = client.post("/me/change-password", json={"current_password": PASSWORD, "new_password": PASSWORD}, headers=headers)
    assert response.status_code == 400


def test_forgot_password_does_not_reveal_unknown_emails(client):
    known = client.post("/forgot-password", json={"email": "admin@example.com"}).json()
    unknown = client.post("/forgot-password", json={"email": "nobody@example.com"}).json()
    assert known == unknown


def test_reset_password_flow(client, make_user):
    make_user("user@example.com")
    client.post("/forgot-password", json={"email": "user@example.com"})
    code = get_user("user@example.com").reset_code

    response = client.post("/reset-password", json={"email": "user@example.com", "code": code, "new_password": "Brand-New-1"})

    assert response.status_code == 200
    assert login(client, "user@example.com", PASSWORD).status_code == 401
    assert login(client, "user@example.com", "Brand-New-1").status_code == 200
    assert get_user("user@example.com").reset_code is None  # code can't be reused


def test_reset_password_rejects_wrong_code(client, make_user):
    make_user("user@example.com")
    client.post("/forgot-password", json={"email": "user@example.com"})

    response = client.post("/reset-password", json={"email": "user@example.com", "code": "000000", "new_password": "x"})

    assert response.status_code == 400
    assert login(client, "user@example.com").status_code == 200  # old password still works


def test_delete_account_requires_correct_password(client, make_user):
    headers = make_user("user@example.com")

    wrong = client.request("DELETE", "/account", json={"password": "wrong"}, headers=headers)
    assert wrong.status_code == 401
    assert get_user("user@example.com") is not None

    right = client.request("DELETE", "/account", json={"password": PASSWORD}, headers=headers)
    assert right.status_code == 200
    assert get_user("user@example.com") is None
