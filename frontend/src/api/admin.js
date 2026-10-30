import api from "./axios";

// Every call to backend/routers/admin.py lives here (admin only).

// GET /admin/stats  →  admin.py get_admin_stats()
export function getAdminStats() {
    return api.get("/admin/stats");
}
