# FastAPI Task Manager

A simple Task Management REST API built using FastAPI.

## Features

- Create a task
- Get all tasks
- Get task by ID
- Update a task
- Delete a task

## Technologies Used

- Python
- FastAPI
- Uvicorn
- Pydantic

## Project Structure

```
FastAPI/
│
├── main.py
├── routers/
│   └── tasks.py
├── schemas/
│   └── task.py
├── models/
├── services/
├── requirements.txt
└── README.md
```

## How to Run

1. Activate virtual environment

```
venv\Scripts\activate
```

2. Run the project

```
uvicorn main:app --reload
```

3. Open Swagger UI

```
http://127.0.0.1:8000/docs
```

## API Endpoints

### Home

GET /

Returns a welcome message.

### About

GET /about

Returns company information.

### Employee

GET /employee

Returns employee details.

### Skills

GET /skills

Returns a list of skills.

### Student

GET /student/{student_id}

Returns the student ID.

### Get All Tasks

GET /tasks

Returns all tasks.

### Get Task by ID

GET /tasks/{task_id}

Returns a task by its ID.

### Create Task

POST /task

Creates a new task.

### Update Task

PUT /tasks/{task_id}

Updates an existing task.

### Delete Task

DELETE /tasks/{task_id}

Deletes a task.