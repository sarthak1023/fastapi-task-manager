import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

const TONES = { good: "text-emerald-700", bad: "text-red-600", neutral: "text-slate-500" };

// Tinted tile behind each KPI's icon, so the cards are easy to tell apart at a glance
const ACCENTS = {
    brand: "bg-brand-50 text-brand-600 ring-brand-600/10",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-600/10",
    amber: "bg-amber-50 text-amber-600 ring-amber-600/15",
    red: "bg-red-50 text-red-600 ring-red-600/10",
    slate: "bg-slate-100 text-slate-500 ring-slate-500/10",
};

// One KPI tile: a label, a big value, an optional coloured icon, and one line underneath - a change or a hint.
//   change = { value: 3, label: "vs last year", upIsGood: true | false | null }  (null = neither good nor bad)
//   hint   = { text: "4 due this week", tone: "neutral" | "good" | "bad", icon: LucideIcon }
//   accent = "brand" | "green" | "amber" | "red" | "slate" (colour of the icon tile)
function StatCard({ label, value, change, hint, icon: Icon, accent = "brand" }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
                </div>
                {Icon && (
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${ACCENTS[accent] || ACCENTS.brand}`}>
                        <Icon size={20} aria-hidden="true" />
                    </span>
                )}
            </div>
            {change ? <ChangeLine {...change} /> : hint && <HintLine {...hint} />}
        </div>
    );
}

function ChangeLine({ value, label, upIsGood }) {
    const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
    let tone = "neutral";
    if (value !== 0 && upIsGood !== null && upIsGood !== undefined) {
        tone = (value > 0) === upIsGood ? "good" : "bad";
    }

    return (
        <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${TONES[tone]}`}>
            <Icon size={14} aria-hidden="true" />
            {value === 0 ? `No change ${label}` : `${value > 0 ? "+" : ""}${value} ${label}`}
        </p>
    );
}

function HintLine({ text, tone = "neutral", icon: Icon }) {
    return (
        <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${TONES[tone]}`}>
            {Icon && <Icon size={14} aria-hidden="true" />}
            {text}
        </p>
    );
}

export default StatCard;
