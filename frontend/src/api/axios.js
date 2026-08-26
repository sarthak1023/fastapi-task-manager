import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
});

// Runs before every outgoing request — attaches the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// NEW: runs on every response — if the backend says 401, the token is invalid/expired
api.interceptors.response.use(
    (response) => response, // if the response is fine, just pass it through unchanged
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/login"; // hard redirect — see explanation below
        }

        return Promise.reject(error); // still let the original .catch() in the component run too
    }
);

export default api;