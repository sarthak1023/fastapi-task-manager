import { Link } from "react-router-dom";
import { Check, Pencil, Trash2 } from "lucide-react";
import { PriorityBadge, StatusBadge } from "./Badges";
import { buttonStyles } from "./ui/styles";
import { formatDue, isOverdue } from "../utils/dates";

// Tasks as a table. `readOnly` hides the done checkbox and the edit/delete actions
// (used for the admin's all-users view); `showOwner` adds the Owner column.
function TaskTable({ tasks, now, readOnly = false, showOwner = false, busyId, onToggle, onEdit, onDelete }) {
    return (
        // `relative` keeps the hidden screen-reader labels (position: absolute) inside the scroll area,
        // otherwise they'd sit off to the right of the page and make the whole page scroll sideways
        <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        {!readOnly && <th scope="col" className="w-12 py-3 pl-5"><span className="sr-only">Done</span></th>}
                        <th scope="col" className={`py-3 pr-4 ${readOnly ? "pl-5" : ""}`}>Task</th>
                        {showOwner && <th scope="col" className="py-3 pr-4">Owner</th>}
                        <th scope="col" className="py-3 pr-4">Priority</th>
                        <th scope="col" className="py-3 pr-4">Due</th>
                        <th scope="col" className="py-3 pr-4">Status</th>
                        {!readOnly && <th scope="col" className="py-3 pr-5"><span className="sr-only">Actions</span></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => {
                        const overdue = isOverdue(task, now);
                        return (
                            <tr key={task.id} className="transition-colors hover:bg-slate-50/70">
                                {!readOnly && (
                                    <td className="py-3 pl-5 align-top">
                                        <button
                                            type="button"
                                            onClick={() => onToggle(task)}
                                            disabled={busyId === task.id}
                                            aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition disabled:opacity-50 ${
                                                task.completed ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-transparent hover:border-brand-500"
                                            }`}
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </button>
                                    </td>
                                )}
                                <td className={`py-3 pr-4 ${readOnly ? "pl-5" : ""}`}>
                                    <Link to={`/tasks/${task.id}`}
                                        className={`font-medium hover:text-brand-600 hover:underline ${task.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                        {task.title}
                                    </Link>
                                    {task.description && <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">{task.description}</p>}
                                </td>
                                {showOwner && <td className="whitespace-nowrap py-3 pr-4 text-slate-600">{task.user_name}</td>}
                                <td className="py-3 pr-4"><PriorityBadge priority={task.priority} compact /></td>
                                <td className={`whitespace-nowrap py-3 pr-4 ${overdue ? "font-medium text-red-600" : "text-slate-600"}`}>
                                    {task.due_at ? formatDue(task.due_at) : <span className="text-slate-400">No due date</span>}
                                </td>
                                <td className="py-3 pr-4"><StatusBadge completed={task.completed} overdue={overdue} /></td>
                                {!readOnly && (
                                    <td className="py-3 pr-5 text-right">
                                        <div className="inline-flex gap-1">
                                            <button type="button" onClick={() => onEdit(task)} aria-label={`Edit "${task.title}"`} className={buttonStyles.icon}>
                                                <Pencil size={16} />
                                            </button>
                                            <button type="button" onClick={() => onDelete(task)} aria-label={`Delete "${task.title}"`} className={buttonStyles.iconDanger}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default TaskTable;
