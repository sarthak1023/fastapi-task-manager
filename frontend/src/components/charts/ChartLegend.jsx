// Legend for line charts: a short line in each series colour next to its name
function ChartLegend({ series }) {
    return (
        <ul className="flex flex-wrap items-center gap-4">
            {series.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                    {s.label}
                </li>
            ))}
        </ul>
    );
}

export default ChartLegend;
