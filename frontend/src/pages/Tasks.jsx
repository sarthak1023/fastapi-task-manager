import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ClipboardList, Plus, Search, X } from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import TaskTable from "../components/TaskTable";
import TaskFormModal from "../components/TaskFormModal";
import { alertStyles, buttonStyles, searchInputStyles, selectStyles } from "../components/ui/styles";

const PAGE_SIZE = 10;
const STATUS_TABS = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
];
const SORT_OPTIONS = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Due date", value: "due_date" },
];

function Tasks() {
    const { user } = useAuth();
    const isAdmin = user.is_admin;

    // The search term lives in the URL (?q=...) so the top bar search can open this page with it
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("q") || "";

    const [status, setStatus] = useState("all");
    const [priority, setPriority] = useState("all");
    const [sort, setSort] = useState("newest");

    // Any change of filter, sort or search starts again from the first page
    const queryKey = [status, priority, sort, search].join("|");
    const [paging, setPaging] = useState({ key: queryKey, page: 0 });
    const page = paging.key === queryKey ? paging.page : 0;

    const [tasks, setTasks] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [now] = useState(() => Date.now());

    const [formTask, setFormTask] = useState(null);        // null = closed, {} = new task, a task = editing it
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let active = true;
        const params = {
            completed: status === "active" ? false : status === "completed" ? true : undefined,
            priority: priority === "all" ? undefined : priority,
            search: search || undefined,
            sort,
            skip: page * PAGE_SIZE,
            limit: PAGE_SIZE + 1,   // one extra row tells us whether there is a next page
        };

        api.get(isAdmin ? "/tasks/admin/all" : "/tasks/tasks", { params })
            .then((response) => {
                if (!active) return;
                setTasks(response.data.slice(0, PAGE_SIZE));
                setHasMore(response.data.length > PAGE_SIZE);
                setError("");
            })
            .catch((err) => {
                if (!active) return;
                console.error("Error fetching tasks:", err);
                setError("Couldn't load tasks. Please try again.");
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [isAdmin, status, priority, sort, search, page, reloadKey]);

    // Each change below refetches; the current rows stay visible (faded) until the new ones arrive
    function change(setter, current, next) {
        if (current === next) return;
        setLoading(true);
        setter(next);
    }

    function goToPage(next) {
        setLoading(true);
        setPaging({ key: queryKey, page: next });
    }

    function reload() {
        setLoading(true);
        setReloadKey((key) => key + 1);
    }

    function applySearch(term) {
        if (term === search) return;
        setLoading(true);
        setSearchParams(term ? { q: term } : {});
    }

    function handleSearchSubmit(event) {
        event.preventDefault();
        applySearch(String(new FormData(event.currentTarget).get("q") || "").trim());
    }

    async function toggleTask(task) {
        setBusyId(task.id);
        try {
            await api.put(`/tasks/${task.id}`, {
                title: task.title,
                description: task.description,
                priority: task.priority,
                due_at: task.due_at,
                completed: !task.completed,
            });
            reload();
        } catch (err) {
            console.error("Error updating task:", err);
            setError("Couldn't update the task. Please try again.");
        } finally {
            setBusyId(null);
        }
    }

    async function confirmDelete() {
        setDeleteBusy(true);
        try {
            await api.delete(`/tasks/${deleting.id}`);
            setDeleting(null);
            reload();
        } catch (err) {
            console.error("Error deleting task:", err);
            setDeleting(null);
            setError("Couldn't delete the task. Please try again.");
        } finally {
            setDeleteBusy(false);
        }
    }

    const filtered = status !== "all" || priority !== "all" || Boolean(search);
    const first = page * PAGE_SIZE + 1;

    return (
        <div className="space-y-6">
            <PageHeader
                title={isAdmin ? "All tasks" : "Tasks"}
                subtitle={isAdmin ? "Every task across TaskMaster. Open one to see its details." : "Plan, prioritize and track everything on your list."}
                actions={
                    <button type="button" onClick={() => setFormTask({})} className={buttonStyles.primary}>
                        <Plus size={16} /> New task
                    </button>
                }
            />

            {error && <p className={alertStyles.error}>{error}</p>}

            <Card bodyClassName="">
                {/* Toolbar: filters on the left, search on the right */}
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
                    <div className="inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Status">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                aria-pressed={status === tab.value}
                                onClick={() => change(setStatus, status, tab.value)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                    status === tab.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <select value={priority} onChange={(event) => change(setPriority, priority, event.target.value)} aria-label="Priority" className={selectStyles}>
                        <option value="all">All priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <select value={sort} onChange={(event) => change(setSort, sort, event.target.value)} aria-label="Sort by" className={selectStyles}>
                        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>

                    <form onSubmit={handleSearchSubmit} role="search" className="w-full sm:ml-auto sm:w-72">
                        <label className="relative block">
                            <span className="sr-only">Search tasks</span>
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            {/* key resets the box when the search changes from elsewhere (e.g. the top bar) */}
                            <input key={search} name="q" type="search" defaultValue={search}
                                placeholder={isAdmin ? "Search tasks or people..." : "Search tasks..."} className={searchInputStyles} />
                        </label>
                    </form>
                </div>

                {search && (
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2 text-sm text-slate-600">
                        Showing results for <span className="font-medium text-slate-900">"{search}"</span>
                        <button type="button" onClick={() => applySearch("")}
                            className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-brand-600 hover:bg-brand-50">
                            <X size={14} /> Clear
                        </button>
                    </div>
                )}

                <div className={`transition-opacity ${loading && tasks.length ? "opacity-60" : ""}`} aria-busy={loading}>
                    {tasks.length > 0 ? (
                        <TaskTable
                            tasks={tasks}
                            now={now}
                            readOnly={isAdmin}
                            showOwner={isAdmin}
                            busyId={busyId}
                            onToggle={toggleTask}
                            onEdit={(task) => setFormTask(task)}
                            onDelete={(task) => setDeleting(task)}
                        />
                    ) : loading ? (
                        <p className="py-16 text-center text-sm text-slate-400">Loading tasks...</p>
                    ) : (
                        <div className="flex flex-col items-center px-5 py-16 text-center">
                            <div className="rounded-full bg-brand-50 p-3 text-brand-600"><ClipboardList size={22} /></div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{filtered ? "No tasks match" : "No tasks yet"}</p>
                            <p className="mt-1 text-sm text-slate-500">
                                {filtered ? "Try a different filter or search term." : "Create your first task to get started."}
                            </p>
                            {!filtered && (
                                <button type="button" onClick={() => setFormTask({})} className={`${buttonStyles.primary} mt-4`}>
                                    <Plus size={16} /> New task
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
                    <span>{tasks.length ? `Showing ${first}–${first + tasks.length - 1}` : "No tasks to show"}</span>
                    <div className="flex items-center gap-2">
                        <span className="mr-1">Page {page + 1}</span>
                        <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 0} className={buttonStyles.small}>
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <button type="button" onClick={() => goToPage(page + 1)} disabled={!hasMore} className={buttonStyles.small}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </Card>

            {formTask && (
                <TaskFormModal
                    task={formTask.id ? formTask : null}
                    onClose={() => setFormTask(null)}
                    onSaved={() => {
                        setFormTask(null);
                        reload();
                    }}
                />
            )}

            {deleting && (
                <ConfirmDialog
                    title="Delete task?"
                    message={`"${deleting.title}" will be permanently deleted.`}
                    busy={deleteBusy}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleting(null)}
                />
            )}
        </div>
    );
}

export default Tasks;
