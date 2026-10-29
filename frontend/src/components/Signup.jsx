import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import api from "../api/axios";
import AuthCard from "./AuthCard";
import PasswordRequirements from "./PasswordRequirements";
import { isStrongPassword } from "../utils/password";

const inputClass = "w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 " +
    "focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition";

function Signup() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (!email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }
        if (!isStrongPassword(password)) {
            setError("Your password doesn't meet all the requirements below.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/signup", { name: name.trim(), email, password });
            navigate("/verify-email", { state: { email, message: `Account created. We sent a 6-digit code to ${email}.` } });
        } catch (error) {
            console.error("Signup failed:", error);
            setError(error.response?.data?.detail
                ? (typeof error.response.data.detail === "string" ? error.response.data.detail : "Please check your details and try again.")
                : "Can't reach the server. Please check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthCard variant="signup" wide title="Create your account" subtitle="Join TaskMaster and start planning your work today.">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {error && (
                    <div role="alert" className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{error}</span>
                    </div>
                )}

                {/* Two columns on wider screens so the whole form fits without scrolling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="name" type="text" autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="Your name" className={inputClass} />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com" className={inputClass} />
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className={`${inputClass} pr-11`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className={inputClass} />
                    </div>
                    {confirmPassword && (
                        <p className={`flex items-center gap-1.5 text-xs mt-1.5 ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}>
                            {passwordsMatch ? <><CheckCircle2 size={14} /> Passwords match</> : <><AlertCircle size={14} /> Passwords don't match</>}
                        </p>
                    )}
                </div>
                </div>

                <PasswordRequirements password={password} />

                <button type="submit" disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 text-sm rounded-lg font-semibold hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition shadow-lg shadow-brand-200">
                    {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : <>Create account <ArrowRight size={18} /></>}
                </button>
            </form>

            <p className="text-sm text-slate-600 mt-6 text-center">
                Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">Log in</Link>
            </p>
        </AuthCard>
    );
}

export default Signup;
