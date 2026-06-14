// REFERENCE ONLY.
// Original Canvas Header & Navigation design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Header & Navigation page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

const headerMap = {
    "Header & Navigation": { search: "Search menu items...", primary: "Save Navigation", secondary: "Preview" },
};

function HeaderNavigationPage() {
    const navItems = ["Skincare", "Hair Care", "Body Care", "Makeup", "Tools", "Fragrance", "Men's Care", "Mom & Baby"];
    const controls = [
        ["Logo", "BrandnBeauty", "Upload / replace storefront logo"],
        ["Search Bar", "Enabled", "Control search placeholder and visibility"],
        ["Wishlist Button", "Enabled", "Show or hide wishlist from header"],
        ["Login Button", "Enabled", "Show customer login button"],
        ["Bag Counter", "Enabled", "Show cart quantity in header"],
        ["Sticky Header", "Enabled", "Keep header visible while scrolling"],
    ];
    return <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[["Menu Items", "8", "Top navigation"], ["Header Controls", "6", "Active settings"], ["Search Status", "Live", "Product search"], ["Mobile Header", "Ready", "Responsive menu"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div><div className="text-sm font-medium text-slate-500">Storefront Header</div><h2 className="mt-1 text-xl font-bold tracking-tight">Header & Navigation Control</h2><div className="mt-2 text-sm text-slate-500">Manage logo, search, top menu, bag button and storefront navigation order.</div></div>
                    <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Save Navigation</button>
                </div>
                <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4">
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                        <div className="text-xl font-black text-slate-900">BrandnBeauty</div>
                        <div className="hidden flex-1 justify-center md:flex"><div className="w-full max-w-md rounded-full border border-slate-200 bg-stone-50 px-4 py-2 text-sm text-slate-400">⌕ Search products...</div></div>
                        <div className="rounded-full bg-[#5E7F85] px-4 py-2 text-sm font-bold text-white">Bag 0</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">{navItems.map((item) => <button key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">{item}</button>)}</div>
                </div>
            </div>
            <div className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-medium text-slate-500">Header Settings</div><h3 className="mt-1 text-xl font-bold tracking-tight">Controls</h3>
                    <div className="mt-5 space-y-3">{controls.map(([label, status, desc]) => <div key={label} className="rounded-2xl bg-stone-50 p-4"><div className="flex items-center justify-between gap-3"><div className="font-bold text-slate-900">{label}</div><Badge tone="brand">{status}</Badge></div><div className="mt-1 text-xs text-slate-500">{desc}</div></div>)}</div>
                </div>
            </div>
        </div>
    </div>;
}
