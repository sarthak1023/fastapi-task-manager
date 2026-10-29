import { useState } from "react";
import { niceScale } from "./scale";

const LABEL_SPACE = 84;   // px for the category labels, including the gap before the bars
const VALUE_SPACE = 36;   // px kept free after the longest bar for its value

// Horizontal bars for a single series: category on the left, value at each bar's tip.
//   data: [{ label, value }]
function BarChart({ data, color, unit = "tasks" }) {
    const [active, setActive] = useState(null);
    const scale = niceScale(Math.max(0, ...data.map((row) => row.value)));
    const plot = `(100% - ${LABEL_SPACE + VALUE_SPACE}px)`;
    const at = (ratio) => `calc(${LABEL_SPACE}px + ${plot} * ${ratio})`;

    return (
        <div className="relative">
            {/* Vertical gridlines behind the bars */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7" aria-hidden="true">
                {scale.ticks.map((tick) => (
                    <div key={tick} className={`absolute inset-y-0 w-px ${tick === 0 ? "bg-slate-300" : "bg-slate-100"}`}
                        style={{ left: at(tick / scale.max) }} />
                ))}
            </div>

            <ul className="relative space-y-5 py-3">
                {data.map((row, i) => {
                    const ratio = row.value / scale.max;
                    return (
                        <li key={row.label} className="relative h-6" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-right text-xs text-slate-600" style={{ width: LABEL_SPACE - 12 }}>
                                {row.label}
                            </span>
                            {/* 24px bar, square at the baseline, 4px rounded at its end */}
                            <button
                                type="button"
                                aria-label={`${row.label}: ${row.value} ${unit}`}
                                onFocus={() => setActive(i)}
                                onBlur={() => setActive(null)}
                                className="absolute inset-y-0 rounded-r transition-opacity focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                                style={{
                                    left: at(0),
                                    width: `calc(${plot} * ${ratio})`,
                                    minWidth: row.value ? 4 : 0,
                                    backgroundColor: color,
                                    opacity: active === null || active === i ? 1 : 0.55,
                                }}
                            />
                            <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums text-slate-700"
                                style={{ left: `calc(${at(ratio)} + 8px)` }}>
                                {row.value}
                            </span>
                            {active === i && (
                                <div role="tooltip"
                                    className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg"
                                    style={{ left: at(Math.max(ratio, 0.1) / 2) }}>
                                    <span className="font-semibold text-slate-900">{row.value}</span>{" "}
                                    <span className="text-slate-500">{unit} · {row.label}</span>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            <div className="relative h-7" aria-hidden="true">
                {scale.ticks.map((tick) => (
                    <span key={tick} className="absolute top-1.5 -translate-x-1/2 text-[11px] tabular-nums text-slate-400"
                        style={{ left: at(tick / scale.max) }}>
                        {tick}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default BarChart;
