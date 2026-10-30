import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "../context/useAuth";
import * as tasksApi from "../api/tasks";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import TaskFormModal from "../components/TaskFormModal";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { alertStyles, buttonStyles } from "../components/ui/styles";
import { formatDateTime, formatDue, formatRelative, isOverdue } from "../utils/dates";

function TaskDetails() {
    const { id } = useParams();          // the ":id" part of /tasks/:id
    const navigate = useNavigate();
    const { user } = useAuth();

    const [task, setTask] = useState(null);
    const [status, setStatus] = useState("loading");   // loading | ready | notfound | error
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [busy, setBusy] = useState(false);
    const [now] = useState(() => Date.now());

    useEffect(() => {
        tasksApi.getTask(id)
            .then((response) => {
                setTask(response.data);
                setStatus("ready");
            })
            .catch((err) => setStatus([404, 422].includes(err.response?.status) ? "notfound" : "error"));
    }, [id]);

    if (status === "loading") {
        return <p className="py-16 text-center text-sm text-slate-400">Loading task...</p>;
    }

    if (status !== "ready") {
        return (
            <Card className="mx-auto max-w-xl" bodyClassName="p-10 text-center">
                <h1 className="text-lg font-semibold text-slate-900">{status === "notfound" ? "Task not found" : "Couldn't load this task"}</h1>
                <p className="mt-2 text-sm text-slate-500">
                    {status === "notfound" ? "It may have been deleted, or it belongs to someone else." : "Please try again in a moment."}
                </p>
                <Link to="/tasks" className={`${buttonStyles.primary} mt-6`}>Back to tasks</Link>
            </Card>
        );
    }

    const isOwner = task.user_id === user.id;
    const overdue = isOverdue(task, now);

    async function toggleComplete() {
        setBusy(true);
        setError("");
        try {
            const response = await tasksApi.updateTask(task.id, {
                title: task.title,
                description: task.description,
                priority: task.priority,
                due_at: task.due_at,
                completed: !task.completed,
            });
            setTask({ ...task, ...response.data.task });
        } catch (err) {
            console.error("Error updating task:", err);
            setError("Couldn't update the task. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    async function deleteTask() {
        setBusy(true);
        try {
            // Owners use the normal endpoint; an admin removing someone else's task uses the admin one
            await (isOwner ? tasksApi.deleteTask(task.id) : tasksApi.deleteAnyTask(task.id));
            navigate("/tasks");
        } catch (err) {
            console.error("Error deleting task:", err);
            setError("Couldn't delete the task. Please try again.");
            setConfirmingDelete(false);
            setBusy(false);
        }
    }

    const details = [
        { label: "Status", value: <StatusBadge completed={task.completed} overdue={overdue} /> },
        { label: "Priority", value: <PriorityBadge priority={task.priority} compact /> },
        { label: "Due", value: task.due_at ? formatDue(task.due_at) : "No due date", alert: overdue },
        { label: "Created", value: task.created_at ? formatDateTime(task.created_at) : "-" },
        ...(task.completed && task.completed_at ? [{ label: "Completed", value: formatDateTime(task.completed_at) }] : []),
        ...(!isOwner ? [{ label: "Owner", value: task.user_name }] : []),
        { label: "Task ID", value: `#${task.id}` },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={task.title}
                subtitle={`Task #${task.id}${task.created_at ? ` · Created ${formatRelative(task.created_at)}` : ""}`}
                actions={
                    <>
                        {isOwner && (
                            <>
                                <button type="button" onClick={toggleComplete} disabled={busy} className={buttonStyles.secondary}>
                                    {task.completed ? <><RotateCcw size={16} /> Mark as active</> : <><Check size={16} /> Mark as completed</>}
                                </button>
                                <button type="button" onClick={() => setEditing(true)} className={buttonStyles.secondary}>
                                    <Pencil size={16} /> Edit
                                </button>
                            </>
                        )}
                        <button type="button" onClick={() => setConfirmingDelete(true)} className={buttonStyles.dangerOutline}>
                            <Trash2 size={16} /> Delete
                        </button>
                    </>
                }
            />

            {error && <p className={alertStyles.error}>{error}</p>}

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <Card title="Description" className="lg:col-span-2">
                    {task.description
                        ? <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">{task.description}</p>
                        : <p className="text-sm italic text-slate-400">No description</p>}
                </Card>

                <Card title="Details">
                    <dl className="divide-y divide-slate-100 text-sm">
                        {details.map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                                <dt className="text-slate-500">{row.label}</dt>
                                <dd className={`text-right ${row.alert ? "font-medium text-red-600" : "text-slate-900"}`}>{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>
            </div>

            {editing && (
                <TaskFormModal
                    task={task}
                    onClose={() => setEditing(false)}
                    onSaved={(saved) => {
                        setTask({ ...task, ...saved });
                        setEditing(false);
                    }}
                />
            )}

            {confirmingDelete && (
                <ConfirmDialog
                    title="Delete task?"
                    message={`"${task.title}" will be permanently deleted.`}
                    busy={busy}
                    onConfirm={deleteTask}
                    onCancel={() => setConfirmingDelete(false)}
                />
            )}
        </div>
    );
}

export default TaskDetails;
