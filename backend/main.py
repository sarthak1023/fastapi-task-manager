import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.exception_handler import global_exception_handler
from core.logging_config import logger
from core.migrations import run_migrations
from database import engine, Base, SessionLocal
from models.task import Task  # noqa: F401  (imported so create_all() knows about the table)
from models.user import User
from routers.admin import router as admin_router
from routers.dashboard import router as dashboard_router
from routers.tasks import router as task_router
from routers.user import router as user_router
from services.auth import hash_password
from services.reminders import reminder_loop

# Create missing tables, then add any columns introduced after the first release
Base.metadata.create_all(bind=engine)
run_migrations(engine)


def seed_admin():
    # Create (or promote) the administrator account from ADMIN_EMAIL / ADMIN_PASSWORD
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if not admin_email or not admin_password:
        return

    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            db.add(User(
                name="Administrator",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                is_verified=True,
                is_admin=True
            ))
            db.commit()
        elif not admin_user.is_admin:
            admin_user.is_admin = True
            db.commit()
    finally:
        db.close()


seed_admin()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the reminder-email checker when the server starts, stop it on shutdown
    reminder_task = asyncio.create_task(reminder_loop())
    yield
    reminder_task.cancel()


app = FastAPI(
    title="TaskMaster API",
    description="Task management API with JWT auth, email verification, password reset and due-date reminders.",
    lifespan=lifespan
)

app.add_exception_handler(Exception, global_exception_handler)

# Comma-separated list in .env, e.g. CORS_ORIGINS=http://localhost:5173,https://my-app.vercel.app
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,https://fastapi-task-manager-khaki.vercel.app"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response


app.include_router(task_router)
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(dashboard_router)


@app.get("/", tags=["Health"], summary="Health check")
def home():
    return {"status": "ok", "docs": "/docs"}
