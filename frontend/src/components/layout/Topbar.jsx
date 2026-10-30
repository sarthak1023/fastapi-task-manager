import { useEffect, useRef, useState } from "react";
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Search, UserRound } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import * as tasksApi from "../../api/tasks";
import { formatDue } from "../../utils/dates";
import { getInitials } from "../../utils/user";

// Title shown in the top bar for each page (first match wins)
const PAGES = [
    { pattern: "/dashboard", title: "Dashboard" },
    { pattern: "/tasks/:id", title: "Task details", parent: { to: "/tasks", label: "Tasks" } },
    { pattern: "/tasks", title: "Tasks" },
    { pattern: "/calendar", title: "Calendar" },
    { pattern: "/profile", title: "Profile" },
    { pattern: "/admin", title: "Admin Console" },
];

// Close a dropdown when the user clicks anywhere outside it
function useClickOutside(ref, onOutside, enabled) {
    useEffect(() => {
        if (!enabled) return undefined;
        function handleMouseDown(event) {
            if (ref.current && !ref.current.contains(event.target)) onOutside();
        }
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [ref, onOutside, enabled]);
}

function Topbar({ onOpenMenu }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [query, setQuery] = useState("");

    const page = PAGES.find((p) => matchPath(p.pattern, location.pathname)) || { title: "" };

    function handleSearch(event) {
        event.preventDefault();
        const term = query.trim();
        navigate(term ? `/tasks?q=${encodeURIComponent(term)}` : "/tasks");
    }

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
            <button type="button" onClick={onOpenMenu} aria-label="Open menu"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden">
                <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
                {page.parent ? (
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
                        <Link to={page.parent.to} className="text-slate-500 hover:text-slate-700">{page.parent.label}</Link>
                        <span className="text-slate-300" aria-hidden="true">/</span>
                        <span className="truncate font-semibold text-slate-900">{page.title}</span>
                    </nav>
                ) : (
                    <p className="truncate text-sm font-semibold text-slate-900">{page.title}</p>
                )}
            </div>

            <form onSubmit={handleSearch} role="search" className="hidden w-full max-w-sm md:block">
                <label className="relative block">
                    <span className="sr-only">Search tasks</span>
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={user?.is_admin ? "Search tasks or people..." : "Search tasks..."}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
                    />
                </label>
            </form>

            <NotificationsMenu />

            {user && (
                <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 sm:flex">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Signed in as</span>
                    <span className="text-sm font-semibold text-slate-800">{user.is_admin ? "Admin" : "User"}</span>
                </div>
            )}

            <UserMenu user={user} onLogout={handleLogout} />
        </header>
    );
}

// Bell with a red dot when high/medium tasks are due within the hour; click to see them
function NotificationsMenu() {
    const [open, setOpen] = useState(false);
    const [reminders, setReminders] = useState([]);
    const ref = useRef(null);
    useClickOutside(ref, () => setOpen(false), open);

    useEffect(() => {
        let mounted = true;
        async function loadReminders() {
            try {
                const response = await tasksApi.getTaskReminders();
                if (mounted) setReminders(response.data);
            } catch (error) {
                console.error("Error fetching reminders:", error);
            }
        }
        loadReminders();
        const timer = setInterval(loadReminders, 60000);
        return () => {
            mounted = false;
            clearInterval(timer);
        };
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-label={reminders.length ? `Notifications: ${reminders.length} due within the hour` : "Notifications"}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
                <Bell size={20} />
                {reminders.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>

            {open && (
                <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">Due within the hour</p>
                        <p className="text-xs text-slate-500">Your high and medium priority tasks</p>
                    </div>
                    {reminders.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-500">You're all caught up. Nothing is due in the next hour.</p>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto py-1">
                            {reminders.map((task) => (
                                <li key={task.id}>
                                    <Link to={`/tasks/${task.id}`} onClick={() => setOpen(false)} className="block px-4 py-2.5 hover:bg-slate-50">
                                        <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                                        <p className="mt-0.5 text-xs capitalize text-slate-500">{formatDue(task.due_at)} · {task.priority} priority</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

// Avatar with the user's initials; opens a small menu with Profile and Log out
function UserMenu({ user, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useClickOutside(ref, () => setOpen(false), open);

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Account menu"
                className="rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                    {getInitials(user?.name || user?.email)}
                </span>
            </button>

            {open && (
                <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{user?.name || "Your account"}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <UserRound size={16} /> Profile
                    </Link>
                    <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={16} /> Log out
                    </button>
                </div>
            )}
        </div>
    );
}

export default Topbar;
