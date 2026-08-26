import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // NEW

function ProtectedRoute({ children }) {
    const { token } = useAuth(); // CHANGED: from localStorage.getItem to context

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;