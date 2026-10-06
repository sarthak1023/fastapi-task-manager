import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import TaskList from "../components/TaskList";

function summarizeTasks(taskItems) {
    const summary = taskItems.reduce((result, task) => {
        result[task.priority || "medium"] += 1;
        result.total += 1;
        result.completed += task.completed ? 1 : 0;
        return result;
    }, { high: 0, medium: 0, low: 0, total: 0, completed: 0 });
    return { ...summary, active: summary.total - summary.completed };
}

function Dashboard() {
    const navigate = useNavigate();
    const { logout: contextLogout } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [dueAt, setDueAt] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [summary, setSummary] = useState({ high: 0, medium: 0, low: 0, total: 0, completed: 0, active: 0 });
    const [reminders, setReminders] = useState([]);
    const [users, setUsers] = useState([]);
    const [userDeleteError, setUserDeleteError] = useState("");
    const [deletingUser, setDeletingUser] = useState("");
    const [userName, setUserName] = useState("there");

    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 5;

    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [popupSeconds, setPopupSeconds] = useState(10);

    useEffect(() => {
        api.get("/me")
            .then((response) => setUserName(response.data.name || "there"))
            .catch((error) => console.error("Error fetching profile:", error));
    }, []);

    useEffect(() => {
        if (!showDeletePopup || popupSeconds === 0) return undefined;

        const countdown = setInterval(() => {
            setPopupSeconds((seconds) => Math.max(seconds - 1, 0));
        }, 1000);

        return () => clearInterval(countdown);
    }, [showDeletePopup, popupSeconds]);

    useEffect(() => {
        async function loadTasks() {
            try {
                const response = await api.get("/tasks/admin/all");
                setIsAdmin(true);
                const usersResponse = await api.get("/users");
                setUsers(usersResponse.data);
                const filtered = response.data.filter((task) => {
                    const statusMatch = filter === "active" ? !task.completed : filter === "completed" ? task.completed : true;
                    return statusMatch && (priorityFilter === "all" || task.priority === priorityFilter);
                });
                const start = page * limit;
                setTasks(filtered.slice(start, start + limit));
                setHasMore(filtered.length > start + limit);
                setSummary(summarizeTasks(response.data));
            } catch {
                setIsAdmin(false);
                const completed = filter === "active" ? false : filter === "completed" ? true : undefined;
                const response = await api.get("/tasks/tasks", { params: { completed, priority: priorityFilter === "all" ? undefined : priorityFilter, skip: page * limit, limit } });
                setTasks(response.data);
                setHasMore(response.data.length === limit);
                setSummary(summarizeTasks(response.data));
            } finally { setLoading(false); }
        }
        loadTasks();
    }, [filter, priorityFilter, page]);

    useEffect(() => {
        let mounted = true;
        async function loadReminders() {
            try { const response = await api.get("/tasks/reminders"); if (mounted) setReminders(response.data); }
            catch (error) { console.error("Error fetching reminders:", error); }
        }
        loadReminders();
        const timer = setInterval(loadReminders, 60000);
        return () => { mounted = false; clearInterval(timer); };
    }, []);

    async function addTask() {
        if (!title.trim()) return;
        setIsAdding(true);
        try {
            const response = await api.post("/tasks/", { title, description, priority, due_at: dueAt ? new Date(dueAt).toISOString() : null, completed: false });
            const nextTasks = [...tasks, response.data.task];
            setTasks(nextTasks);
            setSummary(summarizeTasks(nextTasks));
            setTitle("");
            setDescription("");
            setPriority("medium");
            setDueAt("");
        } catch (error) {
            console.error("Error adding task:", error);
        } finally {
            setIsAdding(false);
        }
    }

    async function deleteTask(id) {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter((task) => task.id !== id));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    }

    async function toggleTask(id) {
        const task = tasks.find((t) => t.id === id);
        try {
            const response = await api.put(`/tasks/${id}`, {
                title: task.title, description: task.description, priority: task.priority, due_at: task.due_at, completed: !task.completed
            });
            setTasks(tasks.map((t) => (t.id === id ? response.data.task : t)));
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    }

    async function editTask(id, newTitle, newDescription, newPriority, newDueAt) {
        const task = tasks.find((t) => t.id === id);
        try {
            const response = await api.put(`/tasks/${id}`, {
                title: newTitle, description: newDescription, priority: newPriority, due_at: newDueAt ? new Date(newDueAt).toISOString() : null, completed: task.completed
            });
            setTasks(tasks.map((t) => (t.id === id ? response.data.task : t)));
        } catch (error) {
            console.error("Error editing task:", error);
        }
    }

    function clearTasks() {
        setTasks([]);
        setSummary(summarizeTasks([]));
    }

    function logout() {
        contextLogout();
        navigate("/login");
    }

    async function handleDeleteAccount() {
        setDeleteError("");
        if (!deletePassword.trim()) {
            setDeleteError("Please enter your password.");
            return;
        }
        if (!window.confirm("Are you sure you want to permanently delete your account and all of your tasks?")) {
            return;
        }
        try {
            setPopupSeconds(10);
            setShowDeletePopup(true);
        } catch (error) {
            console.error("Delete account failed:", error);
            setDeleteError(error.response?.data?.detail || "Failed to delete account.");
        } finally {
            setIsDeleting(false);
        }
    }

    function cancelAccountDeletion() {
        setShowDeletePopup(false);
        setPopupSeconds(10);
        setDeletePassword("");
        setIsDeleting(false);
    }

    async function finishAccountDeletion() {
        setIsDeleting(true);
        try {
            await api.delete("/account", { data: { password: deletePassword } });
            setShowDeletePopup(false);
            window.alert("Your account has been permanently deleted. It cannot be recovered.");
            contextLogout();
            navigate("/login");
        } catch (error) {
            setShowDeletePopup(false);
            setDeleteError(error.response?.data?.detail || "Failed to permanently delete your account.");
        } finally {
            setIsDeleting(false);
        }
    }

    async function deleteUser(email, userName) {
        setUserDeleteError("");
        setDeletingUser(email);
        try {
            await api.delete(`/users/${encodeURIComponent(email)}`);
            setUsers(users.filter((user) => user.email !== email));
            setTasks(tasks.filter((task) => task.user_name !== userName));
        } catch (error) {
            setUserDeleteError(error.response?.data?.detail || "Failed to delete user.");
        } finally {
            setDeletingUser("");
        }
    }

    const filterButtons = [
        { label: "All", value: "all" },
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30 -z-0"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30 -z-0"></div>

            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">{isAdmin ? "All User Tasks" : "My Todo App"}</h1>
                    <button onClick={logout} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 relative z-10">
                <section className="welcome-banner mb-6 overflow-hidden rounded-3xl px-6 py-5 text-white shadow-xl">
                    <div className="relative z-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">TaskMaster workspace</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight">Welcome, {userName}</h2>
                        <p className="mt-1 text-sm text-cyan-50">Your focus for today starts here.</p>
                    </div>
                    <div className="welcome-orbit" aria-hidden="true" />
                </section>
                {reminders.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6"><div className="flex justify-between mb-2"><h2 className="font-semibold text-amber-900">Upcoming reminders</h2><button onClick={() => setReminders([])} className="text-xs text-amber-700">Dismiss</button></div>{reminders.map((task) => <div key={task.id} className="flex justify-between text-sm text-amber-900"><span>{task.title}</span><span>{task.priority} | {new Date(task.due_at).toLocaleString()}</span></div>)}</div>}
                <div className="bg-white rounded-2xl p-4 shadow-xl mb-6">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter task title"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter task description"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={addTask} disabled={isAdding}
                            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition whitespace-nowrap shadow-lg shadow-indigo-200">
                            {isAdding ? "Adding..." : "Add Task"}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2"><select value={priority} onChange={(e) => setPriority(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xl mb-6"><div className="flex flex-col sm:flex-row items-center gap-6"><div className="relative w-36 h-36 rounded-full shrink-0" style={{ background: summary.total === 0 ? "conic-gradient(#e5e7eb 0 100%)" : `conic-gradient(#ef4444 0 ${(summary.high / summary.total) * 100}%, #f59e0b ${(summary.high / summary.total) * 100}% ${((summary.high + summary.medium) / summary.total) * 100}%, #10b981 ${((summary.high + summary.medium) / summary.total) * 100}% 100%)` }}><div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center"><span className="text-2xl font-bold">{summary.total}</span><span className="text-xs text-gray-500">Tasks</span></div></div><div className="flex-1 w-full"><div className="flex justify-between mb-3"><h2 className="font-semibold">Task overview</h2><span className="text-xs text-gray-500">{summary.active} active / {summary.completed} completed</span></div><div className="grid grid-cols-3 gap-2 text-sm"><div className="rounded-lg bg-red-50 px-3 py-2">High <strong>{summary.high}</strong></div><div className="rounded-lg bg-amber-50 px-3 py-2">Medium <strong>{summary.medium}</strong></div><div className="rounded-lg bg-emerald-50 px-3 py-2">Low <strong>{summary.low}</strong></div></div></div></div></div>

                <div className="flex gap-2 mb-4">
                    {filterButtons.map((btn) => (
                        <button key={btn.value} onClick={() => { setFilter(btn.value); setPage(0); }}
                            className={`text-sm px-3 py-1.5 rounded-full transition ${
                                filter === btn.value ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
                            }`}>
                            {btn.label}
                        </button>
                    ))}
                    <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }} className="text-sm px-3 py-1.5 rounded-full bg-white text-gray-600 border border-gray-300" aria-label="Filter by priority"><option value="all">Priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
                </div>

                {loading ? (
                    <p className="text-center text-gray-400 text-sm py-8">Loading tasks...</p>
                ) : (
                    <TaskList tasks={tasks} deleteTask={deleteTask} toggleTask={toggleTask} editTask={editTask} readOnly={isAdmin} />
                )}

                <div className="flex items-center justify-center gap-4 mt-6">
                    <button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}
                        className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition">
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page + 1}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
                        className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition">
                        Next
                    </button>
                </div>

                <div className="text-center mt-6">
                    <button onClick={clearTasks} className="text-xs text-gray-400 hover:text-gray-600 underline">
                        Clear Tasks (local only)
                    </button>
                </div>

                {isAdmin ? (
                    <div className="mt-8 bg-white border border-red-100 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-red-500 mb-2">Admin danger zone</p>
                        <p className="text-sm text-gray-500 mb-3">Delete any user account and all of its tasks.</p>
                        {userDeleteError && <p className="text-red-600 text-sm mb-2">{userDeleteError}</p>}
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2">
                                    <span className="text-sm text-gray-700">{user.name || "Unnamed user"} <span className="text-gray-400">({user.email})</span></span>
                                    <button onClick={() => deleteUser(user.email, user.name)} disabled={deletingUser === user.email}
                                        className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:bg-red-300">
                                        {deletingUser === user.email ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 bg-white border border-red-100 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-red-500 mb-2">Danger zone</p>
                        {deleteError && <p className="text-red-600 text-sm mb-2">{deleteError}</p>}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter password to confirm" className="flex-1 border border-red-300 rounded-lg px-3 py-2 text-sm" />
                            <button onClick={handleDeleteAccount} disabled={isDeleting} className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-300">
                                {isDeleting ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {showDeletePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                        <h2 className="text-lg font-semibold text-red-700">Permanently delete account?</h2>
                        <p className="mt-2 text-sm text-gray-600">This will permanently delete your account and all of your tasks. You cannot recover this information.</p>
                        <div className="mt-5 flex gap-3">
                            <button onClick={cancelAccountDeletion} disabled={isDeleting} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={finishAccountDeletion} disabled={popupSeconds > 0 || isDeleting} className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                                {popupSeconds > 0 ? `OK (${popupSeconds}s)` : "OK"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;