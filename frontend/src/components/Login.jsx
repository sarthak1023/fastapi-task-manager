import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import AuthCard from "./AuthCard";

const inputClass = "w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 " +
    "focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const successMessage = location.state?.message;

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);

        try {
            // The backend uses OAuth2's form format, which names the email field "username"
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await api.post("/login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            login(response.data.access_token);
            navigate("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);
            // 403 = correct password but the email hasn't been verified yet
            if (error.response?.status === 403) {
                navigate("/verify-email", { state: { email, message: "Please verify your email first. Enter the code we sent you, or request a new one." } });
                return;
            }
            setError(error.response ? "Invalid email or password." : "Can't reach the server. Please check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthCard title="Sign in" subtitle="Welcome back. Enter your credentials to continue.">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {successMessage && (
                    <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div role="alert" className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{error}</span>
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                        <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className={`${inputClass} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 text-sm rounded-lg font-semibold hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition shadow-lg shadow-brand-200"
                >
                    {isSubmitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                    ) : (
                        <>Sign in <ArrowRight size={16} /></>
                    )}
                </button>
            </form>

            <div className="flex items-center gap-4 my-7">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-medium tracking-wider uppercase text-slate-400">New to TaskMaster?</span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            <Link
                to="/signup"
                className="block w-full text-center bg-white border border-slate-200 text-slate-700 text-sm py-2.5 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
            >
                Create an account
            </Link>
        </AuthCard>
    );
}

export default Login;
