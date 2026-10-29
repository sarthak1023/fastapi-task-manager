import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function NotFound() {
    const { token } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4">
            <div className="text-center">
                <p className="text-8xl font-bold bg-gradient-to-br from-brand-700 to-sky-500 bg-clip-text text-transparent">404</p>
                <h1 className="mt-4 text-3xl font-bold text-slate-800">Page not found</h1>
                <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
                <Link
                    to={token ? "/dashboard" : "/login"}
                    className="inline-block mt-8 bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-700 transition shadow-lg shadow-brand-200"
                >
                    {token ? "Back to overview" : "Go to login"}
                </Link>
            </div>
        </div>
    );
}

export default NotFound;
