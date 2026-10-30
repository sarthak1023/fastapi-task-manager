import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, CalendarClock, Check, CircleCheck, CircleDashed, Clock, Inbox, ListPlus, Plus, Target, TriangleAlert } from "lucide-react";
import { useAuth } from "../context/useAuth";
import * as dashboardApi from "../api/dashboard";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import ChartLegend from "../components/charts/ChartLegend";
import ChartTable from "../components/charts/ChartTable";
import { PriorityBadge } from "../components/Badges";
import { alertStyles } from "../components/ui/styles";
import { formatDue, formatRelative, parseApiDate } from "../utils/dates";

const PRIORITY_LABELS = { high: "High", medium: "Medium", low: "Low" };
const CHART_HEIGHT = 260;

// Chart colours: brand blue (brand-600) for tasks added, green for tasks completed - the same
// green as the "Completed" badge. Checked with the colour-blind safety validator on the white cards.
const ACTIVITY_SERIES = [
    { key: "added", label: "Added", color: "#2563eb" },
    { key: "completed", label: "Completed", color: "#059669" },
];
const BAR_COLOR = "#2563eb";

function Dashboard() {
    const { user } = useAuth();
    const [today] = useState(() => new Date());
    const year = today.getFullYear();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [activityView, setActivityView] = useState("chart");
    const [priorityView, setPriorityView] = useState("chart");

    useEffect(() => {
        let active = true;
        // Send the browser's timezone so "today" and month boundaries match the user's clock
        const params = { year, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };

        dashboardApi.getDashboard(params)
            .then((response) => {
                if (!active) return;
                setData(response.data);
                setError("");
            })
            .catch((err) => {
                if (!active) return;
                console.error("Error loading dashboard:", err);
                setError("Couldn't load your dashboard. Please refresh the page.");
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [year]);

    const firstName = (user.name || "").trim().split(/\s+/)[0] || "there";

    return (
        <div className="space-y-6">
            {/* Greeting + the period shown (the first two KPIs and both charts cover the full year) */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Welcome back, {firstName}</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {user.is_admin ? "Here's what's happening across TaskMaster." : "Here's what's happening with your tasks."}
                    </p>
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                    <span className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm">Full Year</span>
                </div>
            </div>

            {error && <p className={alertStyles.error}>{error}</p>}

            {!data ? (
                !error && <p className="py-16 text-center text-sm text-slate-400">Loading your dashboard...</p>
            ) : (
                <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
                    <KpiRow data={data} />

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <Card
                            className="xl:col-span-2"
                            title={`Task activity · ${data.period.label}`}
                            subtitle="Tasks added and completed"
                            actions={
                                <>
                                    <ChartLegend series={ACTIVITY_SERIES} />
                                    <ViewToggle value={activityView} onChange={setActivityView} label="Task activity" />
                                </>
                            }
                        >
                            {activityView === "chart" ? (
                                <LineChart
                                    data={data.series}
                                    series={ACTIVITY_SERIES}
                                    height={CHART_HEIGHT}
                                    ariaLabel={`Tasks added and completed, ${data.period.label}. Use the left and right arrow keys to read each point, or switch to the table view.`}
                                />
                            ) : (
                                <ChartTable
                                    height={CHART_HEIGHT}
                                    columns={[
                                        { key: "full_label", label: "Period" },
                                        { key: "added", label: "Added", numeric: true },
                                        { key: "completed", label: "Completed", numeric: true },
                                    ]}
                                    rows={data.series.filter((point) => point.added !== null)}
                                />
                            )}
                        </Card>

                        <Card
                            className="flex flex-col"
                            bodyClassName="flex flex-1 flex-col justify-center p-5"
                            title={`Tasks added by priority · ${data.period.label}`}
                            subtitle="New tasks in this period"
                            actions={<ViewToggle value={priorityView} onChange={setPriorityView} label="Tasks by priority" />}
                        >
                            {priorityView === "chart" ? (
                                <BarChart data={data.by_priority.map((row) => ({ label: PRIORITY_LABELS[row.priority], value: row.count }))} color={BAR_COLOR} />
                            ) : (
                                <ChartTable
                                    columns={[{ key: "label", label: "Priority" }, { key: "value", label: "Tasks", numeric: true }]}
                                    rows={data.by_priority.map((row) => ({ label: PRIORITY_LABELS[row.priority], value: row.count }))}
                                />
                            )}
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <UpcomingCard tasks={data.upcoming} showOwner={user.is_admin} />
                        <ActivityCard events={data.activity} showOwner={user.is_admin} />
                        <HealthCard health={data.health} />
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiRow({ data }) {
    const { kpis, period } = data;
    const compare = `vs ${period.compare_label}`;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Tasks added" value={kpis.added} icon={ListPlus} accent="brand"
                change={{ value: kpis.added_change, label: compare, upIsGood: null }} />
            <StatCard label="Tasks completed" value={kpis.completed} icon={CircleCheck} accent="green"
                change={{ value: kpis.completed_change, label: compare, upIsGood: true }} />
            <StatCard label="Open tasks" value={kpis.open} icon={Clock} accent="amber"
                hint={{ text: `${kpis.due_next_7_days} due in the next 7 days`, icon: CalendarClock }} />
            <StatCard
                label="Overdue"
                value={kpis.overdue}
                icon={TriangleAlert}
                accent={kpis.overdue > 0 ? "red" : "slate"}
                hint={kpis.overdue > 0
                    ? { text: "Past their due date", tone: "bad", icon: TriangleAlert }
                    : { text: "Nothing overdue", tone: "good", icon: CircleCheck }}
            />
            <StatCard label="Completion rate" value={`${kpis.completion_rate}%`} icon={Target} accent="brand"
                hint={{ text: `${kpis.done} of ${kpis.total} tasks done` }} />
        </div>
    );
}

function UpcomingCard({ tasks, showOwner }) {
    return (
        <Card title="Upcoming deadlines" subtitle="The next open tasks that are due" bodyClassName="px-5 pb-3 pt-2">
            {tasks.length === 0 ? (
                <EmptyNote icon={Inbox} text="No upcoming deadlines. You're all clear." />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {tasks.map((task) => (
                        <li key={task.id} className="flex items-center gap-3 py-3">
                            <DateTile value={task.due_at} />
                            <div className="min-w-0 flex-1">
                                <Link to={`/tasks/${task.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-brand-600">
                                    {task.title}
                                </Link>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                    <Clock size={12} aria-hidden="true" />
                                    {formatDue(task.due_at)}{showOwner ? ` · ${task.user_name}` : ""}
                                </p>
                            </div>
                            <PriorityBadge priority={task.priority} compact />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function ActivityCard({ events, showOwner }) {
    return (
        <Card title="Recent activity" subtitle="Tasks added and completed lately" bodyClassName="px-5 pb-5 pt-3">
            {events.length === 0 ? (
                <EmptyNote icon={Activity} text="No activity yet. Add a task to get started." />
            ) : (
                <ul>
                    {events.map((event, i) => (
                        <li key={`${event.type}-${event.id}`} className="relative flex gap-3 pb-5 last:pb-0">
                            {/* Timeline line joining each icon to the next one */}
                            {i < events.length - 1 && <span className="absolute left-3.5 top-8 bottom-0 w-px bg-slate-200" aria-hidden="true" />}
                            <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                                event.type === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-brand-100 text-brand-700"
                            }`} aria-hidden="true">
                                {event.type === "completed" ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                            </span>
                            <div className="min-w-0 pt-0.5">
                                <p className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">{showOwner ? event.user_name : "You"}</span>{" "}
                                    {event.type === "completed" ? "completed" : "added"}{" "}
                                    <Link to={`/tasks/${event.id}`} className="font-medium text-slate-900 hover:text-brand-600">{event.title}</Link>
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">{formatRelative(event.at)}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function HealthCard({ health }) {
    const rows = [
        { label: "Due today", value: health.due_today, icon: Clock, tone: "amber" },
        { label: "Due in the next 7 days", value: health.due_next_7_days, icon: CalendarClock, tone: "brand" },
        { label: "Overdue", value: health.overdue, icon: TriangleAlert, tone: health.overdue > 0 ? "red" : "slate" },
        { label: "No due date", value: health.no_due_date, icon: CircleDashed, tone: "slate" },
    ];

    return (
        <Card
            title={<span className="flex items-center gap-2"><Activity size={16} className="text-brand-600" aria-hidden="true" /> Task health</span>}
            subtitle="Open tasks right now"
            bodyClassName="px-5 pb-5 pt-3"
        >
            <ul className="space-y-2">
                {rows.map(({ label, value, icon: Icon, tone }) => (
                    <li key={label} className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${HEALTH_TONES[tone]}`}>
                        <span className="flex items-center gap-2 font-medium">
                            <Icon size={16} aria-hidden="true" />
                            {label}
                        </span>
                        <span className="text-base font-semibold tabular-nums">{value}</span>
                    </li>
                ))}
            </ul>
            <Link to="/tasks" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                View all tasks <ArrowRight size={14} />
            </Link>
        </Card>
    );
}

// Background + text colour for each Task health row
const HEALTH_TONES = {
    amber: "bg-amber-50 text-amber-800",
    brand: "bg-brand-50 text-brand-800",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-50 text-slate-600",
};

// Small calendar tile ("OCT / 26") shown next to each upcoming deadline
function DateTile({ value }) {
    const date = parseApiDate(value);
    return (
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/10" aria-hidden="true">
            <span className="text-[10px] font-semibold uppercase leading-none tracking-wide">{date.toLocaleDateString(undefined, { month: "short" })}</span>
            <span className="mt-0.5 text-base font-bold leading-none">{date.getDate()}</span>
        </div>
    );
}


// Switch a chart card between the chart and the same numbers as a table
function ViewToggle({ value, onChange, label }) {
    return (
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label={`${label} view`}>
            {["chart", "table"].map((option) => (
                <button
                    key={option}
                    type="button"
                    aria-pressed={value === option}
                    onClick={() => onChange(option)}
                    className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition ${value === option ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

function EmptyNote({ icon: Icon, text }) {
    return (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500">
            <Icon size={20} className="text-slate-300" aria-hidden="true" />
            {text}
        </div>
    );
}

export default Dashboard;
