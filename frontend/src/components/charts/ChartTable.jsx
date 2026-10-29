// The same numbers as a chart, as a table - so every value can be read without hovering.
//   columns: [{ key, label, numeric }]
function ChartTable({ columns, rows, height }) {
    return (
        <div className="overflow-auto rounded-lg border border-slate-100" style={{ maxHeight: height }}>
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} scope="col" className={`px-3 py-2 font-medium ${column.numeric ? "text-right" : "text-left"}`}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {columns.map((column) => (
                                <td key={column.key} className={`px-3 py-2 ${column.numeric ? "text-right tabular-nums text-slate-900" : "text-slate-600"}`}>
                                    {row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ChartTable;
