import os
import tempfile

# These must be set BEFORE the app is imported: database.py and services/*.py read
# them at import time, and load_dotenv() never overrides values that already exist.
TEST_DB_PATH = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "admin-password"
os.environ["SMTP_USER"] = ""      # never send real emails from tests
os.environ["SMTP_PASSWORD"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from database import SessionLocal  # noqa: E402
from main import app  # noqa: E402
from models.task import Task  # noqa: E402
from models.user import User  # noqa: E402

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
PASSWORD = "Password123!"   # meets every password rule


@pytest.fixture(autouse=True)
def clean_database():
    # Every test starts with only the seeded admin account
    yield
    db = SessionLocal()
    db.query(Task).delete()
    db.query(User).filter(User.email != ADMIN_EMAIL).delete()
    db.commit()
    db.close()


@pytest.fixture
def client():
    # Not used as a context manager, so the background reminder loop doesn't start
    return TestClient(app)


def get_user(email):
    db = SessionLocal()
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()


def login(client, email, password=PASSWORD):
    return client.post("/login", data={"username": email, "password": password})


def auth_headers(client, email, password=PASSWORD):
    token = login(client, email, password).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def make_user(client):
    # Sign up + verify a user, return their auth headers
    def _make_user(email="user@example.com", name="Test User"):
        client.post("/signup", json={"name": name, "email": email, "password": PASSWORD})
        code = get_user(email).verification_code
        client.post("/verify-email", json={"email": email, "code": code})
        return auth_headers(client, email)
    return _make_user


@pytest.fixture
def admin_headers(client):
    return auth_headers(client, ADMIN_EMAIL, ADMIN_PASSWORD)
