from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.task import Task
from models.user import User
from services.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", summary="Users and tasks overview (admin)")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    now = datetime.now(UTC).replace(tzinfo=None)
    week_ago = now - timedelta(days=7)

    users = db.query(User).order_by(User.id).all()
    task_counts = dict(db.query(Task.user_id, func.count(Task.id)).group_by(Task.user_id).all())

    def count_tasks(*conditions):
        return db.query(func.count(Task.id)).filter(*conditions).scalar()

    total_tasks = count_tasks()
    completed_tasks = count_tasks(Task.completed.is_(True))

    recent = (
        db.query(Task, User.name)
        .join(User, Task.user_id == User.id)
        .order_by(Task.created_at.desc(), Task.id.desc())
        .limit(8)
        .all()
    )

    return {
        "users": {
            "total": len(users),
            "verified": sum(1 for u in users if u.is_verified),
            "unverified": sum(1 for u in users if not u.is_verified),
            "admins": sum(1 for u in users if u.is_admin),
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "active": total_tasks - completed_tasks,
            "overdue": count_tasks(Task.completed.is_(False), Task.due_at < now),
            "created_this_week": count_tasks(Task.created_at >= week_ago),
        },
        "user_list": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "is_verified": u.is_verified,
                "is_admin": u.is_admin,
                "task_count": task_counts.get(u.id, 0),
            }
            for u in users
        ],
        "recent_tasks": [
            {
                "id": task.id,
                "title": task.title,
                "priority": task.priority,
                "completed": task.completed,
                "created_at": task.created_at,
                "user_name": user_name or "Unnamed user",
            }
            for task, user_name in recent
        ],
    }
