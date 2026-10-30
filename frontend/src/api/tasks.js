import api from "./axios";

// Every call to backend/routers/tasks.py lives here (all URLs start with /tasks).
// Each function is named after the backend function it hits (camelCase of the Python name).

// GET /tasks/tasks  →  tasks.py get_tasks()
// params: { completed, priority, search, sort, skip, limit }
export function getTasks(params) {
    return api.get("/tasks/tasks", { params });
}

// GET /tasks/{id}  →  tasks.py get_task()
export function getTask(taskId) {
    return api.get(`/tasks/${taskId}`);
}

// POST /tasks/  →  tasks.py create_task()
// body: { title, description, priority, due_at (UTC ISO string or null), completed }
export function createTask(body) {
    return api.post("/tasks/", body);
}

// PUT /tasks/{id}  →  tasks.py update_task()
// Same body as createTask; the backend replaces every field
export function updateTask(taskId, body) {
    return api.put(`/tasks/${taskId}`, body);
}

// DELETE /tasks/{id}  →  tasks.py delete_task()
export function deleteTask(taskId) {
    return api.delete(`/tasks/${taskId}`);
}

// GET /tasks/calendar  →  tasks.py get_calendar_tasks()
// start and end are Date objects; sent as UTC ISO strings
export function getCalendarTasks(start, end) {
    return api.get("/tasks/calendar", { params: { start: start.toISOString(), end: end.toISOString() } });
}

// GET /tasks/reminders  →  tasks.py get_task_reminders()
export function getTaskReminders() {
    return api.get("/tasks/reminders");
}

// ---------- Admin only ----------

// GET /tasks/admin/all  →  tasks.py get_all_tasks()
// Same params as getTasks
export function getAllTasks(params) {
    return api.get("/tasks/admin/all", { params });
}

// DELETE /tasks/admin/{id}  →  tasks.py delete_any_task()
export function deleteAnyTask(taskId) {
    return api.delete(`/tasks/admin/${taskId}`);
}
