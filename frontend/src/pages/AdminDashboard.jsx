import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CalendarPlus, CircleCheck, Clock, ListChecks, Search, Trash2, TriangleAlert, Users } from "lucide-react";
import { useAuth } from "../context/useAuth";
import * as adminApi from "../api/admin";
import * as userApi from "../api/user";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { PriorityBadge } from "../components/Badges";
import { alertStyles, buttonStyles, searchInputStyles } from "../components/ui/styles";
import { formatRelative } from "../utils/dates";
import { getInitials } from "../utils/user";

function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!user.is_admin) return undefined;
        let active = true;
        adminApi.getAdminStats()
            .then((response) => {
                if (!active) return;
                setStats(response.data);
                setError("");
            })
            .catch((err) => {
                if (!active) return;
                console.error("Error fetching admin stats:", err);
                setError("Couldn't load the admin console. Please refresh the page.");
            });
        return () => { active = false; };
    }, [user.is_admin, reloadKey]);

    // Normal users who type /admin are sent back to their own dashboard
    if (!user.is_admin) return <Navigate to="/dashboard" replace />;

    async function confirmDeleteUser() {
        setDeleteBusy(true);
        setDeleteError("");
        try {
            await userApi.deleteUser(deleting.email);
            setDeleting(null);
            setReloadKey((key) => key + 1);   // refresh the counts and the table
        } catch (err) {
            setDeleteError(err.response?.data?.detail || "Failed to delete user.");
        } finally {
            setDeleteBusy(false);
        }
    }

    const header = <PageHeader title="Admin Console" subtitle="Accounts and activity across all of TaskMaster." />;

    if (!stats) {
        return (
            <div className="space-y-6">
                {header}
                {error ? <p className={alertStyles.error}>{error}</p> : <p className="py-16 text-center text-sm text-slate-400">Loading admin console...</p>}
            </div>
        );
    }

    const query = search.trim().toLowerCase();
    const users = stats.user_list.filter((u) =>
        !query || (u.name || "").toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );

    return (
        <div className="space-y-6">
            {header}

            {error && <p className={alertStyles.error}>{error}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatCard label="Users" value={stats.users.total} icon={Users} accent="brand"
                    hint={{ text: `${stats.users.verified} verified · ${stats.users.unverified} pending` }} />
                <StatCard label="Total tasks" value={stats.tasks.total} icon={ListChecks} accent="slate"
                    hint={{ text: `${stats.tasks.completed} completed`, icon: CircleCheck }} />
                <StatCard label="Active tasks" value={stats.tasks.active} icon={Clock} accent="amber" hint={{ text: "Not completed yet" }} />
                <StatCard label="Overdue" value={stats.tasks.overdue} icon={TriangleAlert} accent={stats.tasks.overdue > 0 ? "red" : "slate"}
                    hint={stats.tasks.overdue > 0
                        ? { text: "Past their due date", tone: "bad", icon: TriangleAlert }
                        : { text: "Nothing overdue", tone: "good", icon: CircleCheck }} />
                <StatCard label="New this week" value={stats.tasks.created_this_week} icon={CalendarPlus} accent="green"
                    hint={{ text: "Tasks created in the last 7 days" }} />
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                <Card
                    className="xl:col-span-2"
                    title="Users"
                    subtitle="Deleting a user also permanently deletes all of their tasks."
                    bodyClassName="pt-3"
                    actions={
                        <label className="relative block w-64 max-w-full">
                            <span className="sr-only">Search users</span>
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email" className={searchInputStyles} />
                        </label>
                    }
                >
                    <div className="relative overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    <th scope="col" className="py-3 pl-5 pr-4">Name</th>
                                    <th scope="col" className="py-3 pr-4">Email</th>
                                    <th scope="col" className="py-3 pr-4">Status</th>
                                    <th scope="col" className="py-3 pr-4">Role</th>
                                    <th scope="col" className="py-3 pr-4 text-right">Tasks</th>
                                    <th scope="col" className="py-3 pr-5"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/70">
                                        <td className="py-3 pl-5 pr-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                                    u.is_admin ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"
                                                }`} aria-hidden="true">
                                                    {getInitials(u.name || u.email)}
                                                </span>
                                                <span className="font-medium text-slate-900">{u.name || "Unnamed user"}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-slate-600">{u.email}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                u.is_verified ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                            }`}>
                                                {u.is_verified ? "Verified" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                u.is_admin ? "bg-brand-50 text-brand-700 ring-brand-600/15" : "bg-slate-100 text-slate-700 ring-slate-500/20"
                                            }`}>
                                                {u.is_admin ? "Admin" : "User"}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-right tabular-nums text-slate-900">{u.task_count}</td>
                                        <td className="py-3 pr-5 text-right">
                                            {u.id === user.id ? (
                                                <span className="text-xs text-slate-400">You</span>
                                            ) : (
                                                <button type="button" onClick={() => { setDeleteError(""); setDeleting(u); }}
                                                    aria-label={`Delete ${u.name || u.email}`} className={buttonStyles.iconDanger}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No users match "{search}".</p>}
                    </div>
                </Card>

                <Card title="Recently created tasks" subtitle="Across all users" bodyClassName="px-5 pb-3 pt-2">
                    {stats.recent_tasks.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">No tasks yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {stats.recent_tasks.map((task) => (
                                <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <Link to={`/tasks/${task.id}`}
                                            className={`block truncate text-sm font-medium hover:text-brand-600 ${task.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                            {task.title}
                                        </Link>
                                        <p className="mt-0.5 truncate text-xs text-slate-500">{task.user_name} · {formatRelative(task.created_at)}</p>
                                    </div>
                                    <PriorityBadge priority={task.priority} compact />
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {deleting && (
                <ConfirmDialog
                    title={`Delete ${deleting.name || deleting.email}?`}
                    message="Their account and all of their tasks will be permanently deleted."
                    busy={deleteBusy}
                    error={deleteError}
                    confirmLabel="Delete user"
                    onConfirm={confirmDeleteUser}
                    onCancel={() => setDeleting(null)}
                />
            )}
        </div>
    );
}

export default AdminDashboard;
