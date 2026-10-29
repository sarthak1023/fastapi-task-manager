from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class Task(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: Optional[str] = None
    completed: bool
    priority: Literal["high", "medium", "low"] = "medium"
    due_at: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: Literal["high", "medium", "low"] = "medium"
    due_at: Optional[datetime] = None


class CreateTaskresponse(BaseModel):
    message: str
    task: TaskResponse
