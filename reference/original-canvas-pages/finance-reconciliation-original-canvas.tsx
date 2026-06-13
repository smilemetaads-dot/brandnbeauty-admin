// REFERENCE ONLY.
// Original Canvas Finance Reconciliation design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Finance Reconciliation page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react-hooks/static-components, react/jsx-no-undef */
// @ts-nocheck

function FinanceReconciliationPage() {
    // LOCKED: Finance Reconciliation page frozen for current phase. Revisit only for real courier import/export and settlement backend integration.
    const [mode, setMode] = useState("Courier COD");
    const [selectedRow, setSelectedRow] = useState(null);
    const [dateFilter, setDateFilter] = useState("Today");
    const [openCalendar, setOpenCalendar] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 3, 1));

    const formatDate = (date) => {
        if (!date) return "";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    const formatMonth = (date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const moveMonth = (amount) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
    const moveYear = (amount) => setCalendarMonth((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
    const openDatePicker = (type) => {
        const selected = type === "from" ? fromDate : toDate;
        if (selected) setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
        setOpenCalendar(openCalendar === type ? null : type);
    };
    const setCalendarDate = (type, day) => {
        const value = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        if (type === "from") setFromDate(value);
        if (type === "to") setToDate(value);
        setDateFilter("Custom");
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
        setDateFilter("Custom");
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
    const summary = [
        ["Expected COD", "BDT 1,82,500", "From delivered parcels"],
        ["Received", "BDT 1,48,900", "Courier remittance"],
        ["Mismatch", "BDT 18,600", "Needs review"],
        ["Pending Settlement", "BDT 15,000", "Awaiting courier"],
    ];
    const rows = [
        { id: "#1021", customer: "Sadia Akter", courier: "Steadfast", expected: 1810, received: 1810, charge: 120, status: "Matched", date: "Today" },
        { id: "#1018", customer: "Raisa Khan", courier: "Pathao", expected: 910, received: 0, charge: 70, status: "Pending", date: "Today" },
        { id: "#1012", customer: "Ayesha Siddika", courier: "Steadfast", expected: 1900, received: 1500, charge: 120, status: "Mismatch", date: "Yesterday" },
        { id: "#1009", customer: "Mitu Islam", courier: "Steadfast", expected: 0, received: 0, charge: 130, status: "Returned", date: "Apr 25" },
    ];
    const visibleRows = rows.filter((row) => {
        const matchesMode = mode === "All" || (mode === "Mismatch" ? row.status === "Mismatch" : mode === "Pending" ? row.status === "Pending" : true);
        const matchesQuickDate = dateFilter === "All" || (dateFilter === "Today" ? row.date === "Today" : dateFilter === "Yesterday" ? row.date === "Yesterday" : true);
        return matchesMode && matchesQuickDate;
    });
    const totalExpected = rows.reduce((sum, row) => sum + row.expected, 0);
    const totalReceived = rows.reduce((sum, row) => sum + row.received, 0);
    const collectionRate = Math.round((totalReceived / Math.max(1, totalExpected)) * 100);

    return <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summary.map((item, index) => <StatCard key={item[0]} item={item} index={index} active={item[0] === "Mismatch" || item[0] === "Pending Settlement"} />)}
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Finance Reconciliation Control Room</h2>
                    <div className="mt-2 text-sm text-slate-500">Match courier COD, payment received, delivery charge and mismatch records.</div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold shadow-sm">Import Courier Sheet</button>
                    <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold shadow-sm">Export CSV</button>
                    <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">Mark Reviewed</button>
                </div>
            </div>
            <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Collection rate: <b className="text-[#5E7F85]">{collectionRate}%</b></div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Mismatch orders: <b className="text-rose-700">1</b></div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Date view: <b className="text-amber-700">{dateFilter === "Custom" ? `${fromDate ? formatDate(fromDate) : "From"} to ${toDate ? formatDate(toDate) : "To"}` : dateFilter}</b></div>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
            {["Courier COD", "Mismatch", "Pending", "All"].map((tab) => <button key={tab} onClick={() => setMode(tab)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === tab ? "bg-[#5E7F85] text-white shadow-sm" : "text-slate-600 hover:bg-stone-50"}`}>{tab}</button>)}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="overflow-visible rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-500">Settlement Matching</div>
                            <h2 className="mt-1 text-xl font-bold tracking-tight">Courier Payment Reconciliation</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Resolve Selected</button>
                        </div>
                    </div>
                    <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-stone-50 p-3 overflow-visible">
                        <div className="flex flex-wrap items-center gap-2">
                            {["Today", "Yesterday", "7D", "30D", "This Month", "All"].map((item) => <button key={item} onClick={() => setDateFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${dateFilter === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-white"}`}>{item}</button>)}
                            <div className="relative">
                                <button onClick={() => openDatePicker("from")} className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-full border bg-white px-4 py-2 text-xs font-semibold shadow-sm ${openCalendar === "from" ? "border-slate-900 text-slate-900 ring-2 ring-slate-900/5" : "border-slate-200 text-slate-700"}`}>{fromDate ? formatDate(fromDate) : "From"}</button>
                                {openCalendar === "from" && <CalendarPopover type="from" />}
                            </div>
                            <div className="relative">
                                <button onClick={() => openDatePicker("to")} className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-full border bg-white px-4 py-2 text-xs font-semibold shadow-sm ${openCalendar === "to" ? "border-slate-900 text-slate-900 ring-2 ring-slate-900/5" : "border-slate-200 text-slate-700"}`}>{toDate ? formatDate(toDate) : "To"}</button>
                                {openCalendar === "to" && <CalendarPopover type="to" />}
                            </div>
                            <button onClick={() => setDateFilter("Custom")} className={`rounded-full px-4 py-2 text-xs font-semibold ${dateFilter === "Custom" ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-white"}`}>Apply</button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <TableHead><tr>{["Order", "Customer", "Courier", "Expected", "Received", "Charge", "Difference", "Status", "Action"].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></TableHead>
                        <tbody>{visibleRows.map((row) => {
                            const diff = row.expected - row.received;
                            return <tr key={row.id} onClick={() => setSelectedRow(row)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${row.status === "Mismatch" ? "bg-rose-50/30" : row.status === "Pending" ? "bg-amber-50/30" : row.status === "Matched" ? "bg-emerald-50/25" : "bg-white"}`}>
                                <td className="px-5 py-4 font-bold text-slate-900">{row.id}</td>
                                <td className="px-5 py-4"><div className="font-semibold text-slate-800">{row.customer}</div><div className="text-xs text-slate-500">{row.date}</div></td>
                                <td className="px-5 py-4"><Badge tone="brand">{row.courier}</Badge></td>
                                <td className="px-5 py-4 font-semibold">BDT {row.expected}</td>
                                <td className="px-5 py-4 font-semibold">BDT {row.received}</td>
                                <td className="px-5 py-4">BDT {row.charge}</td>
                                <td className="px-5 py-4 font-bold"><span className={diff > 0 ? "text-rose-600" : "text-emerald-700"}>BDT {diff}</span></td>
                                <td className="px-5 py-4"><Badge tone={getStatusTone(row.status)}>{row.status}</Badge></td>
                                <td className="px-5 py-4"><ActionButtons actions={["Open", "Match"]} /></td>
                            </tr>;
                        })}
                            {visibleRows.length === 0 && <tr><td colSpan={10} className="px-5 py-14 text-center text-sm text-slate-500">No reconciliation records found for selected filters.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-medium text-slate-500">Collection Health</div>
                    <h3 className="mt-1 text-xl font-bold tracking-tight">COD Collection</h3>
                    <div className="mt-5 flex items-center justify-center"><div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-stone-100"><div className="absolute inset-0 rounded-full border-8 border-[#5E7F85]" style={{ clipPath: `inset(${100 - collectionRate}% 0 0 0)` }} /><div className="text-center"><div className="text-2xl font-black text-[#5E7F85]">{collectionRate}%</div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Collected</div></div></div></div>
                    <div className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Expected</span><b>BDT {totalExpected.toLocaleString()}</b></div>
                        <div className="flex justify-between"><span className="text-slate-500">Received</span><b className="text-emerald-700">BDT {totalReceived.toLocaleString()}</b></div>
                        <div className="flex justify-between"><span className="text-slate-500">Pending/Diff</span><b className="text-rose-600">BDT {Math.max(0, totalExpected - totalReceived).toLocaleString()}</b></div>
                    </div>
                </div>

                {selectedRow && <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium text-slate-500">Selected Record</div><h3 className="mt-1 text-xl font-bold tracking-tight">{selectedRow.id}</h3></div><Badge tone={getStatusTone(selectedRow.status)}>{selectedRow.status}</Badge></div>
                    <div className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Customer</span><b>{selectedRow.customer}</b></div>
                        <div className="flex justify-between"><span className="text-slate-500">Expected</span><b>BDT {selectedRow.expected}</b></div>
                        <div className="flex justify-between"><span className="text-slate-500">Received</span><b>BDT {selectedRow.received}</b></div>
                        <div className="flex justify-between"><span className="text-slate-500">Courier</span><b>{selectedRow.courier}</b></div>
                    </div>
                    <div className="mt-5 grid gap-3"><button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Mark Matched</button><button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Add Adjustment Note</button></div>
                </div>}

                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                    <div className="text-sm font-bold text-amber-800">Finance Note</div>
                    <div className="mt-2 text-sm leading-6 text-amber-700">Mismatch records should be reviewed before marking courier payment as settled.</div>
                </div>
            </div>
        </div>
    </div>;
}
