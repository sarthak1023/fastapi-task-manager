import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import Card from "./ui/Card";
import PasswordRequirements from "./PasswordRequirements";
import { alertStyles, buttonStyles, inputStyles, labelStyles } from "./ui/styles";
import { isStrongPassword } from "../utils/password";

function ChangePasswordCard() {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (!isStrongPassword(newPassword)) {
            setError("Your new password doesn't meet all the requirements.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsSaving(true);
        try {
            await api.post("/me/change-password", { current_password: currentPassword, new_password: newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setMessage("Password changed. Use your new password next time you sign in.");
        } catch (err) {
            setError(err.response?.data?.detail || "Couldn't change your password.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card title="Change password" subtitle="Enter your current password, then choose a new one.">
            <form onSubmit={handleSubmit} className="space-y-4">
                {message && <p className={alertStyles.success}>{message}</p>}
                {error && <p className={alertStyles.error}>{error}</p>}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label htmlFor="current-password" className={labelStyles}>Current password</label>
                        <input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)}
                            autoComplete="current-password" className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="new-password" className={labelStyles}>New password</label>
                        <input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)}
                            autoComplete="new-password" className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className={labelStyles}>Confirm new password</label>
                        <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
                            autoComplete="new-password" className={inputStyles} />
                    </div>
                </div>

                {newPassword && <PasswordRequirements password={newPassword} />}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* For users who don't remember their current password: reset it with an emailed code instead */}
                    <Link to="/forgot-password" state={{ email: user.email }} className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
                        Forgot your current password?
                    </Link>
                    <button type="submit" disabled={isSaving} className={buttonStyles.primary}>
                        {isSaving ? "Updating..." : "Update password"}
                    </button>
                </div>
            </form>
        </Card>
    );
}

export default ChangePasswordCard;
