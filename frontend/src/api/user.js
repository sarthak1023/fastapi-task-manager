import api from "./axios";

// Every call to backend/routers/user.py lives here.
// Each function is named after the backend function it hits (camelCase of the Python name).

// ---------- Signup & email verification ----------

// POST /signup  →  user.py signup()
export function signup({ name, email, password }) {
    return api.post("/signup", { name, email, password });
}

// POST /verify-email  →  user.py verify_email()
export function verifyEmail({ email, code }) {
    return api.post("/verify-email", { email, code });
}

// POST /resend-verification  →  user.py resend_verification()
export function resendVerification(email) {
    return api.post("/resend-verification", { email });
}

// ---------- Login & password reset ----------

// POST /login  →  user.py login()
// OAuth2 expects form data (not JSON), and names the email field "username"
export function login({ email, password }) {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    return api.post("/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
}

// POST /forgot-password  →  user.py forgot_password()
export function forgotPassword(email) {
    return api.post("/forgot-password", { email });
}

// POST /reset-password  →  user.py reset_password()
export function resetPassword({ email, code, newPassword }) {
    return api.post("/reset-password", { email, code, new_password: newPassword });
}

// ---------- My profile (needs the token) ----------

// GET /me  →  user.py get_profile()
export function getProfile() {
    return api.get("/me");
}

// PUT /me  →  user.py update_profile()
export function updateProfile(name) {
    return api.put("/me", { name });
}

// POST /me/change-password  →  user.py change_password()
export function changePassword({ currentPassword, newPassword }) {
    return api.post("/me/change-password", { current_password: currentPassword, new_password: newPassword });
}

// DELETE /account  →  user.py delete_account()
// axios sends a DELETE body through the `data` option
export function deleteAccount(password) {
    return api.delete("/account", { data: { password } });
}

// ---------- Admin only ----------

// DELETE /users/{email}  →  user.py delete_user()
export function deleteUser(email) {
    return api.delete(`/users/${encodeURIComponent(email)}`);
}
