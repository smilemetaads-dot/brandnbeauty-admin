// REFERENCE ONLY.
// Original Canvas Settings design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Settings page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

function SettingsPage() {
    // LOCKED: Settings page frozen for current phase. Revisit only for real system settings persistence and integration.
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [configurePanel, setConfigurePanel] = useState(null);
    const [systemToggles, setSystemToggles] = useState([
        ["Auto stock deduction on order confirm", true],
        ["Require confirmation before courier upload", true],
        ["Enable COD risk warning", true],
        ["Allow manual discount override", false],
    ]);
    const saveSettings = () => {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
    };
    const toggleSetting = (label) => {
        setSystemToggles((current) => current.map(([name, enabled]) => name === label ? [name, !enabled] : [name, enabled]));
    };
    const settingsStats = [
        ["Active Admins", "7", "Team members"],
        ["Live Integrations", "5", "Courier, payment, analytics"],
        ["Security Alerts", "2", "Need review"],
        ["System Status", "Healthy", "Core modules online"],
    ];
    const systemControls = [
        { title: "Store Settings", desc: "Brand name, currency, timezone and storefront controls", status: "Configured" },
        { title: "Order Automation", desc: "Status flow, stock deduction and packing triggers", status: "Review" },
        { title: "Courier Integration", desc: "Steadfast, Pathao and delivery charge mapping", status: "Connected" },
        { title: "Payment & COD", desc: "COD rules, settlement matching and mismatch handling", status: "Active" },
    ];

    return <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {settingsStats.map((item, index) => <StatCard key={item[0]} item={item} index={index} active={item[0] === "Security Alerts"} />)}
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings Control Room</h2>
                    <div className="mt-2 text-sm text-slate-500">Manage store rules, automation, integrations and admin system controls.</div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setConfigurePanel(null)} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold shadow-sm">Reset Draft</button>
                    <button onClick={saveSettings} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">Save Changes</button>
                </div>
            </div>
            <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Environment: <b className="text-[#5E7F85]">Production Ready</b></div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Last update: <b className="text-slate-900">Today</b></div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Review focus: <b className="text-amber-700">Automation rules</b></div>
            </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    {systemControls.map((item) => <div key={item.title} className={`rounded-[1.5rem] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${configurePanel === item.title ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"}`}>
                        <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-slate-900">{item.title}</h3><Badge tone={item.status === "Review" ? "warn" : "good"}>{item.status}</Badge></div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">{item.desc}</p>
                        <button onClick={() => setConfigurePanel(item.title)} className="mt-4 rounded-xl bg-[#5E7F85]/10 px-4 py-2.5 text-sm font-semibold text-[#5E7F85]">Configure</button>
                    </div>)}
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-medium text-slate-500">Automation Rules</div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">System Toggles</h2>
                    <div className="mt-5 space-y-3">
                        {systemToggles.map(([label, enabled]) => <button key={label} onClick={() => toggleSetting(label)} className="flex w-full items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-stone-100">
                            <span>{label}</span>
                            <span className={`relative inline-flex h-7 w-12 rounded-full transition ${enabled ? "bg-[#5E7F85]" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? "left-6" : "left-1"}`} /></span>
                        </button>)}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-medium text-slate-500">Store Identity</div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">Brand Defaults</h2>
                    <div className="mt-5 space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">Store Name<input defaultValue="BrandnBeauty" className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" /></label>
                        <label className="block text-sm font-semibold text-slate-700">Currency<select defaultValue="BDT" className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none"><option>BDT</option><option>USD</option></select></label>
                        <label className="block text-sm font-semibold text-slate-700">Timezone<select defaultValue="Asia/Dhaka" className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none"><option>Asia/Dhaka</option><option>UTC</option></select></label>
                        <label className="block text-sm font-semibold text-slate-700">Support Phone<input defaultValue="01XXXXXXXXX" className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" /></label>
                        <label className="block text-sm font-semibold text-slate-700">Support Email<input defaultValue="support@brandnbeauty.com" className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" /></label>
                    </div>
                </div>
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
                    <div className="text-sm font-bold text-rose-800">Security Alerts</div>
                    <div className="mt-4 space-y-3 text-sm font-semibold text-rose-700">
                        <div className="rounded-2xl bg-white/70 px-4 py-3">Finance access review needed</div>
                        <div className="rounded-2xl bg-white/70 px-4 py-3">Courier API key check pending</div>
                    </div>
                </div>
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                    <div className="text-sm font-bold text-amber-800">System Note</div>
                    <div className="mt-2 text-sm leading-6 text-amber-700">Before going live, verify stock deduction, courier upload and COD settlement rules carefully.</div>
                </div>
            </div>
        </div>
    </div>;
}
