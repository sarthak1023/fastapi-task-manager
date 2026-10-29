// The API stores and returns times in UTC, but without a timezone marker
// (e.g. "2026-10-26T09:30:00"). JavaScript would read that as *local* time,
// so add the missing "Z" (= UTC) before parsing.
export function parseApiDate(value) {
    if (!value) return null;
    const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
    return new Date(hasTimezone ? value : `${value}Z`);
}

// "26/10/2026, 3:00:00 pm" in the viewer's own timezone
export function formatApiDate(value) {
    const date = parseApiDate(value);
    return date ? date.toLocaleString() : "";
}

// "Wed, 7 Oct 2026, 4:45 pm" in the viewer's own timezone
export function formatDateTime(value) {
    const date = parseApiDate(value);
    if (!date) return "";
    return date.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// <input type="datetime-local"> needs local time as "YYYY-MM-DDTHH:mm"
export function toLocalInputValue(value) {
    const date = parseApiDate(value);
    if (!date) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

// "now", "12 minutes ago", "in 3 hours", "yesterday" - or a short date once it's over a week away
export function formatRelative(value, now = Date.now()) {
    const date = parseApiDate(value);
    if (!date) return "";
    const seconds = Math.round((date.getTime() - now) / 1000);
    const abs = Math.abs(seconds);
    if (abs < 60) return relativeTime.format(0, "second");
    if (abs < 3600) return relativeTime.format(Math.round(seconds / 60), "minute");
    if (abs < 86400) return relativeTime.format(Math.round(seconds / 3600), "hour");
    if (abs < 7 * 86400) return relativeTime.format(Math.round(seconds / 86400), "day");
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// "Today, 3:00 pm", "Tomorrow, 9:30 am", "Yesterday, 5:00 pm" or "Mon, 2 Nov, 3:00 pm"
export function formatDue(value) {
    const date = parseApiDate(value);
    if (!date) return "";
    const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const today = new Date();
    const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOf(date) - startOf(today)) / 86400000);
    if (days === 0) return `Today, ${time}`;
    if (days === 1) return `Tomorrow, ${time}`;
    if (days === -1) return `Yesterday, ${time}`;
    const sameYear = date.getFullYear() === today.getFullYear();
    const day = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
    return `${day}, ${time}`;
}

// Open task whose due time has already passed
export function isOverdue(task, now = Date.now()) {
    return !task.completed && Boolean(task.due_at) && parseApiDate(task.due_at).getTime() < now;
}
