# FastAPI Task Management API

A task management application with a FastAPI and SQLite backend and a React frontend. Users can register, verify their email, log in with JWT authentication, and manage their own tasks.

## Features

- User registration and email verification
- Resending verification codes
- JWT-based login and protected task operations
- Password hashing with bcrypt
- Create, read, update, and delete tasks
- Per-user task access
- Request logging and global exception handling
- Swagger API documentation

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, SQLite, Pydantic
- Authentication: Passlib, Python-JOSE, JWT
- Email: Gmail SMTP
- Frontend: React, Vite, Axios, React Router

## Project Structure

```text
Fast api/
├── backend/
│   ├── core/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   ├── static/
│   ├── templates/
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── tasks.db
├── README.md
└── .gitignore
```

The SQLite database is kept at the repository root as `tasks.db`. The real `backend/.env` file is ignored by Git and must be created locally.

## Backend Setup

From the repository root, create and activate the virtual environment:

### Windows PowerShell

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` with your own values:

```env
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GMAIL_ADDRESS=your-gmail-address
GMAIL_APP_PASSWORD=your-gmail-app-password
```

`GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` are required when signup sends a verification email. Use a Gmail app password, not your normal Gmail password.

Start the backend from the `backend` directory:

```powershell
cd backend
python -m uvicorn main:app --reload
```

The backend is available at:

- API: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs
- Root HTML page: http://127.0.0.1:8000/

Stop the server with `Ctrl+C` in the same terminal where Uvicorn is running. Do not start a second server on port `8000` while one is already running.

## Frontend Setup

Open a second terminal from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

The frontend normally runs at http://localhost:5173 and calls the backend at `http://127.0.0.1:8000`.

Available frontend commands:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Create an unverified user and send a verification code |
| `POST` | `/verify` | Verify an email address with its code |
| `POST` | `/resend-code` | Send a new verification code |
| `POST` | `/login` | Log in and receive a JWT access token |
| `DELETE` | `/users/{email}` | Delete a user |

Login expects URL-encoded form data:

```text
username=user@example.com
password=password123
```

Users must verify their email before logging in.

### Tasks

The task router uses the `/tasks` prefix.

| Method | Endpoint | Authentication |
|---|---|---|
| `GET` | `/tasks/about` | None |
| `GET` | `/tasks/employee` | None |
| `GET` | `/tasks/skills` | None |
| `GET` | `/tasks/student/{student_id}` | None |
| `GET` | `/tasks/tasks` | Bearer token |
| `GET` | `/tasks/{task_id}` | None |
| `POST` | `/tasks/` | Bearer token |
| `PUT` | `/tasks/{task_id}` | Bearer token |
| `DELETE` | `/tasks/{task_id}` | Bearer token |

The authenticated list endpoint supports optional pagination and filtering:

```text
/tasks/tasks?completed=false&skip=0&limit=10
```

## Request Examples

### Signup

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Verify

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### Create or Update a Task

```json
{
  "title": "Learn FastAPI",
  "description": "Complete the task management API",
  "completed": false
}
```

Task titles must contain between 3 and 100 characters.

## Error Responses

Validation and endpoint errors normally use this format:

```json
{
  "detail": "Task not found"
}
```

Unhandled server errors use:

```json
{
  "details": "Internal Server Error"
}
```
