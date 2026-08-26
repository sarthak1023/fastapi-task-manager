# FastAPI Task Management API

A Task Management REST API built using **FastAPI**, **SQLAlchemy**, **SQLite**, and **JWT Authentication**. The API allows users to register, log in, and manage their own tasks securely.

---

## Features

- User Registration
- User Login with JWT Authentication
- Password Hashing using bcrypt
- Create, Read, Update and Delete Tasks
- User-specific Task Access
- Protected Endpoints
- Global Exception Handling
- Request Logging
- Interactive Swagger Documentation

---

## Tech Stack

- Python 3
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- Pydantic
- Passlib (bcrypt)
- Python-JOSE (JWT)
- Python-dotenv

---

# Project Structure

```
Fast API/
│
├── core/
│   ├── exception_handler.py
│   └── logging_config.py
│
├── models/
│   ├── task.py
│   └── user.py
│
├── routers/
│   ├── tasks.py
│   └── user.py
│
├── schemas/
│   ├── task.py
│   └── user.py
│
├── services/
│   └── auth.py
│
├── database.py
├── main.py
├── requirements.txt
├── README.md
├── .env.example
└── .gitignore
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/fastapi-task-management.git

cd fastapi-task-management
```

---

## 2. Create a Virtual Environment

### Windows

```bash
python -m venv venv

venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv

source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Create a .env File

Create a file named `.env` in the project root.

```env
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 5. Run the Application

```bash
python -m uvicorn main:app --reload
```

The API will be available at:

```
http://127.0.0.1:8000
```

Swagger UI:

```
http://127.0.0.1:8000/docs
```

---

# Authentication

1. Register a user using `/signup`
2. Login using `/login`
3. Copy the JWT Access Token
4. Click **Authorize** in Swagger UI
5. Paste the token
6. Access protected endpoints

---

# API Endpoints

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/signup` | Register a new user |
| POST | `/login` | Login and receive JWT token |

---

## Tasks

| Method | Endpoint | Description | Authentication |
|---------|----------|-------------|----------------|
| GET | `/tasks` | Get all tasks of logged-in user | Required |
| GET | `/tasks/{task_id}` | Get task by ID | Required |
| POST | `/task` | Create a new task | Required |
| PUT | `/tasks/{task_id}` | Update a task | Required |
| DELETE | `/tasks/{task_id}` | Delete a task | Required |

---

# Request Examples

## Signup

**POST** `/signup`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## Login

**POST** `/login`

Use **form-data**

```
username=user@example.com
password=password123
```

Response:

```json
{
  "access_token": "<JWT_TOKEN>",
  "token_type": "bearer"
}
```

---

## Create Task

**POST** `/task`

```json
{
  "title": "Learn FastAPI",
  "description": "Complete Day 14",
  "completed": false
}
```

---

## Update Task

**PUT** `/tasks/{task_id}`

```json
{
  "title": "Learn FastAPI Updated",
  "description": "Completed",
  "completed": true
}
```

---

# Error Responses

Example:

```json
{
    "detail": "Task not found"
}
```

or

```json
{
    "detail": "Internal Server Error"
}
```

---

# Security

- Passwords are hashed using bcrypt.
- JWT Authentication protects all task endpoints.
- Each user can only access their own tasks.
- Secret keys are stored using environment variables.

---

# Testing

The API was tested using Swagger UI.

Tested scenarios include:

- User Registration
- User Login
- JWT Authentication
- Create Task
- Get Tasks
- Update Task
- Delete Task
- Unauthorized Requests
- Invalid Credentials
- User-specific Task Access
- Global Exception Handling

---

# Author

**Sarthak Singh**

Backend Developer | FastAPI Learner