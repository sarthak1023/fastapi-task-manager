from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from pathlib import Path

from core.exception_handler import global_exception_handler

from database import engine, Base
from models.task import Task
from models.user import User   # important for creating user table in database

from routers.tasks import router as task_router
from routers.user import router as user_router   # for hashing password
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent

# Create all database tables
Base.metadata.create_all(bind=engine)

from core.logging_config import logger

app = FastAPI()

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

app.add_exception_handler(
    Exception, global_exception_handler
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow all origins for development; adjust in production
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
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )