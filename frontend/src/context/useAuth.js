import { createContext, useContext } from "react";

// The "box" that holds the shared auth data. Filled in by <AuthProvider> (AuthContext.jsx).
// Kept in its own file so AuthContext.jsx only exports a component (needed for React fast refresh).
export const AuthContext = createContext();

// Shortcut so components don't need useContext(AuthContext) every time
export function useAuth() {
    return useContext(AuthContext);
}
