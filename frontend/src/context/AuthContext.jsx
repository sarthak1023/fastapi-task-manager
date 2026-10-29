import { useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./useAuth";

// Wraps the app and provides token + user + login/logout to everything inside it
export function AuthProvider({ children }) {
    // Initialize from localStorage so refreshing the page doesn't lose the logged-in state
    const [token, setToken] = useState(localStorage.getItem("access_token"));
    // Profile from GET /me: { name, email, is_admin }. Shared so every page knows who is logged in.
    const [user, setUser] = useState(null);

    // Whenever we get a token (login or page refresh), load the profile once
    useEffect(() => {
        if (!token) return;
        api.get("/me")
            .then((response) => setUser(response.data))
            .catch((error) => console.error("Error fetching profile:", error));
    }, [token]);

    function login(newToken) {
        localStorage.setItem("access_token", newToken);
        setToken(newToken);
    }

    function logout() {
        localStorage.removeItem("access_token");
        setToken(null);
        setUser(null);
    }

    return (
        // setUser lets pages update the shared profile after an edit (e.g. a new name shows everywhere at once)
        <AuthContext.Provider value={{ token, user, setUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
