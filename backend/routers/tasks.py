from datetime import UTC, datetime, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models.task import Task as TaskModel
from models.user import User
from schemas.task import Task, CreateTaskresponse
from services.auth import get_current_user, require_admin

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)

SortOption = Literal["newest", "oldest", "due_date"]


def utc_now():
    # The database stores naive UTC datetimes
    return datetime.now(UTC).replace(tzinfo=None)


def to_naive_utc(value: Optional[datetime]):
    # The frontend sends ISO strings with a timezone ("...Z"); store them as naive UTC
    if value is None or value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def get_own_task(task_id: int, db: Session, current_user: User):
    task = db.query(TaskModel).filter(TaskModel.id == task_id, TaskModel.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def apply_list_options(query, completed, priority, search, sort, extra_search_columns=()):
    # Shared filtering, searching and sorting for the task lists (own tasks and the admin view)
    if completed is not None:
        query = query.filter(TaskModel.completed == completed)
    if priority is not None:
        query = query.filter(TaskModel.priority == priority)
    if search and search.strip():
        # Escape LIKE wildcards so a search for "50%" matches that text literally
        term = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        columns = (TaskModel.title, TaskModel.description, *extra_search_columns)
        query = query.filter(or_(*(column.ilike(f"%{term}%", escape="\\") for column in columns)))

    if sort == "oldest":
        return query.order_by(TaskModel.id.asc())
    if sort == "due_date":
        # Soonest due first; tasks without a due date go last
        return query.order_by(TaskModel.due_at.is_(None), TaskModel.due_at.asc(), TaskModel.id.desc())
    return query.order_by(TaskModel.id.desc())


@router.get("/tasks", summary="List my tasks (filter, search, sort, paginate)")
def get_tasks(
    completed: Optional[bool] = None,   # ?completed=true / ?completed=false, or omitted for all
    priority: Optional[str] = None,     # ?priority=high / medium / low
    search: Optional[str] = None,       # matches the title or description
    sort: SortOption = "newest",
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TaskModel).filter(TaskModel.user_id == current_user.id)
    query = apply_list_options(query, completed, priority, search, sort)
    return query.offset(skip).limit(limit).all()


@router.get("/admin/all", summary="List every user's tasks (admin)")
def get_all_tasks(
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,       # also matches the owner's name
    sort: SortOption = "newest",
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(TaskModel, User.name).join(User, TaskModel.user_id == User.id)
    query = apply_list_options(query, completed, priority, search, sort, extra_search_columns=(User.name,))
    query = query.offset(skip)
    if limit:
        query = query.limit(limit)

    return [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "due_at": task.due_at,
            "created_at": task.created_at,
            "completed_at": task.completed_at,
            "user_id": task.user_id,
            "user_name": user_name or "Unnamed user"
        }
        for task, user_name in query.all()
    ]


@router.get("/reminders", summary="My high/medium tasks due within the next hour")
def get_task_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = utc_now()
    return db.query(TaskModel).filter(
        TaskModel.user_id == current_user.id,
        TaskModel.completed.is_(False),
        TaskModel.priority.in_(["high", "medium"]),
        TaskModel.due_at >= now,
        TaskModel.due_at <= now + timedelta(hours=1)
    ).order_by(TaskModel.due_at.asc()).all()


@router.get("/summary", summary="Task counts by priority/status plus the next due tasks")
def get_task_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Admins see counts across every user's tasks; normal users only their own
    query = db.query(TaskModel)
    if not current_user.is_admin:
        query = query.filter(TaskModel.user_id == current_user.id)

    tasks = query.all()
    summary = {"high": 0, "medium": 0, "low": 0, "total": len(tasks), "completed": 0}
    for task in tasks:
        priority = task.priority if task.priority in ("high", "medium", "low") else "medium"
        summary[priority] += 1
        if task.completed:
            summary["completed"] += 1
    summary["active"] = summary["total"] - summary["completed"]

    # Next 5 incomplete tasks with a due date in the future
    summary["upcoming"] = query.filter(
        TaskModel.completed.is_(False),
        TaskModel.due_at >= utc_now()
    ).order_by(TaskModel.due_at.asc()).limit(5).all()

    return summary


@router.get("/calendar", summary="My tasks due between two dates")
def get_calendar_tasks(
    start: datetime,
    end: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start, end = to_naive_utc(start), to_naive_utc(end)
    if end <= start:
        raise HTTPException(status_code=400, detail="end must be after start")

    return db.query(TaskModel).filter(
        TaskModel.user_id == current_user.id,
        TaskModel.due_at >= start,
        TaskModel.due_at < end
    ).order_by(TaskModel.due_at.asc()).all()


@router.delete("/admin/{task_id}", summary="Delete any task (admin)")
def delete_any_task(task_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


@router.get("/{task_id}", summary="Get one task (own task, or any task for admins)")
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        return get_own_task(task_id, db, current_user)

    # Admins can already see every task in /tasks/admin/all, so they may open any of them
    row = db.query(TaskModel, User.name).join(User, TaskModel.user_id == User.id).filter(TaskModel.id == task_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    task, user_name = row
    return {**{column.name: getattr(task, column.name) for column in TaskModel.__table__.columns},
            "user_name": user_name or "Unnamed user"}


@router.post("/", response_model=CreateTaskresponse, status_code=status.HTTP_201_CREATED, summary="Create a task")
def create_task(task: Task, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = TaskModel(
        title=task.title,
        description=task.description,
        completed=task.completed,
        completed_at=utc_now() if task.completed else None,
        priority=task.priority,
        due_at=to_naive_utc(task.due_at),
        user_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return {"message": "Task created successfully", "task": db_task}


@router.put("/{task_id}", summary="Update one of my tasks")
def update_task(task_id: int, updated_task: Task, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = get_own_task(task_id, db, current_user)

    new_due_at = to_naive_utc(updated_task.due_at)
    if task.due_at != new_due_at:
        task.reminder_sent = False  # new due date means the task deserves a fresh reminder email

    # Record when the task was completed; clear it if the task is reopened
    if updated_task.completed and not task.completed:
        task.completed_at = utc_now()
    elif not updated_task.completed:
        task.completed_at = None

    task.title = updated_task.title
    task.description = updated_task.description
    task.completed = updated_task.completed
    task.priority = updated_task.priority
    task.due_at = new_due_at
    db.commit()
    db.refresh(task)
    return {"message": "Task updated successfully", "task": task}


@router.delete("/{task_id}", summary="Delete one of my tasks")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = get_own_task(task_id, db, current_user)
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
