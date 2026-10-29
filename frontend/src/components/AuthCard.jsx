import { BellRing, CalendarDays, Check, CheckSquare, Flag, Rocket, ShieldCheck, Sparkles } from "lucide-react";

const YEAR = new Date().getFullYear();

// Left-panel content for each kind of auth page. Every claim matches a real feature of the app.
const PANELS = {
    login: {
        badge: { icon: Sparkles, text: "Task management, simplified" },
        title: "Plan smarter.",
        highlight: "Deliver on time.",
        text: "TaskMaster brings your priorities, due dates and reminders together in one calm, organized workspace, so nothing slips through the cracks.",
        features: [
            { icon: Flag, title: "Clear priorities", text: "Rank work high, medium or low and focus on what matters first." },
            { icon: BellRing, title: "Timely reminders", text: "An email arrives an hour before important tasks are due." },
            { icon: CalendarDays, title: "Calendar view", text: "See every deadline in the month and plan ahead with confidence." },
            { icon: ShieldCheck, title: "Secure by design", text: "Verified sign-up, strong passwords and role-based access." },
        ],
    },
    signup: {
        badge: { icon: Rocket, text: "Set up in under a minute" },
        title: "Start organized.",
        highlight: "Stay ahead.",
        text: "Turn scattered to-dos into a clear plan, with priorities, due dates and reminders that keep you on track.",
        steps: [
            { title: "Create your account", text: "Just your name, email and a strong password." },
            { title: "Verify your email", text: "Enter the 6-digit code we send to your inbox." },
            { title: "Plan your first task", text: "Set a priority and due date, and we'll remind you before it's due." },
        ],
    },
    security: {
        badge: { icon: ShieldCheck, text: "Account security" },
        title: "Your account,",
        highlight: "safe and sound.",
        text: "One-time email codes confirm it's really you before anything on your account changes.",
        checks: [
            "Codes expire after 10 minutes",
            "Every code works only once",
            "Passwords are hashed, never stored as plain text",
            "Strong password rules on every change",
        ],
    },
};

function Logo({ dark = false }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${dark ? "bg-brand-600" : "bg-white"}`}>
                <CheckSquare size={20} className={dark ? "text-white" : "text-brand-600"} />
            </div>
            <span className={`text-xl font-semibold tracking-tight ${dark ? "text-slate-900" : "text-white"}`}>TaskMaster</span>
        </div>
    );
}

function Features({ items }) {
    return (
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6">
            {items.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200 ring-1 ring-white/15">
                        <Icon size={18} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="mt-1 text-sm leading-snug text-slate-400">{text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Steps({ items }) {
    return (
        <ol className="mt-8 space-y-6">
            {items.map((step, i) => (
                <li key={step.title} className="relative flex gap-4">
                    {/* Vertical line joining this step's number to the next one */}
                    {i < items.length - 1 && <span aria-hidden="true" className="absolute left-4 top-9 -bottom-6 w-px bg-white/15" />}
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-100 ring-1 ring-brand-300/40">
                        {i + 1}
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-white">{step.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{step.text}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

function Checks({ items }) {
    return (
        <ul className="mt-8 space-y-3.5">
            {items.map((text) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30">
                        <Check size={14} strokeWidth={3} />
                    </span>
                    {text}
                </li>
            ))}
        </ul>
    );
}

// Full-screen split layout shared by the auth pages: login, signup, verify email, forgot password.
// `variant` picks the left-panel message; `wide` gives longer forms (signup) room for two columns.
function AuthCard({ title, subtitle, variant = "login", wide = false, children }) {
    const panel = PANELS[variant] || PANELS.login;
    const BadgeIcon = panel.badge.icon;

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: dark brand panel (hidden below lg) */}
            <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-[#060b18] text-white px-12 xl:px-16 py-8">
                {/* Deep navy base with soft brand-blue glows */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#060b18] via-[#0a1530] to-[#0c2152]" />
                <div className="absolute -top-40 -right-24 w-[34rem] h-[34rem] rounded-full bg-brand-600/25 blur-3xl" />
                <div className="absolute -bottom-48 -right-32 w-[40rem] h-[40rem] rounded-full bg-sky-500/15 blur-3xl" />
                <div className="absolute top-1/3 -left-48 w-[28rem] h-[28rem] rounded-full bg-brand-500/10 blur-3xl" />
                {/* Faint grid texture that fades out from the top-left corner */}
                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_left,black_10%,transparent_65%)]" />

                <div className="relative">
                    <Logo />
                </div>

                <div className="relative max-w-xl py-6">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200 backdrop-blur-sm">
                        <BadgeIcon size={14} /> {panel.badge.text}
                    </span>
                    <h1 className="mt-5 text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight">
                        {panel.title}
                        <br />
                        <span className="bg-gradient-to-r from-sky-300 via-brand-300 to-brand-200 bg-clip-text text-transparent">
                            {panel.highlight}
                        </span>
                    </h1>
                    <p className="mt-4 max-w-md leading-relaxed text-slate-300">{panel.text}</p>

                    {panel.features && <Features items={panel.features} />}
                    {panel.steps && <Steps items={panel.steps} />}
                    {panel.checks && <Checks items={panel.checks} />}
                </div>

                <p className="relative text-xs text-slate-500">&copy; {YEAR} TaskMaster. All rights reserved.</p>
            </div>

            {/* Right: form panel */}
            <div className="flex flex-col justify-center bg-gradient-to-br from-white via-slate-50 to-brand-50/60 px-6 py-8">
                <div className={`w-full mx-auto ${wide ? "max-w-lg" : "max-w-sm"}`}>
                    <div className="lg:hidden mb-8">
                        <Logo dark />
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h2>
                    {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
                    <div className="mt-6">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default AuthCard;
