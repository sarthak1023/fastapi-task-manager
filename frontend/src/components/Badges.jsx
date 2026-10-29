const BADGE = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

const PRIORITY_STYLES = {
    high: "bg-red-50 text-red-700 ring-red-600/15",
    medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
    low: "bg-slate-100 text-slate-700 ring-slate-500/20",   // neutral: green is kept for "Completed" only
};

// "High priority" (or just "High" when compact, e.g. inside a table's Priority column)
export function PriorityBadge({ priority = "medium", compact = false }) {
    const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
    return <span className={`${BADGE} capitalize ${style}`}>{compact ? priority : `${priority} priority`}</span>;
}

export function StatusBadge({ completed, overdue = false }) {
    if (completed) {
        return <span className={`${BADGE} bg-emerald-50 text-emerald-700 ring-emerald-600/15`}>Completed</span>;
    }
    if (overdue) {
        return <span className={`${BADGE} bg-red-50 text-red-700 ring-red-600/15`}>Overdue</span>;
    }
    return <span className={`${BADGE} bg-brand-50 text-brand-700 ring-brand-600/15`}>Active</span>;
}
