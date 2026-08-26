import { createContext, useContext, useState } from "react";

// The "box" that will hold our shared auth data
const AuthContext = createContext();

// Wraps the app and provides token + login/logout to everything inside it
export function AuthProvider({ children }) {
    // Initialize from localStorage so refreshing the page doesn't lose the logged-in state
    const [token, setToken] = useState(localStorage.getItem("access_token"));

    function login(newToken) {
        localStorage.setItem("access_token", newToken);
        setToken(newToken);
    }

    function logout() {
        localStorage.removeItem("access_token");
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Shortcut so components don't need useContext(AuthContext) every time
export function useAuth() {
    return useContext(AuthContext);
}