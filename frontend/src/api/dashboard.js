import api from "./axios";

// Every call to backend/routers/dashboard.py lives here.

// GET /dashboard  →  dashboard.py get_dashboard()
// params: { year, quarter?, month?, tz }
export function getDashboard(params) {
    return api.get("/dashboard", { params });
}
