// REFERENCE ONLY.
// Original Canvas Homepage CMS design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Homepage CMS page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

function ActionButtons({ actions = ["Edit", "View"] }) {
    return (
        <div className="flex items-center gap-2">
            {actions.map((action, index) => (
                <button key={action} className={index === 0 ? "rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"}>{action}</button>
            ))}
        </div>
    );
}

function TableHead({ children, className = "" }) {
    return <thead className={`sticky top-0 z-10 bg-stone-50 text-slate-500 ${className}`}>{children}</thead>;
}

function DataTable({ type }) {
    const meta = type === "orders"
        ? { title: "Order Pipeline", label: "Order Management", badge: "Operations", heads: ["Order", "Customer", "Amount", "Zone", "Status", "Payment", "Action"], rows: orders, actions: ["View", "Update"] }
        : type === "suppliers"
            ? { title: "Supplier List", label: "Supplier Management", badge: "Vendor", heads: ["Supplier", "Products", "Purchase", "Status", "Action"], rows: suppliers, actions: ["Open", "Edit"] }
            : { title: "Product Catalog", label: "Product Management", badge: "Catalog", heads: ["Product", "Brand", "Price", "Stock", "Status", "Action"], rows: products, actions: ["Edit", "View"] };
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-sm font-medium text-slate-500">{meta.label}</div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">{meta.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{meta.badge}</Badge>
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50">Filter</button>
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50">Export</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <TableHead><tr>{meta.heads.map((head) => <th key={head} className="px-5 py-4 font-medium">{head}</th>)}</tr></TableHead>
                    <tbody>
                        {meta.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]">
                                {row.map((cell, cellIndex) => (
                                    <td key={`${rowIndex}-${cellIndex}`} className="px-5 py-4 text-slate-700">
                                        {cellIndex === row.length - 1 ? <Badge tone={getStatusTone(cell)}>{cell}</Badge> : <span className={cellIndex === 0 ? "font-semibold text-slate-900" : ""}>{cell}</span>}
                                    </td>
                                ))}
                                <td className="px-5 py-4"><ActionButtons actions={meta.actions} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function HomepageCMSPage() { return <DataTable type="products" />; }
