// REFERENCE ONLY.
// Original Canvas Footer CMS design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Footer CMS page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

const headerMap = {
    "Footer CMS": { search: "Search footer links...", primary: "Save Footer", secondary: "Preview" },
};

function FooterCMSPage() {
    const groups = [
        { title: "Explore", links: ["Categories", "Concerns", "Brands", "Best Sellers", "Offers"] },
        { title: "Support", links: ["Messenger Support", "Track Order", "FAQ", "Call Support"] },
        { title: "Policies", links: ["Privacy Policy", "Terms & Conditions", "Refund Policy", "Shipping Policy"] },
    ];
    const trust = ["100% Authentic Products", "Verified Brands", "Science-Based Formula", "24/7 Support"];
    return <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[["Footer Groups", "3", "Explore, support, policies"], ["Footer Links", "13", "Active links"], ["Trust Items", "4", "Bottom trust strip"], ["Social Icons", "4", "Facebook, IG, TikTok, YouTube"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="text-sm font-medium text-slate-500">Storefront Footer</div><h2 className="mt-1 text-xl font-bold tracking-tight">Footer CMS</h2><div className="mt-2 text-sm text-slate-500">Control footer brand block, social links, policy links and trust strip.</div></div><button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Save Footer</button></div>
                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#5E7F85] text-white shadow-sm">
                    <div className="grid gap-5 border-b border-white/10 bg-white/10 p-4 md:grid-cols-4">{trust.map((item) => <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-semibold">OK {item}</div>)}</div>
                    <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr_1fr_1fr]"><div><div className="text-2xl font-black">BrandnBeauty</div><div className="mt-3 flex gap-2"><span className="rounded-full bg-white/15 px-3 py-2 text-xs">f</span><span className="rounded-full bg-white/15 px-3 py-2 text-xs">ig</span><span className="rounded-full bg-white/15 px-3 py-2 text-xs">tt</span><span className="rounded-full bg-white/15 px-3 py-2 text-xs">yt</span></div></div>{groups.map((group) => <div key={group.title}><div className="font-bold">{group.title}</div><div className="mt-3 space-y-2 text-sm text-white/80">{group.links.slice(0, 4).map((link) => <div key={link}>{link}</div>)}</div></div>)}</div>
                </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm font-medium text-slate-500">Footer Link Groups</div><h3 className="mt-1 text-xl font-bold tracking-tight">Editable Sections</h3><div className="mt-5 space-y-3">{groups.map((group) => <div key={group.title} className="rounded-2xl bg-stone-50 p-4"><div className="font-bold text-slate-900">{group.title}</div><div className="mt-2 flex flex-wrap gap-2">{group.links.map((link) => <span key={link} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{link}</span>)}</div></div>)}</div></div>
        </div>
    </div>;
}
