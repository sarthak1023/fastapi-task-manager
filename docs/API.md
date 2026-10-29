# TaskMaster API Reference

This is the full reference for the TaskMaster REST API. The backend is built with FastAPI. Its code lives in `backend/`: the endpoints are in `routers/` and the business logic is in `services/`.

You can also explore the API interactively. FastAPI generates these pages from the code:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

## Contents

1. [Basics](#basics)
2. [Authentication](#authentication)
3. [Errors](#errors)
4. [Data models](#data-models)
5. [Endpoints at a glance](#endpoints-at-a-glance)
6. [Health](#health)
7. [Auth & account](#auth--account)
8. [Profile](#profile)
9. [Tasks](#tasks)
10. [Dashboard](#dashboard)
11. [Admin](#admin)
12. [Background jobs and emails](#background-jobs-and-emails)
13. [Configuration](#configuration)

---

## Basics

| | |
|---|---|
| Base URL (local) | `http://127.0.0.1:8000` |
| Request body format | JSON (`Content-Type: application/json`). The one exception is `POST /login`, which takes form data. |
| Response format | JSON |
| Times sent to the API | ISO 8601 with a timezone, e.g. `2026-10-28T09:30:00.000Z` (what `Date.toISOString()` produces) |
| Times returned by the API | ISO 8601 in **UTC without a timezone suffix**, e.g. `2026-10-28T09:30:00`. Treat them as UTC; the frontend does this in `parseApiDate` in `frontend/src/utils/dates.js`. |
| CORS | Only the origins listed in `CORS_ORIGINS` are allowed |

---

## Authentication

The API uses **JWT bearer tokens** (OAuth2 password flow).

1. Call `POST /login` with the email and password to get an `access_token`.
2. Send the token on every protected request:

   ```
   Authorization: Bearer <access_token>
   ```

3. Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (60 by default). After that, protected endpoints return `401` and the user has to log in again.

The token payload is `{ "sub": "<email>", "exp": <unix time> }`, signed with `SECRET_KEY` using `ALGORITHM` (HS256 by default).

### Access levels

| Level | Meaning |
|---|---|
| **Public** | No token needed |
| **User** | Any logged-in user (`get_current_user`) |
| **Admin** | A logged-in user with `is_admin = true` (`require_admin`). Anyone else gets `403 Administrator access required`. |

The admin account is created, or an existing account is promoted, when the server starts, using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

### Password rules

Signup, reset password and change password all check new passwords with `check_password_strength` in `services/auth.py`. A password must contain:

- at least 8 characters
- an uppercase letter
- a lowercase letter
- a number
- a special character

If any rule fails, the API returns `400` and lists every missing rule:

```json
{ "detail": "Password must contain an uppercase letter, a special character" }
```

---

## Errors

Every error response has a `detail` field.

| Status | When | Example body |
|---|---|---|
| `400 Bad Request` | A business rule failed (duplicate email, weak password, wrong code, ...) | `{ "detail": "Email already exists" }` |
| `401 Unauthorized` | Missing, invalid or expired token; wrong login credentials | `{ "detail": "Could not validate credentials" }` |
| `403 Forbidden` | Email not verified (login), or a non-admin calling an admin endpoint | `{ "detail": "Administrator access required" }` |
| `404 Not Found` | The task or user doesn't exist, or the task belongs to someone else | `{ "detail": "Task not found" }` |
| `422 Unprocessable Entity` | The request body or query failed validation (FastAPI's standard format) | see below |
| `500 Internal Server Error` | An unexpected exception. It is logged on the server; the client sees only a generic message. | `{ "detail": "Internal Server Error" }` |

A `422` response lists each invalid field:

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "title"],
      "msg": "String should have at least 3 characters",
      "input": "ab",
      "ctx": { "min_length": 3 }
    }
  ]
}
```

---

## Data models

### Task

The API returns this object from task endpoints. It matches the `tasks` table in `models/task.py`.

| Field | Type | Description |
|---|---|---|
| `id` | integer | Task ID |
| `title` | string | 3–100 characters |
| `description` | string \| null | Optional details |
| `completed` | boolean | Whether the task is done |
| `priority` | `"high"` \| `"medium"` \| `"low"` | Defaults to `"medium"` |
| `due_at` | datetime \| null | Due date and time (UTC) |
| `created_at` | datetime | When the task was created (UTC) |
| `completed_at` | datetime \| null | When the task was marked done; cleared if it is reopened |
| `reminder_sent` | boolean | Whether the reminder email has been sent |
| `user_id` | integer | The owner's user ID |

> `POST /tasks/` returns a shorter task object: `id`, `title`, `description`, `completed`, `priority` and `due_at`.

### TaskInput (request body)

`POST /tasks/` and `PUT /tasks/{task_id}` take this body. It is defined as `Task` in `schemas/task.py`.

| Field | Type | Required | Rules |
|---|---|---|---|
| `title` | string | yes | 3–100 characters |
| `description` | string \| null | no | |
| `completed` | boolean | **yes** | |
| `priority` | string | no | `high`, `medium` or `low` (default `medium`) |
| `due_at` | datetime \| null | no | ISO 8601 with a timezone; stored as UTC |

`PUT` replaces the whole task, so send every field, not just the ones that changed.

### User

| Field | Type | Description |
|---|---|---|
| `id` | integer | User ID |
| `name` | string | Display name |
| `email` | string | Unique login email |
| `is_admin` | boolean | Administrator flag |
| `is_verified` | boolean | Whether the email has been verified (admin views only) |

The API never returns passwords, verification codes or reset codes.

---

## Endpoints at a glance

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Health check |
| POST | `/signup` | Public | Create an account and email a verification code |
| POST | `/verify-email` | Public | Verify an email address with its code |
| POST | `/resend-verification` | Public | Send a new verification code |
| POST | `/login` | Public | Get an access token |
| POST | `/forgot-password` | Public | Email a password reset code |
| POST | `/reset-password` | Public | Set a new password using the code |
| GET | `/me` | User | Get my profile |
| PUT | `/me` | User | Update my name |
| POST | `/me/change-password` | User | Change my password |
| DELETE | `/account` | User | Delete my account and all of my tasks |
| GET | `/tasks/tasks` | User | List my tasks (filter, search, sort, paginate) |
| POST | `/tasks/` | User | Create a task |
| GET | `/tasks/{task_id}` | User | Get one task (admins can get any task) |
| PUT | `/tasks/{task_id}` | User | Update one of my tasks |
| DELETE | `/tasks/{task_id}` | User | Delete one of my tasks |
| GET | `/tasks/reminders` | User | My high/medium tasks due within the next hour |
| GET | `/tasks/summary` | User | Task counts and the next due tasks |
| GET | `/tasks/calendar` | User | My tasks due between two dates |
| GET | `/dashboard` | User | Dashboard KPIs, chart data and lists |
| GET | `/tasks/admin/all` | Admin | List every user's tasks |
| DELETE | `/tasks/admin/{task_id}` | Admin | Delete any task |
| GET | `/admin/stats` | Admin | User and task overview for the admin console |
| GET | `/users` | Admin | List all users |
| DELETE | `/users/{email}` | Admin | Delete a user and all of their tasks |

---

## Health

### `GET /`

Checks that the API is running.

**Access:** Public

**Response `200`**

```json
{ "status": "ok", "docs": "/docs" }
```

---

## Auth & account

All of these endpoints are defined in `backend/routers/user.py`.

Verification codes and reset codes are **6 digits** and **expire after 10 minutes**. Emails are sent in the background after the response returns, so a slow mail server doesn't slow the request down.

### `POST /signup`

Creates an **unverified** account and emails a verification code.

**Access:** Public

**Request body**

```json
{
  "name": "Asha Verma",
  "email": "asha@example.com",
  "password": "Str0ng!Pass"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | required |
| `email` | string | must be a valid email |
| `password` | string | must meet the [password rules](#password-rules) |

**Response `201 Created`**

```json
{ "id": 7, "name": "Asha Verma", "email": "asha@example.com" }
```

**Errors**

| Status | `detail` |
|---|---|
| 400 | `Email already exists` |
| 400 | `Password must contain ...` |
| 422 | Invalid email or missing fields |

### `POST /verify-email`

Verifies the account with the code from the email. After this, the user can log in.

**Access:** Public

**Request body**

```json
{ "email": "asha@example.com", "code": "482913" }
```

**Response `200`**

```json
{ "message": "Email verified successfully" }
```

If the account is already verified, the response is `{ "message": "Email already verified" }`.

**Errors**

| Status | `detail` |
|---|---|
| 400 | `Invalid or expired code` |

### `POST /resend-verification`

Sends a new verification code if the account exists and is not yet verified.

**Access:** Public

**Request body**

```json
{ "email": "asha@example.com" }
```

**Response `200`**

The message is the same whether or not the account exists, so this endpoint can't be used to find out which emails are registered:

```json
{ "message": "If that account needs verification, a new code has been sent." }
```

### `POST /login`

Exchanges an email and password for an access token.

**Access:** Public

**Request body:** `application/x-www-form-urlencoded`, as the OAuth2 password flow requires. Put the email in the `username` field.

```
username=asha@example.com&password=Str0ng!Pass
```

Example with axios:

```js
const form = new URLSearchParams({ username: email, password });
await api.post("/login", form, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
```

**Response `200`**

```json
{ "access_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "bearer" }
```

**Errors**

| Status | `detail` |
|---|---|
| 401 | `Invalid email or password` |
| 403 | `Please verify your email before logging in` |

### `POST /forgot-password`

Emails a password reset code if the account exists.

**Access:** Public

**Request body**

```json
{ "email": "asha@example.com" }
```

**Response `200`**

The message is the same whether or not the account exists:

```json
{ "message": "If an account exists for that email, a reset code has been sent." }
```

### `POST /reset-password`

Sets a new password using the reset code. This also marks the email as verified, because receiving the code proves the user owns that email.

**Access:** Public

**Request body**

```json
{
  "email": "asha@example.com",
  "code": "193847",
  "new_password": "N3w!Password"
}
```

**Response `200`**

```json
{ "message": "Password reset successfully" }
```

**Errors**

| Status | `detail` |
|---|---|
| 400 | `Invalid or expired code` |
| 400 | `Password must contain ...` |

---

## Profile

### `GET /me`

Returns the logged-in user. The frontend calls this on page load to restore the session and to find out the user's role.

**Access:** User

**Response `200`**

```json
{ "id": 7, "name": "Asha Verma", "email": "asha@example.com", "is_admin": false }
```

If the name is empty, `name` comes back as `"there"`, so greetings read "Hi there".

### `PUT /me`

Updates the logged-in user's display name.

**Access:** User

**Request body**

```json
{ "name": "Asha V." }
```

`name` must be 1–50 characters and can't be only spaces.

**Response `200`:** the updated profile, in the same shape as `GET /me`.

**Errors**

| Status | `detail` |
|---|---|
| 400 | `Name cannot be empty` |
| 422 | Name longer than 50 characters |

### `POST /me/change-password`

Changes the logged-in user's password.

**Access:** User

**Request body**

```json
{ "current_password": "Str0ng!Pass", "new_password": "N3w!Password" }
```

**Response `200`**

```json
{ "message": "Password changed successfully" }
```

**Errors**

| Status | `detail` |
|---|---|
| 400 | `Current password is incorrect` |
| 400 | `Password must contain ...` |
| 400 | `New password must be different from the current one` |

> A wrong current password returns `400`, not `401`, so the frontend doesn't mistake a typo for an expired session and log the user out.

### `DELETE /account`

Permanently deletes the logged-in user's account and all of their tasks. The user has to confirm with their password.

**Access:** User

**Request body**

```json
{ "password": "Str0ng!Pass" }
```

With axios: `api.delete("/account", { data: { password } })`.

**Response `200`**

```json
{ "message": "Account deleted successfully" }
```

**Errors**

| Status | `detail` |
|---|---|
| 401 | `Incorrect password` |

---

## Tasks

All of these endpoints are defined in `backend/routers/tasks.py` under the `/tasks` prefix. Users can only see and change **their own** tasks. If a task belongs to someone else, the API returns `404`, so it doesn't reveal that the task exists.

### `GET /tasks/tasks`

Lists the logged-in user's tasks.

**Access:** User

**Query parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `completed` | boolean | (all) | `true` returns only done tasks; `false` returns only open tasks |
| `priority` | string | (all) | `high`, `medium` or `low` |
| `search` | string | | Case-insensitive match on the title or description. `%` and `_` are matched as literal characters. |
| `sort` | string | `newest` | `newest`, `oldest`, or `due_date` (soonest first; tasks with no due date last) |
| `skip` | integer ≥ 0 | `0` | Number of tasks to skip (for paging) |
| `limit` | integer 1–100 | `10` | Page size |

**Example**

```
GET /tasks/tasks?completed=false&priority=high&search=report&sort=due_date&skip=0&limit=20
```

**Response `200`:** an array of [Task](#task) objects.

```json
[
  {
    "id": 42,
    "title": "Submit quarterly report",
    "description": "Send to finance",
    "completed": false,
    "priority": "high",
    "due_at": "2026-10-30T11:30:00",
    "created_at": "2026-10-20T06:12:44",
    "completed_at": null,
    "reminder_sent": false,
    "user_id": 7
  }
]
```

> To find out whether there is another page, request `limit + 1` items, or check whether you got back a full page.

### `POST /tasks/`

Creates a task for the logged-in user. Note the trailing slash in the path.

**Access:** User

**Request body:** [TaskInput](#taskinput-request-body)

```json
{
  "title": "Submit quarterly report",
  "description": "Send to finance",
  "completed": false,
  "priority": "high",
  "due_at": "2026-10-30T11:30:00.000Z"
}
```

**Response `201 Created`**

```json
{
  "message": "Task created successfully",
  "task": {
    "id": 42,
    "title": "Submit quarterly report",
    "description": "Send to finance",
    "completed": false,
    "priority": "high",
    "due_at": "2026-10-30T11:30:00"
  }
}
```

If the task is created with `completed: true`, the API sets `completed_at` to the current time.

### `GET /tasks/{task_id}`

Gets one task.

**Access:** User

- **Normal users** can only get their own tasks. The response is a [Task](#task).
- **Admins** can get any task. The response is a [Task](#task) with an extra `user_name` field (the owner's name, or `"Unnamed user"`).

**Errors**

| Status | `detail` |
|---|---|
| 404 | `Task not found` |

### `PUT /tasks/{task_id}`

Replaces one of the logged-in user's own tasks. This applies to admins too: an admin can't edit another user's task.

**Access:** User

**Request body:** [TaskInput](#taskinput-request-body). Send every field.

**What else changes**

- If `due_at` changes, `reminder_sent` is reset to `false`, so a reminder is sent again for the new due time.
- If the task goes from not done to done, `completed_at` is set to the current time.
- If the task is reopened (`completed: false`), `completed_at` is cleared.

**Response `200`**

```json
{ "message": "Task updated successfully", "task": { /* full Task */ } }
```

**Errors**

| Status | `detail` |
|---|---|
| 404 | `Task not found` |
| 422 | Validation error |

### `DELETE /tasks/{task_id}`

Deletes one of the logged-in user's own tasks.

**Access:** User

**Response `200`**

```json
{ "message": "Task deleted successfully" }
```

**Errors**

| Status | `detail` |
|---|---|
| 404 | `Task not found` |

### `GET /tasks/reminders`

Returns the logged-in user's **open, high or medium priority** tasks that are due **within the next hour**, soonest first. The bell icon in the top bar polls this endpoint every 60 seconds.

**Access:** User

**Response `200`:** an array of [Task](#task) objects. The array is empty if nothing is due.

### `GET /tasks/summary`

Returns task counts by priority and status, plus the next 5 open tasks with a future due date. Admins get counts across **all** users; everyone else gets only their own.

**Access:** User

**Response `200`**

```json
{
  "high": 3,
  "medium": 5,
  "low": 2,
  "total": 10,
  "completed": 4,
  "active": 6,
  "upcoming": [ /* up to 5 Task objects, soonest due first */ ]
}
```

### `GET /tasks/calendar`

Returns the logged-in user's tasks with a due date in the range `[start, end)`, ordered by due date. The Calendar page uses this to fill in each month.

**Access:** User

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `start` | datetime | yes | Start of the range (inclusive), e.g. `2026-10-01T00:00:00.000Z` |
| `end` | datetime | yes | End of the range (exclusive) |

**Response `200`:** an array of [Task](#task) objects.

**Errors**

| Status | `detail` |
|---|---|
| 400 | `end must be after start` |
| 422 | Missing or invalid date |

---

## Dashboard

### `GET /dashboard`

Returns everything the Dashboard page shows: KPI cards, chart data, lists and the health panel. It is defined in `routers/dashboard.py`, and the numbers are calculated in `services/dashboard.py`.

Admins get numbers for **all** users' tasks; everyone else gets only their own. Days and months are grouped in the **viewer's timezone**, so "today" and "October" match the user's clock.

**Access:** User

**Query parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `year` | integer 2000–2100 | the current year | The year to report on |
| `quarter` | integer 1–4 | | Narrow the period to one quarter |
| `month` | integer 1–12 | | Narrow the period to one month. If both are sent, `month` is used instead of `quarter`. |
| `tz` | string | `DISPLAY_TIMEZONE` (`Asia/Kolkata`) | The viewer's IANA timezone, e.g. `Asia/Kolkata`. Unknown names fall back to the default. |

The frontend currently sends only `year` and `tz` (Full Year view). The `quarter` and `month` parameters are still supported.

| Period | Chart points (`series`) | Compared with |
|---|---|---|
| Year (default) | 12 months | the previous year |
| Quarter | 3 months | the previous quarter |
| Month | one point per day | the previous month |

**Response `200`**

```json
{
  "period": { "label": "Full Year 2026", "compare_label": "last year" },
  "kpis": {
    "added": 48,
    "added_change": 12,
    "completed": 30,
    "completed_change": -3,
    "open": 18,
    "due_next_7_days": 4,
    "overdue": 2,
    "done": 30,
    "total": 48,
    "completion_rate": 63
  },
  "series": [
    { "label": "Jan", "full_label": "January 2026", "added": 3, "completed": 1 },
    { "label": "Nov", "full_label": "November 2026", "added": null, "completed": null }
  ],
  "by_priority": [
    { "priority": "high", "count": 12 },
    { "priority": "medium", "count": 25 },
    { "priority": "low", "count": 11 }
  ],
  "upcoming": [
    { "id": 42, "title": "Submit quarterly report", "priority": "high",
      "due_at": "2026-10-30T11:30:00", "completed": false, "user_name": "Asha Verma" }
  ],
  "activity": [
    { "type": "completed", "at": "2026-10-28T08:01:10", "id": 40, "title": "Book venue",
      "priority": "medium", "due_at": null, "completed": true, "user_name": "Asha Verma" }
  ],
  "health": { "due_today": 1, "due_next_7_days": 4, "overdue": 2, "no_due_date": 5 }
}
```

**Field reference**

| Field | Meaning |
|---|---|
| `kpis.added` / `kpis.completed` | Tasks created / completed **inside the selected period** |
| `kpis.added_change` / `kpis.completed_change` | The difference from the previous period (can be negative) |
| `kpis.open`, `overdue`, `due_next_7_days`, `done`, `total`, `completion_rate` | **Live** numbers for right now, whatever period is selected. `completion_rate` is a whole-number percentage. |
| `series[]` | One point per chart bucket. A bucket that **hasn't started yet** has `null` values, not `0`, so the line chart stops at the present. |
| `by_priority[]` | Tasks created in the period, by priority |
| `upcoming[]` | The next 5 open tasks with a future due date |
| `activity[]` | The 8 most recent "added" and "completed" events. `at` is the time of the event (UTC). |
| `health` | Open tasks grouped by urgency |

---

## Admin

Every endpoint in this section needs an **admin** token. Anyone else gets `403 Administrator access required`.

### `GET /admin/stats`

Returns everything the Admin Console page shows. It is defined in `routers/admin.py`.

**Response `200`**

```json
{
  "users": { "total": 12, "verified": 10, "unverified": 2, "admins": 1 },
  "tasks": { "total": 140, "completed": 90, "active": 50, "overdue": 6, "created_this_week": 14 },
  "user_list": [
    { "id": 1, "name": "Administrator", "email": "admin@example.com",
      "is_verified": true, "is_admin": true, "task_count": 3 }
  ],
  "recent_tasks": [
    { "id": 140, "title": "Plan sprint", "priority": "high", "completed": false,
      "created_at": "2026-10-28T07:45:00", "user_name": "Asha Verma" }
  ]
}
```

`recent_tasks` contains the 8 most recently created tasks across all users.

### `GET /tasks/admin/all`

Lists every user's tasks. Each task has an extra `user_name` field.

**Query parameters:** the same as [`GET /tasks/tasks`](#get-taskstasks), with two differences:

- `search` also matches the owner's name.
- `limit` is optional (1–100). If you leave it out, **all** matching tasks are returned.

**Response `200`**

```json
[
  {
    "id": 42, "title": "Submit quarterly report", "description": "Send to finance",
    "completed": false, "priority": "high", "due_at": "2026-10-30T11:30:00",
    "created_at": "2026-10-20T06:12:44", "completed_at": null,
    "user_id": 7, "user_name": "Asha Verma"
  }
]
```

### `DELETE /tasks/admin/{task_id}`

Deletes any user's task.

**Response `200`**

```json
{ "message": "Task deleted successfully" }
```

**Errors**

| Status | `detail` |
|---|---|
| 404 | `Task not found` |

### `GET /users`

Lists all users.

**Response `200`**

```json
[
  { "id": 1, "name": "Administrator", "email": "admin@example.com", "is_verified": true, "is_admin": true }
]
```

### `DELETE /users/{email}`

Deletes a user and **all of their tasks**. URL-encode the email, e.g. `encodeURIComponent(email)`.

**Response `200`**

```json
{ "message": "User deleted" }
```

**Errors**

| Status | `detail` |
|---|---|
| 400 | `Administrators cannot delete their own account here` |
| 404 | `User not found` |

---

## Background jobs and emails

These run on the server. No endpoint calls them, but they affect what users receive.

| Job | Where | What it does |
|---|---|---|
| Reminder loop | `services/reminders.py`, started from `lifespan` in `main.py` | Every **60 seconds**, it emails the owner of each open **high or medium** task that is due **within the next hour**. Each task gets one email, tracked by `reminder_sent`. Times in the email are shown in `DISPLAY_TIMEZONE`, e.g. `30 Oct 2026, 05:00 PM IST`. |
| Verification email | `services/email.py` → `send_verification_email` | Sent after `/signup` and `/resend-verification` |
| Password reset email | `services/email.py` → `send_password_reset_email` | Sent after `/forgot-password` |

All emails are sent through SMTP, as HTML with a plain-text fallback. The templates are in `services/email_templates.py`. If SMTP isn't configured, the email isn't sent. Instead, its full text is written to the server log, so in local development you can copy verification and reset codes from the console. The API keeps working either way.

> Run the API as a **single worker process**. With several workers, each one runs its own reminder loop, and users can get duplicate reminder emails.

### Database migrations

When the server starts, `core/migrations.py` adds any columns that were introduced after the first release (`completed_at`, `reminder_sent`, `reset_code_expires`, ...) and backfills them. For example, it sets `completed_at = created_at` for tasks that were already completed.

---

## Configuration

These environment variables are read from `backend/.env`. See `backend/.env.example`.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SECRET_KEY` | **yes** | | Signs JWTs. The server won't start without it. |
| `ALGORITHM` | no | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | `60` | How long a token stays valid |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | | Creates or promotes the admin account at startup |
| `SMTP_HOST` / `SMTP_PORT` | for email | `smtp.gmail.com` / `587` | Mail server |
| `SMTP_USER` / `SMTP_PASSWORD` | for email | | SMTP login (for Gmail, an App Password) |
| `SMTP_FROM` | no | `SMTP_USER` | The sender address |
| `DISPLAY_TIMEZONE` | no | `Asia/Kolkata` | Timezone for times in reminder emails, and the dashboard's fallback timezone |
| `FRONTEND_URL` | no | `https://fastapi-task-manager-khaki.vercel.app` | Target of the "Open TaskMaster" button in emails |
| `CORS_ORIGINS` | no | `http://localhost:5173,https://fastapi-task-manager-khaki.vercel.app` | Frontend URLs allowed to call the API, comma-separated |

On the frontend, `VITE_API_URL` sets the API base URL. The default is `http://127.0.0.1:8000`.
