from fastapi import APIRouter , HTTPException, status
from schemas.task import Task, TaskResponse

router = APIRouter()

tasks = [
    {
        "id": 1,
        "title": "Learn Fast Api",
        "completed": False
    },
    {
        "id": 2,
        "title": "Practice the python",
        "completed": True
    },
    {   
        "id": 3,
        "title": "Build Api",
        "completed": False
    }

         ]


@router.get("/")
def home():
    return {"message": "Welome!"}

@router.get("/about")
def about():
    return {"company": "Kaara"}

@router.get("/employee")
def employee():
    return {
        "name": "Anil",
        "age":  "23",
        "course": "python backend developer"   
    } 

@router.get("/skills")
def skills():
    return {
              
              "skills": [
              "python",
              "java"
              ]
    }
@router.get("/student/{student_id}")
def get_student(student_id: int):
    return{
        "student_id": student_id
    }

@router.get("/tasks")
def get_tasks():
    return tasks

# Task 3  day 3
@router.get("/tasks/{task_id}")
def get_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            return task

    raise HTTPException(status_code=404, detail="Task not found")


@router.post("/task",response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: Task):
    new_task = {     # created to append the task and save to the list day 4
        "id": len(tasks) + 1,
        "title": task.title,
        "completed": task.completed
    }

    tasks.append(new_task)
    return{
        "message":"Task created successfully",
        "task": new_task
    }

@router.put("/tasks/{task_id}")                  # day 5 task 1
def update_task(task_id: int, updated_task: Task):
    for task in tasks:
        if task["id"] == task_id:
            task["title"] = updated_task.title 
            task["completed"] = updated_task.completed
            return {
                 "message": "Task updated successfully",
                 "task": task
            }
        
        raise HTTPException(
            status_code=404, 
            detail="Task not found"
        )      #day 5 task 3
    

@router.delete("/tasks/{task_id}")         # day 5 task 2
def delete_task(task_id: int):

    for task in tasks:
        if task["id"] == task_id:
            tasks.remove(task)

            return {
                "message": "Task deleted successfully"
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found"
    )    
