import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.task import Task
from models.user import User
from services.auth import get_current_user
from services.dashboard import build_dashboard, build_period, get_timezone

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

DEFAULT_TIMEZONE = os.getenv("DISPLAY_TIMEZONE", "Asia/Kolkata")


@router.get("", summary="Dashboard: KPIs, activity chart, priorities, deadlines and recent activity")
def get_dashboard(
    year: Optional[int] = Query(None, ge=2000, le=2100),
    quarter: Optional[int] = Query(None, ge=1, le=4),
    month: Optional[int] = Query(None, ge=1, le=12),
    tz: Optional[str] = Query(None, max_length=64, description="The viewer's IANA timezone, e.g. Asia/Kolkata"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    timezone = get_timezone(tz, DEFAULT_TIMEZONE)
    period = build_period(year or datetime.now(timezone).year, quarter, month, timezone)

    # Admins see every user's tasks; everyone else only their own
    query = db.query(Task, User.name).join(User, Task.user_id == User.id)
    if not current_user.is_admin:
        query = query.filter(Task.user_id == current_user.id)

    return build_dashboard(query.all(), period, timezone)
