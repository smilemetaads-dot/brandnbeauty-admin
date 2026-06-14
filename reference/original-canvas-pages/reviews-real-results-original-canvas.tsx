// REFERENCE ONLY.
// Original Canvas Reviews & Real Results design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Reviews & Real Results page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

const headerMap = {
    "Reviews & Real Results": { search: "Search reviews / results...", primary: "Add Result", secondary: "Export" },
};

function ReviewsRealResultsPage() {
    const results = [
        { title: "7 Days Glow", product: "Barrier Calm Serum", type: "Before / After", status: "Approved" },
        { title: "Acne Result", product: "Acne Balance Facewash", type: "Customer Review", status: "Pending" },
        { title: "Real Routine", product: "Routine Bundle", type: "Reels Video", status: "Approved" },
        { title: "Hydration Review", product: "Hydra Gel Moisturizer", type: "Image Review", status: "Draft" },
    ];
    return <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[["Total Results", "48", "UGC + reviews"], ["Approved", "36", "Visible storefront"], ["Pending Review", "8", "Need approval"], ["Video Reviews", "12", "Reels ready"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="text-sm font-medium text-slate-500">Storefront Social Proof</div><h2 className="mt-1 text-xl font-bold tracking-tight">Reviews & Real Results</h2><div className="mt-2 text-sm text-slate-500">Manage PDP visible results, homepage real results and customer review approval.</div></div><button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Add Result</button></div>
                <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><TableHead><tr>{["Result", "Product", "Type", "Status", "Action"].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></TableHead><tbody>{results.map((row) => <tr key={row.title} className="border-t border-slate-100 transition hover:bg-stone-50"><td className="px-5 py-4"><div className="font-bold text-slate-900">{row.title}</div><div className="mt-1 text-xs text-slate-500">Mapped to homepage / PDP</div></td><td className="px-5 py-4">{row.product}</td><td className="px-5 py-4"><Badge tone="brand">{row.type}</Badge></td><td className="px-5 py-4"><Badge tone={row.status === "Approved" ? "good" : row.status === "Pending" ? "warn" : "default"}>{row.status}</Badge></td><td className="px-5 py-4"><ActionButtons actions={["Review", "Edit"]} /></td></tr>)}</tbody></table></div>
            </div>
            <div className="space-y-6"><div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm font-medium text-slate-500">Result Upload</div><h3 className="mt-1 text-xl font-bold tracking-tight">Quick Add</h3><div className="mt-5 space-y-3"><input className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" placeholder="Result title" /><select className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none"><option>Before / After</option><option>Customer Review</option><option>Reels Video</option><option>Image Review</option></select><select className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none"><option>Map to Product</option><option>Acne Balance Facewash</option><option>Barrier Calm Serum</option><option>Routine Bundle</option></select><button className="w-full rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Save Result</button></div></div><div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm"><div className="text-sm font-bold text-amber-800">Conversion Note</div><div className="mt-2 text-sm leading-6 text-amber-700">Real Results should be mapped to related product and concern pages to improve trust before add-to-cart.</div></div></div>
        </div>
    </div>;
}
