import { useState } from "react";
import { useAuth } from "../context/useAuth";
import * as userApi from "../api/user";
import Card from "./ui/Card";
import { alertStyles, buttonStyles, inputStyles, labelStyles } from "./ui/styles";

function EditProfileCard() {
    const { user, setUser } = useAuth();
    const [name, setName] = useState(user.name || "");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const unchanged = name.trim() === (user.name || "");

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!name.trim()) {
            setError("Name cannot be empty.");
            return;
        }

        setIsSaving(true);
        try {
            const response = await userApi.updateProfile(name.trim());
            setUser(response.data);          // the top bar, dashboard greeting, etc. update immediately
            setName(response.data.name);
            setMessage("Profile updated.");
        } catch (err) {
            setError(err.response?.status === 422 ? "Name must be 1 to 50 characters." : err.response?.data?.detail || "Couldn't update your profile.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card title="Personal details" subtitle="Update how your name appears across TaskMaster.">
            <form onSubmit={handleSubmit} className="space-y-4">
                {message && <p className={alertStyles.success}>{message}</p>}
                {error && <p className={alertStyles.error}>{error}</p>}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="profile-name" className={labelStyles}>Full name</label>
                        <input id="profile-name" type="text" value={name} maxLength={50} onChange={(event) => setName(event.target.value)} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="profile-email" className={labelStyles}>Email address</label>
                        <input id="profile-email" type="email" value={user.email} disabled className={inputStyles} />
                        <p className="mt-1 text-xs text-slate-400">Your email is used to sign in and can't be changed.</p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isSaving || unchanged} className={buttonStyles.primary}>
                        {isSaving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </Card>
    );
}

export default EditProfileCard;
