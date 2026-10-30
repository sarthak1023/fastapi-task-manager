import { useState } from "react";
import * as tasksApi from "../api/tasks";
import Modal from "./ui/Modal";
import { alertStyles, buttonStyles, inputStyles, labelStyles } from "./ui/styles";
import { toLocalInputValue } from "../utils/dates";

// Create a task (no `task` prop) or edit one. Render it only while it should be open.
// `defaultDueAt` pre-fills the due date for new tasks ("YYYY-MM-DDTHH:mm", local time).
function TaskFormModal({ task, defaultDueAt = "", onClose, onSaved }) {
    const isEdit = Boolean(task);
    const [form, setForm] = useState({
        title: task?.title || "",
        description: task?.description || "",
        priority: task?.priority || "medium",
        dueAt: task ? toLocalInputValue(task.due_at) : defaultDueAt,
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function update(field) {
        return (event) => setForm({ ...form, [field]: event.target.value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const title = form.title.trim();
        if (title.length < 3 || title.length > 100) {
            setError("Title must be between 3 and 100 characters.");
            return;
        }

        const body = {
            title,
            description: form.description.trim() || null,
            priority: form.priority,
            due_at: form.dueAt ? new Date(form.dueAt).toISOString() : null,
            completed: task?.completed ?? false,
        };

        setSaving(true);
        try {
            const response = isEdit ? await tasksApi.updateTask(task.id, body) : await tasksApi.createTask(body);
            onSaved(response.data.task);
        } catch (err) {
            console.error("Error saving task:", err);
            setError(err.response?.status === 422 ? "Please check the details and try again." : "Couldn't save the task. Please try again.");
            setSaving(false);
        }
    }

    return (
        <Modal
            title={isEdit ? "Edit task" : "New task"}
            description={isEdit ? "Update the details of this task." : "Add a task with a priority and an optional due date."}
            onClose={() => { if (!saving) onClose(); }}
            footer={
                <>
                    <button type="button" onClick={onClose} disabled={saving} className={buttonStyles.secondary}>Cancel</button>
                    <button type="submit" form="task-form" disabled={saving} className={buttonStyles.primary}>
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create task"}
                    </button>
                </>
            }
        >
            <form id="task-form" onSubmit={handleSubmit} noValidate className="space-y-4">
                {error && <p role="alert" className={alertStyles.error}>{error}</p>}

                <div>
                    <label htmlFor="task-title" className={labelStyles}>Title</label>
                    <input id="task-title" type="text" value={form.title} onChange={update("title")} maxLength={100}
                        placeholder="e.g. Prepare the quarterly report" className={inputStyles} />
                </div>

                <div>
                    <label htmlFor="task-description" className={labelStyles}>
                        Description <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea id="task-description" rows={3} value={form.description} onChange={update("description")}
                        placeholder="Add any notes or details" className={inputStyles} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="task-priority" className={labelStyles}>Priority</label>
                        <select id="task-priority" value={form.priority} onChange={update("priority")} className={inputStyles}>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="task-due" className={labelStyles}>
                            Due date <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <input id="task-due" type="datetime-local" value={form.dueAt} onChange={update("dueAt")} className={inputStyles} />
                    </div>
                </div>
            </form>
        </Modal>
    );
}

export default TaskFormModal;
