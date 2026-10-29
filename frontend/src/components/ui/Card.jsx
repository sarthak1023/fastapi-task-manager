// White bordered panel used for every block of content inside the app.
// `title`, `subtitle` and `actions` form an optional header row.
function Card({ title, subtitle, actions, children, className = "", bodyClassName = "p-5" }) {
    return (
        <section className={`rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
            {(title || actions) && (
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
                    <div className="min-w-0">
                        {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
                        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
                </div>
            )}
            <div className={bodyClassName}>{children}</div>
        </section>
    );
}

export default Card;
