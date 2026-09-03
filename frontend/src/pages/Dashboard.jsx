import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import TaskList from "../components/TaskList";

function Dashboard() {
    const navigate = useNavigate();
    const { logout: contextLogout } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 5;

    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    function getCompletedParam() {
        if (filter === "active") return false;
        if (filter === "completed") return true;
        return undefined;
    }

    useEffect(() => {
        setLoading(true);
        api
            .get("/tasks/tasks", {
                params: { completed: getCompletedParam(), skip: page * limit, limit }
            })
            .then((response) => {
                setTasks(response.data);
                setHasMore(response.data.length === limit);
            })
            .catch((error) => console.error("Error fetching tasks:", error))
            .finally(() => setLoading(false));
    }, [filter, page]);

    async function addTask() {
        if (!title.trim()) return;
        setIsAdding(true);
        try {
            const response = await api.post("/tasks/", { title, description, completed: false });
            setTasks([...tasks, response.data.task]);
            setTitle("");
            setDescription("");
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
                title: task.title, description: task.description, completed: !task.completed
            });
            setTasks(tasks.map((t) => (t.id === id ? response.data.task : t)));
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    }

    async function editTask(id, newTitle, newDescription) {
        const task = tasks.find((t) => t.id === id);
        try {
            const response = await api.put(`/tasks/${id}`, {
                title: newTitle, description: newDescription, completed: task.completed
            });
            setTasks(tasks.map((t) => (t.id === id ? response.data.task : t)));
        } catch (error) {
            console.error("Error editing task:", error);
        }
    }

    function clearTasks() {
        setTasks([]);
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
        setIsDeleting(true);
        try {
            await api.delete("/account", { data: { password: deletePassword } });
            contextLogout();
            navigate("/login");
        } catch (error) {
            console.error("Delete account failed:", error);
            setDeleteError(error.response?.data?.detail || "Failed to delete account.");
        } finally {
            setIsDeleting(false);
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
                    <h1 className="text-xl font-bold text-gray-800">My Todo App</h1>
                    <button onClick={logout} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 relative z-10">
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
                </div>

                <div className="flex gap-2 mb-4">
                    {filterButtons.map((btn) => (
                        <button key={btn.value} onClick={() => { setFilter(btn.value); setPage(0); }}
                            className={`text-sm px-3 py-1.5 rounded-full transition ${
                                filter === btn.value ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
                            }`}>
                            {btn.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-center text-gray-400 text-sm py-8">Loading tasks...</p>
                ) : (
                    <TaskList tasks={tasks} deleteTask={deleteTask} toggleTask={toggleTask} editTask={editTask} />
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

                <div className="mt-8 bg-white border border-red-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-red-500 mb-2">Danger zone</p>
                    {deleteError && <p className="text-red-600 text-sm mb-2">{deleteError}</p>}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter password to confirm"
                            className="flex-1 border border-red-300 rounded-lg px-3 py-2 text-sm" />
                        <button onClick={handleDeleteAccount} disabled={isDeleting}
                            className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition">
                            {isDeleting ? "Deleting..." : "Delete Account"}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;