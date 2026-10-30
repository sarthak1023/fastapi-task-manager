import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as userApi from "../api/user";
import AuthCard from "../components/AuthCard";
import PasswordRequirements from "../components/PasswordRequirements";
import { isStrongPassword } from "../utils/password";

// Same compact style as the Login / Signup inputs and button
const inputClass = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 " +
    "focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition";
const codeInputClass = "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-xl text-center tracking-[0.5em] text-slate-900 bg-white " +
    "placeholder:text-slate-300 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition";
const buttonClass = "w-full bg-brand-600 text-white py-2.5 text-sm rounded-lg font-semibold hover:bg-brand-700 " +
    "disabled:bg-brand-400 disabled:cursor-not-allowed transition shadow-lg shadow-brand-200";

function ForgotPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // Step 1: "email" (ask for a code). Step 2: "reset" (enter code + new password)
    const [step, setStep] = useState("email");
    // Pre-filled when coming from the Profile page's "Forgot your current password?" link
    const [email, setEmail] = useState(location.state?.email || "");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function requestCode(e) {
        e?.preventDefault();
        setError("");
        setMessage("");

        if (!email.includes("@")) {
            setError("Please enter a valid email.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await userApi.forgotPassword(email);
            setMessage(response.data.message);
            setStep("reset");
        } catch (error) {
            setError(error.response?.data?.detail || "Could not send the reset code.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resetPassword(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        if (!isStrongPassword(newPassword)) {
            setError("Your new password doesn't meet all the requirements.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            await userApi.resetPassword({ email, code, newPassword });
            navigate("/login", { state: { message: "Password reset. You can now log in with your new password." } });
        } catch (error) {
            setError(error.response?.data?.detail || "Could not reset your password.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthCard
            variant="security"
            title="Reset your password"
            subtitle={step === "email" ? "Enter your account email and we'll send you a 6-digit reset code." : `Enter the code sent to ${email} and choose a new password.`}
        >
            {message && <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">{message}</p>}
            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

            {step === "email" ? (
                <form onSubmit={requestCode} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className={inputClass} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className={buttonClass}>
                        {isSubmitting ? "Sending..." : "Send reset code"}
                    </button>
                </form>
            ) : (
                <form onSubmit={resetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reset code</label>
                        <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="123456" className={codeInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter a new password" className={inputClass} />
                        <div className="mt-2"><PasswordRequirements password={newPassword} /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm the new password" className={inputClass} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className={buttonClass}>
                        {isSubmitting ? "Resetting..." : "Reset password"}
                    </button>
                    <button type="button" onClick={requestCode} disabled={isSubmitting} className="w-full text-sm text-brand-600 hover:underline disabled:opacity-50">
                        Didn't get it? Send a new code
                    </button>
                </form>
            )}

            <p className="text-sm text-slate-600 mt-4 text-center">
                Remembered it? <Link to="/login" className="text-brand-600 hover:underline">Back to login</Link>
            </p>
        </AuthCard>
    );
}

export default ForgotPassword;
