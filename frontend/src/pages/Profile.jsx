import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Shield, Trash2, UserRound } from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import EditProfileCard from "../components/EditProfileCard";
import ChangePasswordCard from "../components/ChangePasswordCard";
import { alertStyles, buttonStyles, inputStyles, labelStyles } from "../components/ui/styles";
import { getInitials } from "../utils/user";

const COUNTDOWN_SECONDS = 10;

function Profile() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const isAdmin = user.is_admin;

    // Delete own account: password, then a confirmation dialog whose button unlocks after a countdown
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

    useEffect(() => {
        if (!showDeleteDialog || secondsLeft === 0) return undefined;
        const timer = setInterval(() => setSecondsLeft((seconds) => Math.max(seconds - 1, 0)), 1000);
        return () => clearInterval(timer);
    }, [showDeleteDialog, secondsLeft]);

    function openDeleteDialog() {
        setDeleteError("");
        if (!deletePassword.trim()) {
            setDeleteError("Please enter your password.");
            return;
        }
        setSecondsLeft(COUNTDOWN_SECONDS);
        setShowDeleteDialog(true);
    }

    function cancelDelete() {
        if (isDeleting) return;
        setShowDeleteDialog(false);
        setDeletePassword("");
    }

    async function deleteAccount() {
        setIsDeleting(true);
        try {
            await api.delete("/account", { data: { password: deletePassword } });
            logout();
            navigate("/login", { state: { message: "Your account and all of your tasks have been permanently deleted." } });
        } catch (err) {
            setShowDeleteDialog(false);
            setDeleteError(err.response?.data?.detail || "Failed to delete your account.");
            setIsDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Profile" subtitle="Manage your personal details, password and account." />

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <Card bodyClassName="">
                    {/* Cover banner in the brand colours, with the avatar overlapping its bottom edge */}
                    <div className="h-24 rounded-t-xl bg-gradient-to-r from-slate-900 via-brand-900 to-brand-600" aria-hidden="true" />
                    <div className="px-6 pb-6">
                    <div className="-mt-10 flex flex-col items-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white shadow-sm ring-4 ring-white">
                            {getInitials(user.name || user.email)}
                        </div>
                        <h2 className="mt-3 text-lg font-semibold text-slate-900">{user.name || "Unnamed user"}</h2>
                        <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            isAdmin ? "bg-brand-50 text-brand-700 ring-brand-600/15" : "bg-slate-100 text-slate-700 ring-slate-500/20"
                        }`}>
                            {isAdmin ? <Shield size={12} /> : <UserRound size={12} />} {isAdmin ? "Administrator" : "User"}
                        </span>
                    </div>
                    <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Mail size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                            <dt className="sr-only">Email</dt>
                            <dd className="truncate">{user.email}</dd>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <UserRound size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                            <dt className="sr-only">Account ID</dt>
                            <dd>Account #{user.id}</dd>
                        </div>
                    </dl>
                    </div>
                </Card>

                <div className="space-y-6 lg:col-span-2">
                    <EditProfileCard />
                    <ChangePasswordCard />

                    {isAdmin ? (
                        <Card title="Administration" subtitle="Manage users and see activity across TaskMaster.">
                            <Link to="/admin" className={buttonStyles.primary}>
                                <Shield size={16} /> Open admin console
                            </Link>
                        </Card>
                    ) : (
                        <Card title="Delete account" subtitle="Permanently remove your profile and all of your tasks. This cannot be undone.">
                            {deleteError && <p className={`${alertStyles.error} mb-4`}>{deleteError}</p>}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                    <label htmlFor="delete-password" className={labelStyles}>Confirm with your password</label>
                                    <input id="delete-password" type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)}
                                        autoComplete="current-password" className={inputStyles} />
                                </div>
                                <button type="button" onClick={openDeleteDialog} className={buttonStyles.danger}>
                                    <Trash2 size={16} /> Delete account
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {showDeleteDialog && (
                <Modal
                    title="Permanently delete your account?"
                    description="Your account and all of your tasks will be deleted. You won't be able to recover them."
                    size="sm"
                    onClose={cancelDelete}
                    footer={
                        <>
                            <button type="button" data-autofocus onClick={cancelDelete} disabled={isDeleting} className={buttonStyles.secondary}>Cancel</button>
                            <button type="button" onClick={deleteAccount} disabled={secondsLeft > 0 || isDeleting} className={buttonStyles.danger}>
                                {isDeleting ? "Deleting..." : secondsLeft > 0 ? `Delete account (${secondsLeft}s)` : "Delete account"}
                            </button>
                        </>
                    }
                />
            )}
        </div>
    );
}

export default Profile;
