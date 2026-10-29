import { NavLink } from "react-router-dom";
import { CalendarDays, CheckSquare, ChevronsLeft, ChevronsRight, LayoutDashboard, ListTodo, Shield, UserRound } from "lucide-react";
import { useAuth } from "../../context/useAuth";

const WORKSPACE_LINKS = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tasks", label: "Tasks", icon: ListTodo },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
];
const ADMIN_LINK = { to: "/admin", label: "Admin Console", icon: Shield };
const PROFILE_LINK = { to: "/profile", label: "Profile", icon: UserRound };

// Dark navy navigation. On large screens it can collapse to icons only;
// on small screens it slides in over the page when the menu button is pressed.
function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
    const { user } = useAuth();
    const sections = [
        { title: "Workspace", links: WORKSPACE_LINKS },
        { title: "Account", links: [...(user?.is_admin ? [ADMIN_LINK] : []), PROFILE_LINK] },
    ];
    const hideWhenCollapsed = collapsed ? "lg:hidden" : "";

    return (
        <>
            {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 transition-[width,transform] duration-200
                    ${collapsed ? "lg:w-[72px]" : "lg:w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            >
                <div className={`flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 px-5 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
                    <div className="rounded-lg bg-brand-600 p-1.5 shadow-sm shadow-brand-950/50">
                        <CheckSquare size={18} className="text-white" />
                    </div>
                    <span className={`text-lg font-semibold tracking-tight text-white ${hideWhenCollapsed}`}>TaskMaster</span>
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <p className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${hideWhenCollapsed}`}>
                                {section.title}
                            </p>
                            <div className="space-y-1">
                                {section.links.map(({ to, label, icon: Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        onClick={onCloseMobile}
                                        title={collapsed ? label : undefined}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${collapsed ? "lg:justify-center lg:px-0" : ""} ${
                                                isActive ? "bg-brand-600 text-white shadow-sm shadow-brand-950/40" : "text-slate-300 hover:bg-white/5 hover:text-white"
                                            }`
                                        }
                                    >
                                        <Icon size={18} className="shrink-0" />
                                        <span className={hideWhenCollapsed}>{label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="hidden shrink-0 border-t border-white/10 p-3 lg:block">
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : "px-3"}`}
                    >
                        {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} /> Collapse</>}
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
