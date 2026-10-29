from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime, UTC

from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    priority = Column(String, nullable=False, default="medium")
    due_at = Column(DateTime, nullable=True)
    reminder_sent = Column(Boolean, default=False, nullable=False)  # so each task gets only one reminder email
    completed_at = Column(DateTime, nullable=True)  # when it was marked complete; powers the dashboard activity chart
    # lambda so the time is taken when each task is created, not once when the server starts
    created_at = Column(DateTime, default=lambda: datetime.now(UTC).replace(tzinfo=None))

    user_id = Column(Integer, ForeignKey("users.id"))  # owner; users can only see and change their own tasks

