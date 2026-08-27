from backend.models.task import Task as TaskModel
from fastapi import Depends , APIRouter , HTTPException, status
from backend.schemas.task import Task, CreateTaskresponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.auth import get_current_user # to protect endpoints with jwt authentication
from backend.models.user import User
from typing import Optional

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


@router.get("/about")
def about():
    return {"company": "Kaara"}

@router.get("/employee")
def employee(db: Session = Depends(get_db)):
    tasks = db.query(TaskModel).all()
    return {
        "name": "Anil",
        "age":  "23",
        "course": "python backend developer"   
    } 

@router.get("/skills")
def skills(db: Session = Depends(get_db)):
    tasks = db.query(TaskModel).all()
    return {
              
              "skills": [
              "python",
              "java"
              ]
    }
@router.get("/student/{student_id}")
def get_student(student_id: int, db: Session =Depends(get_db)):
    tasks = db.query(TaskModel).all()
    return{
        "student_id": student_id
    }

@router.get("/tasks")
def get_tasks(
    completed: Optional[bool] = None,   # from ?completed=true or ?completed=false, or nothing
    skip: int = 0,                       # from ?skip=10, defaults to 0 if not given
    limit: int = 10,                     # from ?limit=5, defaults to 10 if not given
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Start with: "all tasks belonging to this logged-in user"
    query = db.query(TaskModel).filter(
        TaskModel.user_id == current_user.id
    )

    # If the frontend specifically asked to filter by completed status, narrow it further
    if completed is not None:
        query = query.filter(TaskModel.completed == completed)

    # Apply pagination: skip some, then take only up to `limit` results
    tasks = query.offset(skip).limit(limit).all()

    return tasks

# Task 3  day 3
@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if task:
        return task

    raise HTTPException(status_code=404, detail="Task not found")


@router.post("/",response_model=CreateTaskresponse, status_code=status.HTTP_201_CREATED)
def create_task(task: Task, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    db_task = TaskModel(
    title=task.title,
    description=task.description,
    completed=task.completed,
    user_id=current_user.id 
)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return {
        "message": "Task created successfully",
        "task": db_task
    }
@router.put("/{task_id}")                  # day 5 task 1

def update_task(task_id: int, updated_task: Task, db: Session = Depends(get_db),current_user = Depends(get_current_user)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id, TaskModel.user_id == current_user.id).first()
    if task:
        task.title = updated_task.title
        task.description = updated_task.description
        task.completed = updated_task.completed
        db.commit()
        db.refresh(task)
        return {
            "message": "Task updated successfully",
            "task": task
            }
        
    raise HTTPException(
            status_code=404, 
            detail="Task not found"
        )     # day 5 task 3
    

@router.delete("/{task_id}")         # day 5 task 2
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id, TaskModel.user_id == current_user.id).first()
    if task:
        db.delete(task)
        db.commit()
        return {
            "message": "Task deleted successfully"
        }
    raise HTTPException(
        status_code=404,
        detail="Task not found"
        )    

