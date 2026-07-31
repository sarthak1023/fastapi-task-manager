from models.task import Task as TaskModel
from fastapi import Depends , APIRouter , HTTPException, status
from schemas.task import Task, CreateTaskresponse
from sqlalchemy.orm import Session
from database import get_db
from services.auth import get_current_user # to protect endpoints with jwt authentication
from models.user import User
from models.task import Task as TaskModel

print(TaskModel)                # getting error in the terminal that TaskModel is not defined, so we are printing it to check if it is imported correctly
print(TaskModel.__module__)     # to check the module where TaskModel is defined
print(hasattr(TaskModel, "user_id"))

router = APIRouter()

@router.get("/")
def home():
    return {"message": "Welome!"}

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(TaskModel)
    print(hasattr(TaskModel, "user_id"))
    tasks = db.query(TaskModel).filter(
        TaskModel.user_id == current_user.id
    ).all()

    return tasks

# Task 3  day 3
@router.get("/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if task:
        return task

    raise HTTPException(status_code=404, detail="Task not found")


@router.post("/task",response_model=CreateTaskresponse, status_code=status.HTTP_201_CREATED)
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
@router.put("/tasks/{task_id}")                  # day 5 task 1

def update_task(task_id: int, updated_task: Task, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
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
        )      #day 5 task 3
    

@router.delete("/tasks/{task_id}")         # day 5 task 2
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
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

@router.get("/test_error")
def test_error():
     x = 10 / 0
     return x
    