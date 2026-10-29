import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

// Runs before every outgoing request — attaches the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Runs on every response — if the backend says 401, the token is invalid/expired
api.interceptors.response.use(
    (response) => response, // if the response is fine, just pass it through unchanged
    (error) => {
        // A 401 from these endpoints means "wrong password", not "session expired",
        // so let the page show its own error message instead of redirecting
        const passwordCheckUrls = ["/login", "/account"];
        const isPasswordCheck = passwordCheckUrls.includes(error.config?.url);

        if (error.response && error.response.status === 401 && !isPasswordCheck) {
            localStorage.removeItem("access_token");
            window.location.href = "/login"; // full reload so all in-memory state is cleared too
        }

        return Promise.reject(error); // still let the original .catch() in the component run too
    }
);

export default api;