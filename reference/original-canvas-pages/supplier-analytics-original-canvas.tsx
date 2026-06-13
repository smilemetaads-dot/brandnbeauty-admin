// REFERENCE ONLY.
// Original Canvas Supplier Analytics design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Supplier Analytics page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

function SupplierAnalyticsPage() {
    // LOCKED: Supplier Analytics page frozen for current phase. Revisit only for real data/export integration.
    const supplierOptions = [
        { name: "Some By Mi", status: "Active", categoryFocus: "Skincare", reliability: 92, safety: 78, payment: 84, availability: 88, terms: "Net 15", lead: "7 days" },
        { name: "Simple", status: "Active", categoryFocus: "Moisturizer", reliability: 88, safety: 91, payment: 96, availability: 82, terms: "Advance", lead: "4 days" },
        { name: "Beauty of Joseon", status: "Inactive", categoryFocus: "Premium", reliability: 76, safety: 86, payment: 72, availability: 68, terms: "Net 30", lead: "10 days" },
        { name: "BrandnBeauty Factory", status: "Primary", categoryFocus: "Own Brand", reliability: 97, safety: 93, payment: 99, availability: 95, terms: "Internal", lead: "2 days" },
    ];
    const [selectedSupplierName, setSelectedSupplierName] = useState("Some By Mi");
    const [range, setRange] = useState("Last 90 days");
    const [actionModal, setActionModal] = useState(null);
    const [bulkStep, setBulkStep] = useState("Upload");
    const [bulkMode, setBulkMode] = useState("Create new products only");
    const [bulkRows, setBulkRows] = useState([
        { row: 1, name: "Niacinamide Serum", sku: "Auto", brand: "BrandnBeauty", category: "Serum", price: "890", stock: "24", status: "Ready", issue: "SKU will auto generate" },
        { row: 2, name: "Kojic Body Wash", sku: "1007", brand: "The Derma Plus", category: "Body Care", price: "650", stock: "36", status: "Ready", issue: "" },
        { row: 3, name: "Daily Sun Gel", sku: "1003", brand: "Beauty of Joseon", category: "Sunscreen", price: "", stock: "12", status: "Error", issue: "Missing sale price" },
    ]);
    const supplier = supplierOptions.find((item) => item.name === selectedSupplierName) || supplierOptions[0];
    const healthScore = Math.round((supplier.reliability + supplier.safety + supplier.payment + supplier.availability) / 4);
    const kpis = [
        ["Purchase Value", "BDT 1,24,000", range],
        ["Profit Generated", "BDT 48,500", "Estimated margin"],
        ["Return Rate", "12%", "Higher than target"],
        ["Pending Due", "BDT 22,000", "Payment outstanding"],
    ];
    const monthly = [
        { month: "Jan", purchase: 28, sales: 46 },
        { month: "Feb", purchase: 34, sales: 52 },
        { month: "Mar", purchase: 41, sales: 58 },
        { month: "Apr", purchase: 30, sales: 44 },
        { month: "May", purchase: 36, sales: 55 },
        { month: "Jun", purchase: 39, sales: 61 },
    ];
    const topProducts = [
        { name: "Acne Facewash", sold: 124, returnRate: "8%", profit: "BDT 18,200", status: "Top Seller" },
        { name: "Tea Tree Gel", sold: 66, returnRate: "17%", profit: "BDT 9,800", status: "Return Watch" },
        { name: "Serum", sold: 81, returnRate: "6%", profit: "BDT 14,500", status: "Healthy" },
    ];
    const alerts = [
        "Tea Tree Gel return rate is above safe threshold.",
        "One supplier payment is overdue by 7 days.",
        "Current month profit is strong, but return risk is rising.",
    ];
    const maxValue = Math.max(...monthly.map((m) => Math.max(m.purchase, m.sales)));
    const openSupplierAction = (title) => setActionModal(title);

    return <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Supplier Analytics Control Room</h2>
                    <div className="mt-2 text-sm text-slate-500">Analyze supplier profitability, return risk, payment health and reorder decisions.</div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select value={selectedSupplierName} onChange={(e) => setSelectedSupplierName(e.target.value)} className="min-w-[220px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none shadow-sm">
                        {supplierOptions.map((item) => <option key={item.name}>{item.name}</option>)}
                    </select>
                    <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none shadow-sm">
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                        <option>This year</option>
                    </select>
                    <button onClick={() => openSupplierAction("Create Reorder Plan")} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">Create Reorder Plan</button>
                </div>
            </div>
            <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Selected supplier: <b className="text-slate-900">{supplier.name}</b></div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Health score: <b className="text-[#5E7F85]">{healthScore}%</b></div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Lead time: <b className="text-slate-900">{supplier.lead}</b></div>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item, index) => <StatCard key={item[0]} item={item} index={index} active={index === 1 || index === 2} />)}
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-sm shadow-sm">
            <div className="font-bold text-amber-800">AI Supplier Insight</div>
            <div className="mt-1 leading-6 text-amber-700">{supplier.name} is profitable overall, but one product is showing elevated return risk. Reorder selectively, not blindly.</div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-sm font-medium text-slate-500">Trend View</div>
                        <h2 className="mt-1 text-xl font-bold tracking-tight">Purchase vs Sales Trend</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-slate-600"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />Purchase</span><span className="inline-flex items-center gap-2 rounded-full bg-[#5E7F85]/10 px-3 py-1 text-xs font-bold text-[#5E7F85]"><span className="h-2.5 w-2.5 rounded-full bg-[#5E7F85]" />Sales</span></div>
                </div>
                <div className="mt-6 flex items-end gap-4 overflow-x-auto pb-2">
                    {monthly.map((item) => <div key={item.month} className="flex min-w-[88px] flex-col items-center gap-3">
                        <div className="text-[11px] font-semibold text-slate-500">{item.month}</div>
                        <div className="flex h-60 items-end gap-2 rounded-2xl bg-stone-50 px-3 py-2">
                            <div className="flex h-full items-end"><div className="w-5 rounded-xl bg-slate-300" style={{ height: `${(item.purchase / maxValue) * 100}%` }} /></div>
                            <div className="flex h-full items-end"><div className="w-5 rounded-xl bg-[#5E7F85]" style={{ height: `${(item.sales / maxValue) * 100}%` }} /></div>
                        </div>
                        <div className="text-[11px] text-slate-500">P {item.purchase} / S {item.sales}</div>
                    </div>)}
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium text-slate-500">Supplier Health</div>
                            <h2 className="mt-1 text-xl font-bold tracking-tight">{supplier.name}</h2>
                            <div className="mt-1 text-sm text-slate-500">{supplier.categoryFocus} - {supplier.terms}</div>
                        </div>
                        <Badge tone={getStatusTone(supplier.status)}>{supplier.status}</Badge>
                    </div>
                    <div className="mt-5 flex items-center justify-center">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-stone-100">
                            <div className="absolute inset-0 rounded-full border-[10px] border-[#5E7F85]" style={{ clipPath: `inset(${100 - healthScore}% 0 0 0)` }} />
                            <div className="text-center"><div className="text-2xl font-black text-[#5E7F85]">{healthScore}%</div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Health</div></div>
                        </div>
                    </div>
                    <div className="mt-5 space-y-3 text-sm">
                        {[["Reliability", supplier.reliability], ["Return Safety", supplier.safety], ["Payment Health", supplier.payment], ["Stock Availability", supplier.availability]].map(([label, value]) => <div key={label}>
                            <div className="mb-2 flex justify-between text-xs font-bold text-slate-500"><span>{label}</span><span>{value}%</span></div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${value}%` }} /></div>
                        </div>)}
                    </div>
                </div>
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
                    <div className="text-sm font-bold text-rose-800">Risk Watch</div>
                    <div className="mt-2 text-sm leading-6 text-rose-700">Return rate is higher than target on Tea Tree Gel. Review product expectation and customer education before next reorder.</div>
                </div>
            </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                    <div className="text-sm font-medium text-slate-500">Product Performance</div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">Top Supplier Products</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <TableHead><tr>{["Product", "Sold", "Return Rate", "Profit", "Status"].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></TableHead>
                        <tbody>{topProducts.map((item) => <tr key={item.name} className="border-t border-slate-100 transition hover:bg-stone-50">
                            <td className="px-5 py-4 font-bold text-slate-900">{item.name}</td>
                            <td className="px-5 py-4 font-semibold">{item.sold}</td>
                            <td className="px-5 py-4"><Badge tone={parseInt(item.returnRate) > 12 ? "bad" : "good"}>{item.returnRate}</Badge></td>
                            <td className="px-5 py-4 font-semibold text-emerald-700">{item.profit}</td>
                            <td className="px-5 py-4"><Badge tone={item.status.includes("Watch") ? "warn" : item.status.includes("Top") ? "brand" : "good"}>{item.status}</Badge></td>
                        </tr>)}</tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-slate-500">Priority Alerts</div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">Supplier Actions</h2>
                <div className="mt-5 space-y-3">{alerts.map((item) => <div key={item} className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold leading-6 text-slate-700">Alert: {item}</div>)}</div>
                <div className="mt-5 grid gap-3">
                    <button onClick={() => openSupplierAction("Open Supplier Details")} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Open Supplier Details</button>
                    <button onClick={() => openSupplierAction("Create Purchase Order")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Create Purchase Order</button>
                    <button onClick={() => openSupplierAction("Payment Entry")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Payment Entry</button>
                    <button onClick={() => openSupplierAction("Export Analytics")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Export Analytics</button>
                </div>
            </div>
        </div>
        {actionModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm font-medium text-slate-500">Supplier Action</div>
                        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{actionModal}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{supplier.name} - {supplier.categoryFocus} - {range}</p>
                    </div>
                    <button onClick={() => setActionModal(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">Close</button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-stone-50 p-4">
                        <div className="text-xs font-semibold text-slate-500">Health</div>
                        <div className="mt-2 text-xl font-bold text-[#5E7F85]">{healthScore}%</div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                        <div className="text-xs font-semibold text-slate-500">Pending Due</div>
                        <div className="mt-2 text-xl font-bold text-slate-900">BDT 22,000</div>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                        <div className="text-xs font-semibold text-slate-500">Lead Time</div>
                        <div className="mt-2 text-xl font-bold text-slate-900">{supplier.lead}</div>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm font-semibold leading-6 text-slate-700">
                    {actionModal === "Create Purchase Order" || actionModal === "Create Reorder Plan" ? "Suggested next step: reorder fast-moving SKUs first and review Tea Tree Gel return issue before placing a bulk purchase." : actionModal === "Payment Entry" ? "Add payment amount, reference number and settlement note to update supplier outstanding due." : actionModal === "Export Analytics" ? "Prepare supplier performance, product profit, return risk and payable summary for export." : "Review supplier ledger, purchase history, payable status and active product list in one place."}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button onClick={() => setActionModal(null)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Close</button>
                    <button onClick={() => setActionModal(null)} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Confirm Action</button>
                </div>
            </div>
        </div>}
    </div>;
}
