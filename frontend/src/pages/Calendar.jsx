import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import * as tasksApi from "../api/tasks";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { alertStyles, buttonStyles, inputStyles, labelStyles, selectStyles } from "../components/ui/styles";
import { parseApiDate } from "../utils/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHIP_STYLES = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-slate-100 text-slate-700",
};
const DOT_STYLES = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-slate-400" };

function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Same key for any time on the same local day
function dayKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function Calendar() {
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [selected, setSelected] = useState(() => new Date());
    const [todayKey] = useState(() => dayKey(new Date()));
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    // Quick-add form for the selected day
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState("medium");
    const [time, setTime] = useState("09:00");
    const [isAdding, setIsAdding] = useState(false);

    // 6 rows x 7 days, starting on the Sunday on or before the 1st of the month
    const days = useMemo(() => {
        const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
        return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
    }, [month]);

    useEffect(() => {
        let active = true;
        const start = days[0];
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 42);
        tasksApi.getCalendarTasks(start, end)
            .then((response) => {
                if (!active) return;
                setTasks(response.data);
                setError("");
            })
            .catch((err) => {
                if (!active) return;
                console.error("Error fetching calendar tasks:", err);
                setError("Couldn't load your calendar. Please try again.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [days, reloadKey]);

    const tasksByDay = useMemo(() => {
        const groups = {};
        for (const task of tasks) {
            const key = dayKey(parseApiDate(task.due_at));
            (groups[key] ||= []).push(task);
        }
        return groups;
    }, [tasks]);

    const selectedTasks = tasksByDay[dayKey(selected)] || [];

    function showMonth(date) {
        setLoading(true);
        setMonth(startOfMonth(date));
    }

    function changeMonth(offset) {
        showMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
    }

    function goToToday() {
        const today = new Date();
        if (today.getMonth() !== month.getMonth() || today.getFullYear() !== month.getFullYear()) showMonth(today);
        setSelected(today);
    }

    function selectDay(day) {
        setSelected(day);
        if (day.getMonth() !== month.getMonth()) showMonth(day);
    }

    async function addTask(event) {
        event.preventDefault();
        setError("");
        if (title.trim().length < 3) {
            setError("Task title must be at least 3 characters.");
            return;
        }
        const [hours, minutes] = time.split(":").map(Number);
        const due = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), hours, minutes);

        setIsAdding(true);
        try {
            await tasksApi.createTask({ title: title.trim(), priority, due_at: due.toISOString(), completed: false });
            setTitle("");
            setReloadKey((key) => key + 1);
        } catch (err) {
            console.error("Error adding task:", err);
            setError("Couldn't add the task. Please try again.");
        } finally {
            setIsAdding(false);
        }
    }

    const timeFormat = { hour: "numeric", minute: "2-digit" };

    return (
        <div className="space-y-6">
            <PageHeader title="Calendar" subtitle="Every due date at a glance. Pick a day to see its tasks or add one." />

            {error && <p className={alertStyles.error}>{error}</p>}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                <Card
                    className="xl:col-span-2"
                    title={month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    actions={
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className={buttonStyles.small}>
                                <ChevronLeft size={16} />
                            </button>
                            <button type="button" onClick={goToToday} className={buttonStyles.small}>Today</button>
                            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className={buttonStyles.small}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    }
                >
                    <div className={`grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 transition-opacity ${loading ? "opacity-60" : ""}`}>
                        {WEEKDAYS.map((day) => (
                            <div key={day} className="bg-slate-50 py-2 text-center text-xs font-medium text-slate-500">{day}</div>
                        ))}

                        {days.map((day) => {
                            const key = dayKey(day);
                            const dayTasks = tasksByDay[key] || [];
                            const inMonth = day.getMonth() === month.getMonth();
                            const isSelected = key === dayKey(selected);
                            const isToday = key === todayKey;

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    aria-label={`${day.toDateString()}, ${dayTasks.length} ${dayTasks.length === 1 ? "task" : "tasks"}`}
                                    aria-pressed={isSelected}
                                    className={`min-h-20 p-1.5 text-left align-top transition sm:min-h-24 ${inMonth ? "bg-white" : "bg-slate-50"} ${
                                        isSelected ? "ring-2 ring-inset ring-brand-500" : "hover:bg-brand-50/50"
                                    }`}
                                >
                                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                                        isToday ? "bg-brand-600 font-semibold text-white" : inMonth ? "text-slate-800" : "text-slate-400"
                                    }`}>
                                        {day.getDate()}
                                    </span>

                                    {/* Phones: coloured dots. Larger screens: task chips */}
                                    <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                                        {dayTasks.slice(0, 4).map((task) => (
                                            <span key={task.id} className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[task.priority] || DOT_STYLES.medium}`} />
                                        ))}
                                    </div>
                                    <div className="mt-1 hidden space-y-1 sm:block">
                                        {dayTasks.slice(0, 2).map((task) => (
                                            <div key={task.id} className={`truncate rounded px-1.5 py-0.5 text-xs ${CHIP_STYLES[task.priority] || CHIP_STYLES.medium} ${task.completed ? "line-through opacity-60" : ""}`}>
                                                {task.title}
                                            </div>
                                        ))}
                                        {dayTasks.length > 2 && <div className="px-1.5 text-xs text-slate-500">+{dayTasks.length - 2} more</div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                <Card
                    className="xl:sticky xl:top-20"
                    title={selected.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                    subtitle={`${selectedTasks.length} ${selectedTasks.length === 1 ? "task" : "tasks"} due`}
                >
                    {selectedTasks.length === 0 ? (
                        <p className="mb-5 text-sm text-slate-400">Nothing due on this day.</p>
                    ) : (
                        <ul className="mb-5 space-y-2">
                            {selectedTasks.map((task) => (
                                <li key={task.id}>
                                    <Link to={`/tasks/${task.id}`}
                                        className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40">
                                        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_STYLES[task.priority] || DOT_STYLES.medium}`} />
                                        <span className={`flex-1 truncate text-sm ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</span>
                                        <span className="text-xs text-slate-500">{parseApiDate(task.due_at).toLocaleTimeString(undefined, timeFormat)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form onSubmit={addTask} className="space-y-3 border-t border-slate-100 pt-4">
                        <h3 className="text-sm font-semibold text-slate-900">Add a task for this day</h3>
                        <div>
                            <label htmlFor="quick-title" className={labelStyles}>Title</label>
                            <input id="quick-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)}
                                placeholder="Task title" className={inputStyles} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="quick-priority" className={labelStyles}>Priority</label>
                                <select id="quick-priority" value={priority} onChange={(event) => setPriority(event.target.value)} className={`${selectStyles} w-full`}>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="quick-time" className={labelStyles}>Time</label>
                                <input id="quick-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className={inputStyles} />
                            </div>
                        </div>
                        <button type="submit" disabled={isAdding} className={`${buttonStyles.primary} w-full`}>
                            <Plus size={16} /> {isAdding ? "Adding..." : "Add task"}
                        </button>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default Calendar;
