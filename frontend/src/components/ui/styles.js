// Shared Tailwind class strings so buttons, inputs and alerts look the same on every page

export const buttonStyles = {
    primary: "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400",
    secondary: "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
    small: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40",
    danger: "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400",
    dangerOutline: "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50",
    icon: "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700",
    iconDanger: "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600",
};

export const inputStyles = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

// Same as inputStyles but with room on the left for a search icon
export const searchInputStyles = "w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

export const selectStyles = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

export const labelStyles = "mb-1.5 block text-sm font-medium text-slate-700";

export const alertStyles = {
    error: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
    success: "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700",
};
