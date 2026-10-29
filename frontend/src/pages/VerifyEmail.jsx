import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AuthCard from "../components/AuthCard";

// Same compact style as the Login / Signup inputs
const inputClass = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 " +
    "focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition";
const codeInputClass = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-xl text-center tracking-[0.5em] text-slate-900 bg-white " +
    "placeholder:text-slate-300 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition";

function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();

    // Signup / Login send us here with the email (and a message) in navigation state
    const [email, setEmail] = useState(location.state?.email || "");
    const [code, setCode] = useState("");
    const [message, setMessage] = useState(location.state?.message || "");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!email.trim() || !code.trim()) {
            setError("Please enter your email and the 6-digit code.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/verify-email", { email, code });
            navigate("/login", { state: { message: "Email verified. You can now log in." } });
        } catch (error) {
            setError(error.response?.data?.detail || "Verification failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResend() {
        setError("");
        setMessage("");

        if (!email.trim()) {
            setError("Enter your email first.");
            return;
        }

        setIsResending(true);
        try {
            const response = await api.post("/resend-verification", { email });
            setMessage(response.data.message);
        } catch (error) {
            setError(error.response?.data?.detail || "Could not resend the code.");
        } finally {
            setIsResending(false);
        }
    }

    return (
        <AuthCard variant="security" title="Verify your email" subtitle="Enter the 6-digit code we emailed you. It expires in 10 minutes.">
            <form onSubmit={handleSubmit} className="space-y-4">
                {message && <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>}
                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className={inputClass} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
                    <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456" className={codeInputClass} />
                </div>

                <button type="submit" disabled={isSubmitting}
                    className="w-full bg-brand-600 text-white py-2.5 text-sm rounded-lg font-semibold hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition shadow-lg shadow-brand-200">
                    {isSubmitting ? "Verifying..." : "Verify email"}
                </button>
            </form>

            <div className="flex justify-between text-sm mt-4">
                <button onClick={handleResend} disabled={isResending} className="text-brand-600 hover:underline disabled:opacity-50">
                    {isResending ? "Sending..." : "Resend code"}
                </button>
                <Link to="/login" className="text-slate-600 hover:underline">Back to login</Link>
            </div>
        </AuthCard>
    );
}

export default VerifyEmail;
