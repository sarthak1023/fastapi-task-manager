import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";

const COLLAPSE_KEY = "taskmaster.sidebarCollapsed";

function readCollapsed() {
    try {
        return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
        return false;   // storage blocked (e.g. private mode): start expanded
    }
}

// Shared frame for every logged-in page: sidebar, top bar, and the current page (<Outlet />)
function Layout() {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);

    function toggleCollapsed() {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
        } catch {
            // storage blocked: the choice just won't be remembered next visit
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar
                collapsed={collapsed}
                onToggleCollapse={toggleCollapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
                <Topbar onOpenMenu={() => setMobileOpen(true)} />
                <main className="px-4 py-6 lg:px-8">
                    {/* Pages rely on the profile (e.g. is_admin), so wait for /me before showing them */}
                    {user ? <Outlet /> : <p className="py-16 text-center text-sm text-slate-400">Loading...</p>}
                </main>
            </div>
        </div>
    );
}

export default Layout;
