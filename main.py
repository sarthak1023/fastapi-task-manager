from fastapi import FastAPI, Request

from core.exception_handler import global_exception_handler

from database import engine, Base
from models.task import Task
from models.user import User   # important for creating user table in database

from routers.tasks import router as task_router
from routers.user import router as user_router   # for hashing password

# Create all database tables
Base.metadata.create_all(bind=engine)

from core.logging_config import logger
app = FastAPI()

app.add_exception_handler(
    Exception, global_exception_handler
)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request) # vey important to call the next middleware or endpoint handler in the chain, otherwise the request will not be processed further and will result in a timeout or error.
    logger.info(f"Response status: {response.status_code}")
    return response

app.include_router(task_router) # to connect task router to main.py
app.include_router(user_router)  # to connect user router to main.py