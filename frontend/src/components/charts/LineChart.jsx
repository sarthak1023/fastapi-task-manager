import { useEffect, useRef, useState } from "react";
import { niceScale } from "./scale";

const MARGIN = { top: 12, right: 16, bottom: 28, left: 36 };
const GRIDLINE = "#f1f5f9";   // slate-100
const BASELINE = "#cbd5e1";   // slate-300
const CROSSHAIR = "#cbd5e1";  // slate-300

// Smooth curve through the points that never overshoots them (monotone cubic),
// so a count can't appear to dip below zero between two points
function monotonePath(points) {
    const n = points.length;
    if (n === 0) return "";
    if (n === 1) return `M${points[0].x},${points[0].y}`;

    const slopes = [];
    for (let i = 0; i < n - 1; i++) {
        slopes.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x));
    }
    const tangents = [slopes[0]];
    for (let i = 1; i < n - 1; i++) {
        tangents.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2);
    }
    tangents.push(slopes[n - 2]);
    for (let i = 0; i < n - 1; i++) {
        if (slopes[i] === 0) {
            tangents[i] = 0;
            tangents[i + 1] = 0;
            continue;
        }
        const a = tangents[i] / slopes[i];
        const b = tangents[i + 1] / slopes[i];
        const length = a * a + b * b;
        if (length > 9) {
            const scale = 3 / Math.sqrt(length);
            tangents[i] = scale * a * slopes[i];
            tangents[i + 1] = scale * b * slopes[i];
        }
    }

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < n - 1; i++) {
        const h = (points[i + 1].x - points[i].x) / 3;
        path += ` C${points[i].x + h},${points[i].y + h * tangents[i]} ${points[i + 1].x - h},${points[i + 1].y - h * tangents[i + 1]} ${points[i + 1].x},${points[i + 1].y}`;
    }
    return path;
}

// One path per unbroken run of values; a null (e.g. a month that hasn't happened yet) ends the line
function linePath(points) {
    const runs = [[]];
    for (const point of points) {
        if (point.y === null) {
            if (runs[runs.length - 1].length) runs.push([]);
        } else {
            runs[runs.length - 1].push(point);
        }
    }
    return runs.filter((run) => run.length).map(monotonePath).join(" ");
}

// Line chart for one or more series sharing one axis.
//   data:   [{ label, full_label, <series key>: number | null, ... }]  (null = no data for that point)
//   series: [{ key, label, color }]
// Hover (or focus + arrow keys) shows a crosshair and a tooltip listing every series at that point.
function LineChart({ data, series, height = 260, ariaLabel }) {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(0);
    const [hovered, setHovered] = useState(null);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return undefined;
        // Reports the current size straight away, then again on every resize
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const active = hovered !== null && hovered < data.length ? hovered : null;
    const values = data.flatMap((point) => series.map((s) => point[s.key])).filter((value) => value !== null);
    const scale = niceScale(Math.max(0, ...values));
    const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
    const plotHeight = height - MARGIN.top - MARGIN.bottom;
    const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;
    const xAt = (i) => MARGIN.left + (data.length > 1 ? i * step : plotWidth / 2);
    const yAt = (value) => MARGIN.top + plotHeight - (value / scale.max) * plotHeight;
    // Label every point when they fit, otherwise every 2nd, 3rd ... one
    const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotWidth / 44))));
    const showAllDots = data.length <= 16;

    function pointUnder(event) {
        if (data.length < 2) return 0;
        const left = event.currentTarget.getBoundingClientRect().left;
        return Math.min(data.length - 1, Math.max(0, Math.round((event.clientX - left - MARGIN.left) / step)));
    }

    function handleKeyDown(event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? 1 : -1;
        setHovered((current) => {
            const start = current ?? (delta > 0 ? -1 : data.length);
            return Math.min(data.length - 1, Math.max(0, start + delta));
        });
    }

    const point = active !== null ? data[active] : null;
    const pointX = active !== null ? xAt(active) : 0;
    const flipTooltip = pointX > width - 180;

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            role="group"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            onFocus={() => setHovered((current) => current ?? data.length - 1)}
            onBlur={() => setHovered(null)}
            className="relative rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
            style={{ height }}
        >
            {width > 0 && (
                <svg width={width} height={height} aria-hidden="true" className="block select-none">
                    {scale.ticks.map((tick) => (
                        <g key={tick}>
                            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={yAt(tick)} y2={yAt(tick)}
                                stroke={tick === 0 ? BASELINE : GRIDLINE} shapeRendering="crispEdges" />
                            <text x={MARGIN.left - 10} y={yAt(tick)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px] tabular-nums">
                                {tick}
                            </text>
                        </g>
                    ))}

                    {data.map((p, i) => i % labelEvery === 0 && (
                        <text key={p.label} x={xAt(i)} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">
                            {p.label}
                        </text>
                    ))}

                    {active !== null && (
                        <line x1={pointX} x2={pointX} y1={MARGIN.top} y2={MARGIN.top + plotHeight} stroke={CROSSHAIR} shapeRendering="crispEdges" />
                    )}

                    {series.map((s) => (
                        <path key={s.key} d={linePath(data.map((p, i) => ({ x: xAt(i), y: p[s.key] === null ? null : yAt(p[s.key]) })))}
                            fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ))}

                    {/* Markers carry a white ring so they stay readable where lines cross */}
                    {series.map((s) => data.map((p, i) => p[s.key] !== null && (showAllDots || i === active) && (
                        <circle key={`${s.key}-${p.label}`} cx={xAt(i)} cy={yAt(p[s.key])} r={i === active ? 5 : 4}
                            fill={s.color} stroke="#ffffff" strokeWidth="2" />
                    )))}

                    {/* Invisible layer that turns the pointer position into the nearest point */}
                    <rect x="0" y="0" width={width} height={height} fill="transparent"
                        onPointerMove={(event) => setHovered(pointUnder(event))}
                        onPointerDown={(event) => setHovered(pointUnder(event))}
                        onPointerLeave={() => setHovered(null)} />
                </svg>
            )}

            {point && (
                <div
                    className="pointer-events-none absolute top-1 z-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
                    style={flipTooltip ? { right: width - pointX + 12 } : { left: pointX + 12 }}
                >
                    <p className="mb-1.5 text-xs font-medium text-slate-500">{point.full_label || point.label}</p>
                    {series.every((s) => point[s.key] === null) ? (
                        <p className="text-xs text-slate-500">No data yet</p>
                    ) : series.map((s) => (
                        <div key={s.key} className="flex items-center justify-between gap-4 text-xs">
                            <span className="flex items-center gap-2 text-slate-500">
                                <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                                {s.label}
                            </span>
                            <span className="text-sm font-semibold tabular-nums text-slate-900">{point[s.key]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LineChart;
