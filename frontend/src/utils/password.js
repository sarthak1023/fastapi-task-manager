// Same rules the backend enforces (backend/services/auth.py → PASSWORD_RULES)
export const PASSWORD_RULES = [
    { label: "8+ characters", test: (p) => p.length >= 8 },
    { label: "Uppercase (A-Z)", test: (p) => /[A-Z]/.test(p) },
    { label: "Lowercase (a-z)", test: (p) => /[a-z]/.test(p) },
    { label: "Number (0-9)", test: (p) => /\d/.test(p) },
    { label: "Special (!@#$)", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export function isStrongPassword(password) {
    return PASSWORD_RULES.every((rule) => rule.test(password));
}
