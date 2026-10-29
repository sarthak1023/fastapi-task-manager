// Round an axis up to a clean maximum split into `ticks` equal whole-number steps,
// e.g. a largest value of 7 gives 0, 2, 4, 6, 8
export function niceScale(maxValue, ticks = 4) {
    const raw = Math.max(maxValue, 1) / ticks;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const nice = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= raw);
    const step = Math.max(1, Math.ceil(nice));
    return { max: step * ticks, ticks: Array.from({ length: ticks + 1 }, (_, i) => i * step) };
}
