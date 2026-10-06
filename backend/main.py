from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from pathlib import Path
import os
from sqlalchemy import inspect, text

from core.exception_handler import global_exception_handler

from database import engine, Base, SessionLocal
from models.task import Task
from models.user import User   # important for creating user table in database
from services.auth import hash_password

from routers.tasks import router as task_router
from routers.user import router as user_router   # for hashing password
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent

# Create all database tables
Base.metadata.create_all(bind=engine)

user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
if "name" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR NOT NULL DEFAULT ''"))
if "is_admin" not in user_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0"))

task_columns = {column["name"] for column in inspect(engine).get_columns("tasks")}
if "priority" not in task_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE tasks ADD COLUMN priority VARCHAR NOT NULL DEFAULT 'medium'"))
if "due_at" not in task_columns:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE tasks ADD COLUMN due_at DATETIME"))

admin_email = os.getenv("ADMIN_EMAIL")
admin_password = os.getenv("ADMIN_PASSWORD")
if admin_email and admin_password:
    admin_db = SessionLocal()
    try:
        admin_user = admin_db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_db.add(User(
                name="Administrator",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                is_verified=True,
                is_admin=True
            ))
            admin_db.commit()
        elif not admin_user.is_admin:
            admin_user.is_admin = True
            admin_db.commit()
    finally:
        admin_db.close()

from core.logging_config import logger

app = FastAPI()

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

app.add_exception_handler(
    Exception, global_exception_handler
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://fastapi-task-manager-three.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)  # very important to call the next middleware or endpoint handler in the chain, otherwise the request will not be processed further and will result in a timeout or error.
    logger.info(f"Response status: {response.status_code}")
    return response

app.include_router(task_router)  # to connect task router to main.py
app.include_router(user_router)  # to connect user router to main.py


@app.get("/")
def home():
    return FileResponse(BASE_DIR / "templates" / "index.html")