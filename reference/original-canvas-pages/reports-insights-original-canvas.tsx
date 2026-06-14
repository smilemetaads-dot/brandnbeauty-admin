// REFERENCE ONLY.
// Original Canvas Reports & Insights design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Reports & Insights page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react-hooks/static-components, react/jsx-no-undef */
// @ts-nocheck

function ReportsInsightsPage() {
    // LOCKED: Reports & Insights page frozen for current phase. Revisit only for real data/export integration.
    const [range, setRange] = useState("7D");
    const [openCalendar, setOpenCalendar] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 3, 1));
    const [activeReport, setActiveReport] = useState("Sales Report");
    const [reportAction, setReportAction] = useState(null);

    const formatDate = (date) => {
        if (!date) return "";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const formatMonth = (date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const moveMonth = (amount) => {
        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
    };

    const moveYear = (amount) => {
        setCalendarMonth((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
    };

    const openDatePicker = (type) => {
        const selected = type === "from" ? fromDate : toDate;
        if (selected) setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
        setOpenCalendar(openCalendar === type ? null : type);
    };

    const setCalendarDate = (type, day) => {
        const value = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        if (type === "from") setFromDate(value);
        if (type === "to") setToDate(value);
        setOpenCalendar(null);
    };

    const clearCalendarDate = (type) => {
        if (type === "from") setFromDate(null);
        if (type === "to") setToDate(null);
    };

    const setToday = (type) => {
        const today = new Date();
        setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        if (type === "from") setFromDate(today);
        if (type === "to") setToDate(today);
        setOpenCalendar(null);
    };

    const CalendarPopover = ({ type }) => {
        const value = type === "from" ? fromDate : toDate;
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: totalDays }, (_, index) => index + 1);

        return <div className="absolute right-0 top-full z-[999] mt-3 w-[340px] rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-2xl xl:right-auto xl:left-0">
            <div className="mb-3 flex items-center justify-between gap-2">
                <button type="button" onClick={() => moveYear(-1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">Prev year</button>
                <button type="button" onClick={() => moveMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">Prev</button>
                <div className="flex-1 text-center text-sm font-bold text-slate-900">{formatMonth(calendarMonth)}</div>
                <button type="button" onClick={() => moveMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">Next</button>
                <button type="button" onClick={() => moveYear(1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">Next year</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-slate-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-1">{day}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, index) => <div key={`blank-${index}`} />)}
                {days.map((day) => {
                    const active = value && value.getFullYear() === year && value.getMonth() === month && value.getDate() === day;
                    const today = new Date();
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                    return <button key={day} type="button" onClick={() => setCalendarDate(type, day)} className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition ${active ? "bg-[#5E7F85] text-white" : isToday ? "border border-[#5E7F85]/40 bg-[#5E7F85]/10 text-[#5E7F85]" : "bg-stone-50 text-slate-700 hover:bg-[#5E7F85]/10 hover:text-[#5E7F85]"}`}>{day}</button>;
                })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <button type="button" onClick={() => clearCalendarDate(type)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-stone-50">Clear</button>
                <button type="button" onClick={() => setToday(type)} className="rounded-xl bg-[#5E7F85]/10 px-4 py-2 text-xs font-semibold text-[#5E7F85] hover:bg-[#5E7F85]/15">Today</button>
            </div>
        </div>;
    };
    const kpis = [
        ["Revenue", "BDT 84,500", "+12%"],
        ["Orders", "128", "37 pending"],
        ["Net Profit", "BDT 21,640", "After all costs"],
        ["COD Risk", "14.8%", "Risk rising"],
    ];
    const reportCards = [
        { title: "Sales Report", badge: "Revenue", icon: "BDT" },
        { title: "Order Report", badge: "Orders", icon: "ORD" },
        { title: "Profit Report", badge: "Profit", icon: "UP" },
        { title: "Product Report", badge: "Products", icon: "PRD" },
        { title: "Customer Report", badge: "Customers", icon: "CUS" },
        { title: "COD Risk Report", badge: "Risk", icon: "!" },
        { title: "Courier Report", badge: "Courier", icon: "CAR" },
        { title: "Ad Channel Report", badge: "Ads", icon: "AD" },
    ];
    const intelligence = [
        ["Sales increased 12% compared to last week", "Growth", "01"],
        ["COD return rate is rising in Dhaka region", "Risk", "02"],
        ["Top 3 products generate 65% of revenue", "Product", "03"],
        ["Facebook ROAS is stronger than TikTok after return loss", "Ads", "04"],
    ];
    const nextActions = [
        ["Increase budget on top 3 performing products", "Ad Budget"],
        ["Reduce COD approval in high-risk zones", "COD Risk"],
        ["Create retention offer for repeat customers", "Retention"],
        ["Prepare reorder list before best sellers go low stock", "Inventory"],
    ];
    const exports = ["Export VIP Customers", "Export COD Risk Orders", "Export Profit Sheet", "Export Courier Mismatch", "Export Low Stock Products"];
    const generatedFiles = [
        ["Sales Summary", "Today", "Ismail", "PDF", "Ready"],
        ["Profit Report", "Today", "Finance", "CSV", "Ready"],
        ["COD Risk Orders", "Yesterday", "Operations", "CSV", "Ready"],
        ["Courier Settlement", "Apr 25", "Finance", "XLSX", "Ready"],
    ];
    const activeSummaryMap = {
        "Sales Report": "Revenue is up 12%. Website and Facebook are the strongest sales sources in this range.",
        "Order Report": "37 orders still need action. Prioritize confirmation before courier upload.",
        "Profit Report": "Net profit is healthy, but ad cost and courier return loss should be watched.",
        "Product Report": "Top products are carrying most revenue. Keep best-seller stock protected.",
        "Customer Report": "VIP and repeat customers are ready for a retention offer.",
        "COD Risk Report": "Dhaka region COD return is rising. Manual call confirmation is recommended.",
        "Courier Report": "Courier settlement and mismatch tracking need finance review.",
        "Ad Channel Report": "Facebook ROAS is stronger than TikTok after return adjustment.",
    };
    const reportPreviewRows = {
        "Sales Report": [["Facebook", "BDT 42,500", "+18%"], ["Website", "BDT 24,800", "+9%"], ["TikTok", "BDT 17,200", "Return watch"]],
        "Order Report": [["Confirmed", "62", "Ready flow"], ["Need Call", "37", "Urgent"], ["Returned", "11", "Review"]],
        "Profit Report": [["Revenue", "BDT 84,500", "Gross"], ["Cost", "BDT 52,860", "Product + ops"], ["Net Profit", "BDT 21,640", "Healthy"]],
        "Product Report": [["Barrier Calm Serum", "42 orders", "High margin"], ["Acne Facewash", "51 orders", "Fast moving"], ["Routine Bundle", "18 orders", "High AOV"]],
        "Customer Report": [["VIP", "84", "Retarget"], ["Repeat", "312", "Offer ready"], ["Risk", "19", "Manual review"]],
        "COD Risk Report": [["Dhaka", "14.8%", "Rising"], ["Gazipur", "18.2%", "Call first"], ["TikTok COD", "21%", "High risk"]],
        "Courier Report": [["Steadfast", "86% delivered", "Good"], ["Pathao", "78% delivered", "Monitor"], ["Mismatch", "7 rows", "Finance review"]],
        "Ad Channel Report": [["Facebook", "5.1x", "Scale"], ["TikTok", "3.6x", "Optimize"], ["Website", "Organic", "Growing"]],
    };
    const openReportAction = (action, report) => {
        setActiveReport(report.title);
        setReportAction({ action, report });
    };

    return <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item, index) => <StatCard key={item[0]} item={item} index={index} onClick={() => setActiveReport(index === 0 ? "Sales Report" : index === 1 ? "Order Report" : index === 2 ? "Profit Report" : "COD Risk Report")} active={activeReport === (index === 0 ? "Sales Report" : index === 1 ? "Order Report" : index === 2 ? "Profit Report" : "COD Risk Report")} />)}
        </div>

        <div className="overflow-visible rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <h2 className="pt-1 text-xl font-bold tracking-tight">Business Reports</h2>
                    <div className="flex flex-col items-start gap-3 xl:items-end">
                        <div className="flex flex-wrap gap-2">
                            {["Today", "7D", "30D", "This Month"].map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${range === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-stone-50"}`}>{item}</button>)}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="relative">
                                <button onClick={() => openDatePicker("from")} className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl border bg-white px-6 py-3 text-sm font-semibold shadow-sm ${openCalendar === "from" ? "border-slate-900 text-slate-900 ring-2 ring-slate-900/5" : "border-slate-300 text-slate-700"}`}>{fromDate ? formatDate(fromDate) : "From"}</button>
                                {openCalendar === "from" && <CalendarPopover type="from" />}
                            </div>
                            <div className="relative">
                                <button onClick={() => openDatePicker("to")} className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl border bg-white px-6 py-3 text-sm font-semibold shadow-sm ${openCalendar === "to" ? "border-slate-900 text-slate-900 ring-2 ring-slate-900/5" : "border-slate-300 text-slate-700"}`}>{toDate ? formatDate(toDate) : "To"}</button>
                                {openCalendar === "to" && <CalendarPopover type="to" />}
                            </div>
                            <button onClick={() => setOpenCalendar(null)} className="rounded-2xl bg-[#5E7F85] px-6 py-3 text-sm font-semibold text-white shadow-sm">Apply Filter</button>
                            <button className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm">Export All</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mx-6 mb-5 flex flex-col gap-3 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7F85]">Selected Report</div><div className="mt-1 text-lg font-bold text-slate-900">{activeReport}</div></div>
                <div className="max-w-2xl text-sm font-medium leading-6 text-slate-600">{activeSummaryMap[activeReport]}</div>
            </div>

            <div className="grid gap-4 px-6 pb-6 md:grid-cols-2 xl:grid-cols-4">
                {reportCards.map((report) => <div key={report.title} onClick={() => setActiveReport(report.title)} className={`group cursor-pointer rounded-[1.45rem] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#5E7F85]/30 hover:shadow-md ${activeReport === report.title ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-lg font-black text-[#5E7F85]">{report.icon}</div>
                        <Badge tone={report.badge === "Risk" ? "warn" : report.badge === "Profit" ? "good" : "brand"}>{report.badge}</Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">{report.title}</h3>
                    <div className="mt-5 flex gap-2">
                        <button onClick={(event) => { event.stopPropagation(); openReportAction("View", report); }} className="rounded-xl bg-[#5E7F85]/10 px-4 py-2.5 text-sm font-semibold text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">View</button>
                        <button onClick={(event) => { event.stopPropagation(); openReportAction("Download", report); }} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-stone-50">Download</button>
                    </div>
                </div>)}
            </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-slate-500">Insights Engine</div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">Business Intelligence</h2>
                <div className="mt-5 space-y-3">
                    {intelligence.map(([text, tag, icon]) => <div key={text} className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm">
                        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm shadow-sm">{icon}</span><span className="font-semibold text-slate-700">{text}</span></div>
                        <Badge tone={tag === "Risk" ? "warn" : tag === "Customer" ? "good" : "brand"}>{tag}</Badge>
                    </div>)}
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-slate-500">Action Planner</div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">Next Best Actions</h2>
                <div className="mt-5 space-y-3">
                    {nextActions.map(([text, sub], index) => <div key={text} className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm">
                        <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">{index + 1}</span><span><div className="font-semibold text-slate-700">{text}</div><div className="mt-1 text-xs text-[#5E7F85]">{sub}</div></span></div>
                        <button className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]">Review</button>
                    </div>)}
                </div>
            </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-slate-500">Segment Export</div>
                <h2 className="mt-1 text-xl font-bold tracking-tight">Smart Segment Export</h2>
                <div className="mt-5 space-y-3">
                    {exports.map((item) => <div key={item} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-slate-700">
                        <span>{item}</span>
                        <button className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]">Export</button>
                    </div>)}
                </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                    <div className="text-sm font-medium text-slate-500">Report Archive</div>
                    <h2 className="mt-1 text-xl font-bold tracking-tight">Generated Files</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <TableHead><tr>{["Report", "Date", "Owner", "Type", "Status", "Action"].map((head) => <th key={head} className="px-5 py-4 font-medium">{head}</th>)}</tr></TableHead>
                        <tbody>
                            {generatedFiles.map(([report, date, owner, type, status]) => <tr key={report} className="border-t border-slate-100 transition hover:bg-stone-50">
                                <td className="px-5 py-4 font-bold text-slate-900">{report}</td>
                                <td className="px-5 py-4 text-slate-600">{date}</td>
                                <td className="px-5 py-4 text-slate-600">{owner}</td>
                                <td className="px-5 py-4"><Badge tone="brand">{type}</Badge></td>
                                <td className="px-5 py-4"><Badge tone="good">{status}</Badge></td>
                                <td className="px-5 py-4"><ActionButtons actions={["Open", "Download"]} /></td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        {reportAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm font-medium text-slate-500">{reportAction.action === "View" ? "Report Preview" : "Download Center"}</div>
                        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{reportAction.report.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{activeSummaryMap[reportAction.report.title]}</p>
                    </div>
                    <button onClick={() => setReportAction(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">Close</button>
                </div>

                {reportAction.action === "View" ? <div className="mt-6">
                    <div className="grid gap-3 md:grid-cols-3">
                        {(reportPreviewRows[reportAction.report.title] || []).map(([label, value, note]) => <div key={label} className="rounded-2xl bg-stone-50 p-4">
                            <div className="text-xs font-semibold text-slate-500">{label}</div>
                            <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
                            <div className="mt-1 text-xs font-semibold text-[#5E7F85]">{note}</div>
                        </div>)}
                    </div>
                </div> : <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {["PDF", "CSV", "Excel"].map((type) => <button key={type} className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-5 text-center transition hover:border-[#5E7F85]/30 hover:bg-[#5E7F85]/5">
                        <div className="text-lg font-black text-slate-900">{type}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">Download {reportAction.report.title}</div>
                    </button>)}
                </div>}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button onClick={() => setReportAction(null)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Close</button>
                    <button onClick={() => setReportAction({ action: reportAction.action === "View" ? "Download" : "View", report: reportAction.report })} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">{reportAction.action === "View" ? "Open Download Options" : "View Preview"}</button>
                </div>
            </div>
        </div>}
    </div>;
}
