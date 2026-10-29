# TaskMaster

A full-stack task manager built with **FastAPI** and **React**. Users sign up, verify their email, and manage prioritised tasks with due dates; reminder emails go out before tasks are due. Administrators can see every user's tasks and manage accounts.

**Live demo:** https://fastapi-task-manager-khaki.vercel.app

## Features

- **Accounts:** signup with email verification (6-digit code), JWT login, forgot / reset password, delete account with password confirmation
- **Tasks:** create, edit, complete and delete tasks with priority (high / medium / low) and an optional due date
- **App layout:** collapsible sidebar navigation and a top bar with task search, a reminders bell and an account menu
- **Dashboard:** KPI cards, a "tasks added vs completed" line chart and a tasks-by-priority chart (each with a table view), filterable by full year, quarter or month, plus upcoming deadlines, recent activity and task health
- **Tasks table:** search, status and priority filters, sorting (newest, oldest, due date) and pagination; create and edit tasks in a dialog
- **Calendar:** month view of tasks by due date, with quick-add for any day
- **Task details page:** a shareable page per task (`/tasks/:id`) with edit, complete and delete
- **Reminders:** in-app banner and an email for high/medium tasks due within the next hour (one email per task)
- **Admin dashboard:** platform statistics, a searchable users table with task counts, recent activity, and user deletion (admin account seeded from environment variables)
- **Per-user data isolation:** users can only read or change their own tasks
- Request logging, a global error handler and interactive API docs (Swagger)

## Tech Stack

| Layer | Tools |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite (local), PostgreSQL (production) |
| Auth | JWT (python-jose), password hashing (passlib, PBKDF2-SHA256) |
| Email | Gmail SMTP (Python `smtplib`) |
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS, lucide-react |
| Tests | pytest, FastAPI TestClient |

## Project Structure

```text
.
├── backend/
│   ├── core/            # logging, global exception handler, DB column migrations
│   ├── models/          # SQLAlchemy tables: User, Task
│   ├── routers/         # API endpoints: user.py (auth/accounts), tasks.py
│   ├── schemas/         # Pydantic request/response models
│   ├── services/        # auth (JWT, hashing), email, reminder loop
│   ├── tests/           # pytest suite
│   ├── database.py      # engine + session
│   ├── main.py          # app setup, CORS, admin seeding, startup
│   └── .env.example
└── frontend/
    └── src/
        ├── api/         # Axios instance (adds the token, handles expired sessions)
        ├── components/  # Login, Signup, Layout, TaskTable, TaskFormModal, ...
        │   ├── layout/  # Sidebar, Topbar
        │   ├── ui/      # Card, PageHeader, StatCard, Modal, ConfirmDialog, shared styles
        │   └── charts/  # LineChart, BarChart, legend and table view (plain SVG/HTML, no chart library)
        ├── context/     # AuthProvider + useAuth hook (token and current user)
        ├── pages/       # Overview, Tasks, TaskDetails, Calendar, Profile, AdminDashboard, auth pages, NotFound
        └── utils/       # date helpers (API times are UTC)
```

## Getting Started

### 1. Backend

From the repository root (Windows PowerShell shown; use `source venv/bin/activate` on macOS/Linux):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements-dev.txt
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env`:

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Signs JWTs. Use a long random string (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `ALGORITHM` | JWT algorithm, `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | How long a login lasts |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created on startup |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Gmail SMTP settings (see below) |
| `DATABASE_URL` | Optional. Defaults to SQLite `tasks.db`; set a PostgreSQL URL in production |
| `CORS_ORIGINS` | Optional. Comma-separated frontend URLs allowed to call the API |

**Gmail setup:** enable 2-Step Verification on your Google account, create an App Password at https://myaccount.google.com/apppasswords, and use it as `SMTP_PASSWORD`. If SMTP is not configured, emails (including verification codes) are printed to the backend log instead, so the app still works locally.

Run the API:

```powershell
cd backend
uvicorn main:app --reload
```

- API: http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend calls `http://127.0.0.1:8000` by default; set `VITE_API_URL` to point it elsewhere.

### 3. Tests

```powershell
cd backend
pytest
```

The suite uses a temporary SQLite database and never sends real emails. It covers signup/verification, login, password reset, account deletion, task CRUD, filtering, pagination, per-user isolation, admin permissions and reminder emails.

## API Overview

The complete API reference is in [docs/API.md](docs/API.md): every endpoint with its request and response examples, error codes, data models and configuration. Interactive documentation is at `/docs`. Protected endpoints need `Authorization: Bearer <token>`.

### Auth & Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | - | Create an account and email a verification code |
| `POST` | `/verify-email` | - | Verify the account with the emailed code |
| `POST` | `/resend-verification` | - | Email a new verification code |
| `POST` | `/login` | - | Form data `username` + `password`; returns a JWT |
| `POST` | `/forgot-password` | - | Email a password reset code |
| `POST` | `/reset-password` | - | Set a new password using the reset code |
| `GET` | `/me` | User | Current user's id, name, email and role |
| `PUT` | `/me` | User | Update my name |
| `POST` | `/me/change-password` | User | Change password (requires the current one) |
| `DELETE` | `/account` | User | Delete own account (requires password) |
| `GET` | `/users` | Admin | List all users |
| `DELETE` | `/users/{email}` | Admin | Delete a user and their tasks |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks/tasks` | User | My tasks; query `completed`, `priority`, `search`, `sort` (`newest`, `oldest`, `due_date`), `skip`, `limit` |
| `POST` | `/tasks/` | User | Create a task |
| `GET` | `/tasks/{id}` | User | Get one of my tasks (admins can open any task) |
| `GET` | `/tasks/calendar` | User | My tasks due between `start` and `end` (ISO datetimes) |
| `PUT` | `/tasks/{id}` | User | Update one of my tasks |
| `DELETE` | `/tasks/{id}` | User | Delete one of my tasks |
| `GET` | `/tasks/summary` | User | Counts by priority/status and the next 5 due tasks |
| `GET` | `/tasks/reminders` | User | High/medium tasks due within the next hour |
| `GET` | `/tasks/admin/all` | Admin | Every user's tasks; same filters as `/tasks/tasks` (search also matches the owner's name) |
| `DELETE` | `/tasks/admin/{id}` | Admin | Delete any task |
| `GET` | `/admin/stats` | Admin | User/task statistics, users with task counts, recent tasks |

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/dashboard` | User | KPIs, chart series, tasks by priority, upcoming deadlines, recent activity and task health. Query `year`, optional `quarter` (1-4) or `month` (1-12), and `tz` (the viewer's IANA timezone, so days and months match their clock). Admins see every user's tasks |

Example task body:

```json
{
  "title": "Prepare demo",
  "description": "Slides and walkthrough",
  "priority": "high",
  "due_at": "2026-11-01T10:00:00Z",
  "completed": false
}
```

Titles must be 3 to 100 characters. Errors use the format `{"detail": "Task not found"}`.

## Notes

- Due dates are stored in UTC; the frontend shows them in the viewer's local time.
- The reminder check runs inside the API process every minute. Run a single worker process so each reminder is sent once.
