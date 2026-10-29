import { Check } from "lucide-react";
import { PASSWORD_RULES } from "../utils/password";

const STRENGTH = [
    { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
    { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
    { label: "Weak", bar: "bg-orange-500", text: "text-orange-600" },
    { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
    { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600" },
];

// Compact live checklist for a "new password" field: each rule chip turns green as it's met
function PasswordRequirements({ password }) {
    const results = PASSWORD_RULES.map((rule) => ({ label: rule.label, met: rule.test(password) }));
    const metCount = results.filter((r) => r.met).length;
    const strength = STRENGTH[metCount];

    return (
        <div aria-live="polite">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1 flex-1">
                    {PASSWORD_RULES.map((rule, i) => (
                        <div key={rule.label} className={`h-1.5 flex-1 rounded-full ${password && i < metCount ? strength.bar : "bg-slate-200"}`} />
                    ))}
                </div>
                <span className={`text-xs font-semibold w-16 text-right ${password ? strength.text : "text-slate-400"}`}>
                    {password ? strength.label : "Strength"}
                </span>
            </div>

            <ul className="flex flex-wrap gap-1.5" aria-label="Password requirements">
                {results.map(({ label, met }) => (
                    <li key={label}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition ${
                            met ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                        }`}>
                        {met && <Check size={12} strokeWidth={3} />}
                        {label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PasswordRequirements;
