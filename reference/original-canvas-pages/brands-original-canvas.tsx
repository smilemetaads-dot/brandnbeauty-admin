// REFERENCE ONLY.
// Original Canvas Brands design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Brands page.
/* eslint-disable */
// @ts-nocheck

/* Exact page component snippet extracted from brandnbeauty_admin_panel_preview (2)(10).jsx. */

function BrandsManagementPage() {
  // LOCKED: Brands page frozen for current phase. Revisit only if user explicitly says to unlock Brands page first.
  const initialBrands = [
    { id: "cosrx", name: "COSRX", slug: "cosrx", status: "Featured", type: "Official", origin: "South Korea", products: 28, active: 24, hidden: 4, revenue: 242000, margin: "42%", seo: 88, logo: "Ready", banner: "Ready", featured: true, sort: 1, visibility: "Visible" },
    { id: "some-by-mi", name: "Some By Mi", slug: "some-by-mi", status: "Active", type: "Imported", origin: "South Korea", products: 16, active: 14, hidden: 2, revenue: 124000, margin: "38%", seo: 82, logo: "Ready", banner: "Needs Banner", featured: false, sort: 2, visibility: "Visible" },
    { id: "the-derma-plus", name: "The Derma Plus", slug: "the-derma-plus", status: "Owned", type: "Owned", origin: "Bangladesh", products: 12, active: 12, hidden: 0, revenue: 312000, margin: "62%", seo: 76, logo: "Ready", banner: "Ready", featured: true, sort: 3, visibility: "Visible" },
    { id: "beauty-of-joseon", name: "Beauty of Joseon", slug: "beauty-of-joseon", status: "Active", type: "Imported", origin: "South Korea", products: 9, active: 7, hidden: 2, revenue: 92000, margin: "34%", seo: 64, logo: "Missing", banner: "Draft", featured: false, sort: 4, visibility: "Visible" },
    { id: "simple", name: "Simple", slug: "simple", status: "Hidden", type: "Imported", origin: "UK", products: 8, active: 5, hidden: 3, revenue: 48000, margin: "35%", seo: 58, logo: "Needs Logo", banner: "Missing", featured: false, sort: 5, visibility: "Hidden" },
  ];
  const [brands] = useState(initialBrands);
  const [selectedBrandId, setSelectedBrandId] = useState("cosrx");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [actionModal, setActionModal] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [range, setRange] = useState("30D");
  const [openCalendar, setOpenCalendar] = useState(null);
  const [fromDate, setFromDate] = useState(new Date(2026, 3, 1));
  const [toDate, setToDate] = useState(new Date(2026, 3, 30));
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 3, 1));
  const [brandDraft, setBrandDraft] = useState({ name: "", slug: "", status: "Active", type: "Imported", origin: "South Korea", visibility: "Visible", featured: false, sort: "5", seoTitle: "", metaDescription: "", logo: "Ready", banner: "Ready", about: "", whyChoose: "", authenticityNote: "" });

  const brandRevenueByRange = {
    Today: { cosrx: 18500, "some-by-mi": 9200, "the-derma-plus": 24500, "beauty-of-joseon": 6800, simple: 3100 },
    "7D": { cosrx: 84500, "some-by-mi": 38200, "the-derma-plus": 102000, "beauty-of-joseon": 24800, simple: 13200 },
    "30D": { cosrx: 242000, "some-by-mi": 124000, "the-derma-plus": 312000, "beauty-of-joseon": 92000, simple: 48000 },
    "This Month": { cosrx: 268000, "some-by-mi": 137500, "the-derma-plus": 338000, "beauty-of-joseon": 96500, simple: 52200 },
    Custom: { cosrx: 156000, "some-by-mi": 72000, "the-derma-plus": 204000, "beauty-of-joseon": 54500, simple: 28600 },
  };
  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const formatMonth = (date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const moveMonth = (amount) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const moveYear = (amount) => setCalendarMonth((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
  const openDatePicker = (type) => {
    const selectedDate = type === "from" ? fromDate : toDate;
    if (selectedDate) setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setOpenCalendar(openCalendar === type ? null : type);
  };
  const setCalendarDate = (type, day) => {
    const value = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    if (type === "from") setFromDate(value);
    if (type === "to") setToDate(value);
    setRange("Custom");
    setOpenCalendar(null);
  };
  const clearCalendarDate = (type) => {
    if (type === "from") setFromDate(null);
    if (type === "to") setToDate(null);
    setRange("Custom");
  };
  const setTodayDate = (type) => {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    if (type === "from") setFromDate(today);
    if (type === "to") setToDate(today);
    setRange("Custom");
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
        <button type="button" onClick={() => moveYear(-1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">«</button>
        <button type="button" onClick={() => moveMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">‹</button>
        <div className="flex-1 text-center text-sm font-bold text-slate-900">{formatMonth(calendarMonth)}</div>
        <button type="button" onClick={() => moveMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">›</button>
        <button type="button" onClick={() => moveYear(1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-stone-50">»</button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-slate-400">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-1">{day}</div>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }).map((_, index) => <div key={`blank-${index}`} />)}
        {days.map((day) => {
          const activeDay = value && value.getFullYear() === year && value.getMonth() === month && value.getDate() === day;
          const today = new Date();
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          return <button key={day} type="button" onClick={() => setCalendarDate(type, day)} className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition ${activeDay ? "bg-[#5E7F85] text-white" : isToday ? "border border-[#5E7F85]/40 bg-[#5E7F85]/10 text-[#5E7F85]" : "bg-stone-50 text-slate-700 hover:bg-[#5E7F85]/10 hover:text-[#5E7F85]"}`}>{day}</button>;
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <button type="button" onClick={() => clearCalendarDate(type)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-stone-50">Clear</button>
        <button type="button" onClick={() => setTodayDate(type)} className="rounded-xl bg-[#5E7F85]/10 px-4 py-2 text-xs font-semibold text-[#5E7F85] hover:bg-[#5E7F85]/15">Today</button>
      </div>
    </div>;
  };
  const dateLabel = range === "Custom" ? `${fromDate ? formatDate(fromDate) : "From"} → ${toDate ? formatDate(toDate) : "To"}` : range;
  const getBrandRevenue = (brand) => brandRevenueByRange[range]?.[brand.id] ?? brand.revenue;
  const brandsWithRevenue = brands.map((brand) => ({ ...brand, filteredRevenue: getBrandRevenue(brand) }));
  const selected = brandsWithRevenue.find((item) => item.id === selectedBrandId) || brandsWithRevenue[0];
  const totalRevenue = brandsWithRevenue.reduce((sum, item) => sum + item.filteredRevenue, 0);
  const featuredCount = brands.filter((item) => item.featured).length;
  const ownedCount = brands.filter((item) => item.type === "Owned").length;
  const needsSeo = brands.filter((item) => item.seo < 75 || item.logo !== "Ready" || item.banner !== "Ready").length;
  const topProductsMap = {
    cosrx: ["Low pH Good Morning Gel Cleanser", "Advanced Snail Mucin", "BHA Blackhead Power Liquid", "Aloe Soothing Sun Cream"],
    "some-by-mi": ["AHA BHA PHA Toner", "Acne Clear Foam", "Miracle Serum"],
    "the-derma-plus": ["Kojic Body Wash", "Glutathione Body Wash", "Vitamin C Serum"],
    "beauty-of-joseon": ["Relief Sun", "Glow Serum", "Dynasty Cream"],
    simple: ["Hydrating Light Moisturizer", "Refreshing Facial Wash", "Micellar Gel Wash"],
  };

  const filtered = brandsWithRevenue.filter((brand) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || `${brand.name} ${brand.slug} ${brand.status} ${brand.type} ${brand.origin}`.toLowerCase().includes(q);
    const matchesFilter = filter === "All" || brand.status === filter || brand.type === filter || brand.visibility === filter || (filter === "Featured" && brand.featured) || (filter === "Needs Work" && (brand.seo < 75 || brand.logo !== "Ready" || brand.banner !== "Ready"));
    return matchesSearch && matchesFilter;
  });
  const topBrandRevenue = [...brandsWithRevenue].sort((a, b) => b.filteredRevenue - a.filteredRevenue)[0];
  const revenueShare = (value) => totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0;

  const openBrandForm = (brand = null) => {
    setEditingBrand(brand);
    setBrandDraft(brand ? {
      name: brand.name,
      slug: brand.slug,
      status: brand.status,
      type: brand.type,
      origin: brand.origin,
      visibility: brand.visibility,
      featured: brand.featured,
      sort: String(brand.sort),
      seoTitle: `${brand.name} Products Price in Bangladesh | BrandnBeauty`,
      metaDescription: `Shop authentic ${brand.name} products in Bangladesh from BrandnBeauty with COD and fast delivery.`,
      logo: brand.logo,
      banner: brand.banner,
      about: `${brand.name} is a trusted beauty brand available at BrandnBeauty with authentic product selection and customer-friendly delivery support.`,
      whyChoose: `Choose ${brand.name} for curated products, verified sourcing, clear pricing and routine-friendly beauty shopping.`,
      authenticityNote: `${brand.name} products should be checked for supplier source, batch information and original packaging before storefront promotion.`,
    } : { name: "", slug: "", status: "Active", type: "Imported", origin: "South Korea", visibility: "Visible", featured: false, sort: "5", seoTitle: "", metaDescription: "", logo: "Ready", banner: "Ready", about: "", whyChoose: "", authenticityNote: "" });
    setActionModal(brand ? "Edit Brand" : "Add Brand");
  };

  const updateDraftName = (value) => setBrandDraft({ ...brandDraft, name: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") });
  const brandSeoChecks = [
    { label: "Clean brand slug", ok: Boolean(brandDraft.slug && !brandDraft.slug.includes(" ")) },
    { label: "SEO title added", ok: Boolean(brandDraft.seoTitle) },
    { label: "Meta description added", ok: Boolean(brandDraft.metaDescription) },
    { label: "Logo ready", ok: brandDraft.logo === "Ready" },
    { label: "Banner ready", ok: brandDraft.banner === "Ready" },
    { label: "Brand about copy added", ok: Boolean(brandDraft.about) },
  ];

  return <div className="space-y-6">
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">Catalog</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Brands Control Room</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage brand landing pages, logo/banner assets, SEO health, homepage featured brands, product mapping and date-wise brand revenue.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActionModal("Import Brands")} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Import</button>
          <button onClick={() => setActionModal("Export Brands")} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Export</button>
          <button onClick={() => openBrandForm()} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Add Brand</button>
        </div>
      </div>
      <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Filtered revenue: <b className="text-[#5E7F85]">৳{totalRevenue.toLocaleString()}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Date view: <b className="text-slate-900">{dateLabel}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Top brand: <b className="text-emerald-700">{topBrandRevenue?.name}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Needs work: <b className="text-amber-700">{needsSeo}</b></div>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[["Filtered Revenue", `৳${totalRevenue.toLocaleString()}`, dateLabel], ["Top Brand", topBrandRevenue?.name || "—", `৳${(topBrandRevenue?.filteredRevenue || 0).toLocaleString()}`], ["Featured Brands", String(featuredCount), "Homepage visible"], ["Brand SEO Work", String(needsSeo), "Logo/banner/meta"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} active={item[0] === "Filtered Revenue" || item[0] === "Top Brand"} />)}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3"><h2 className="text-xl font-bold tracking-tight">Brand Revenue Directory</h2><Badge tone="brand">Date Wise</Badge></div>
              <p className="mt-2 text-sm text-slate-500">Control brand visibility, SEO readiness, product mapping and revenue by selected date range.</p>
            </div>
            <div className="flex flex-wrap gap-2"><button onClick={() => setActionModal("Bulk Featured Update")} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Bulk Featured</button><button onClick={() => openBrandForm()} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Add Brand</button></div>
          </div>
          <div className="mt-5 overflow-visible rounded-[1.6rem] border border-[#5E7F85]/15 bg-gradient-to-br from-[#5E7F85]/5 via-white to-stone-50 p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E7F85]">Revenue Date Filter</div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{dateLabel}</div>
              </div>
              <div className="flex flex-col items-start gap-3 xl:items-end">
                <div className="flex flex-wrap gap-2">{["Today", "7D", "30D", "This Month"].map((item) => <button key={item} onClick={() => { setRange(item); setOpenCalendar(null); }} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${range === item ? "bg-[#5E7F85] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-stone-50"}`}>{item}</button>)}</div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <button onClick={() => openDatePicker("from")} className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl border bg-white px-6 py-3 text-sm font-semibold shadow-sm ${openCalendar === "from" ? "border-slate-900 text-slate-900 ring-2 ring-slate-900/5" : "border-slate-300 text-slate-700"}`}>🗓️ {fromDate ? formatDate(fromDate) : "From"}</button>
                    {openCalendar === "from" && <CalendarPopover type="from" />}
                  </div>
                  <div className="relative">
                    <button onClick={() => openDatePicker("to")} className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl border bg-white px-6 py-3 text-sm font-semibold shadow-sm ${openCalendar === "to" ? "border-slate-900 text-slate-900 ring-2 ring-slate-900/5" : "border-slate-300 text-slate-700"}`}>🗓️ {toDate ? formatDate(toDate) : "To"}</button>
                    {openCalendar === "to" && <CalendarPopover type="to" />}
                  </div>
                  <button onClick={() => { setRange("Custom"); setOpenCalendar(null); }} className="rounded-2xl bg-[#5E7F85] px-6 py-3 text-sm font-semibold text-white shadow-sm">Apply Filter</button>
                  <button onClick={() => { setRange("30D"); setOpenCalendar(null); }} className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm">Reset</button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="relative max-w-xl"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand / slug / country / type..." className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span></div>
            <div className="flex flex-wrap gap-2">{["All", "Featured", "Active", "Owned", "Imported", "Official", "Hidden", "Needs Work"].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${filter === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <TableHead><tr>{["Brand", "Type", "Products", "Revenue", "Share", "SEO", "Assets", "Status", "Action"].map((head) => <th key={head} className="px-5 py-4 font-medium">{head}</th>)}</tr></TableHead>
            <tbody>
              {filtered.map((row) => <tr key={row.id} onClick={() => setSelectedBrandId(row.id)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${selectedBrandId === row.id ? "bg-[#5E7F85]/5 shadow-[inset_3px_0_0_#5E7F85]" : row.seo < 75 ? "bg-amber-50/25" : "bg-white"}`}>
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold ${row.logo === "Ready" ? "bg-[#5E7F85]/10 text-[#5E7F85]" : "bg-amber-50 text-amber-700"}`}>{row.name.slice(0, 2).toUpperCase()}</div><div><div className="font-bold text-slate-900">{row.name}</div><div className="text-xs text-slate-500">/brand/{row.slug} • {row.origin}</div></div></div></td>
                <td className="px-5 py-4"><Badge tone={row.type === "Owned" ? "brand" : row.type === "Official" ? "good" : "default"}>{row.type}</Badge></td>
                <td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.products}</div><div className="mt-1 text-xs text-slate-500">{row.active} active • {row.hidden} hidden</div></td>
                <td className="px-5 py-4"><div className="font-bold text-slate-900">৳{row.filteredRevenue.toLocaleString()}</div><div className="mt-1 text-xs text-slate-500">{dateLabel}</div></td>
                <td className="px-5 py-4"><div className="min-w-[96px]"><div className="mb-1 text-xs font-bold text-[#5E7F85]">{revenueShare(row.filteredRevenue)}%</div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${revenueShare(row.filteredRevenue)}%` }} /></div></div></td>
                <td className="px-5 py-4"><Badge tone={row.seo >= 80 ? "good" : row.seo >= 70 ? "warn" : "bad"}>{row.seo}/100</Badge></td>
                <td className="px-5 py-4"><div className="flex flex-wrap gap-1"><Badge tone={row.logo === "Ready" ? "good" : "warn"}>Logo</Badge><Badge tone={row.banner === "Ready" ? "good" : "warn"}>Banner</Badge></div></td>
                <td className="px-5 py-4"><Badge tone={row.status === "Hidden" ? "bad" : row.status === "Owned" ? "brand" : "good"}>{row.status}</Badge></td>
                <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-2"><button onClick={() => openBrandForm(row)} className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white">Edit</button><button onClick={() => { setSelectedBrandId(row.id); setActionModal("Open Brand Page"); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50">Open</button></div></td>
              </tr>)}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-5 py-14 text-center text-sm text-slate-500">No brands found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium text-slate-500">Brand Page Preview</div><h3 className="mt-1 text-xl font-bold tracking-tight">{selected.name}</h3><div className="mt-1 text-xs text-slate-500">/brand/{selected.slug}</div></div><Badge tone={selected.featured ? "brand" : "default"}>{selected.featured ? "Featured" : "Normal"}</Badge></div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" /><div className="absolute -bottom-10 left-1/2 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-lg font-black">{selected.name.slice(0, 2).toUpperCase()}</div><div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Featured Brand</div><div className="mt-2 text-3xl font-black tracking-tight">{selected.name}</div><div className="mt-2 text-sm text-white/85">Authentic products • COD • Fast delivery</div><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{selected.products} products</span><span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{selected.origin}</span></div></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><Badge tone="brand">SEO {selected.seo}/100</Badge><Badge tone={selected.logo === "Ready" ? "good" : "warn"}>{selected.logo}</Badge><Badge tone={selected.banner === "Ready" ? "good" : "warn"}>{selected.banner}</Badge></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[["Products", selected.products], ["Revenue", `৳${selected.filteredRevenue.toLocaleString()}`], ["Share", `${revenueShare(selected.filteredRevenue)}%`], ["Date View", dateLabel]].map(([label, value]) => <div key={label} className="rounded-2xl bg-stone-50 p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-bold">{value}</div></div>)}
          </div>
          <div className="mt-5 grid gap-3"><button onClick={() => openBrandForm(selected)} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Edit Brand</button><button onClick={() => setActionModal("SEO Settings")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">SEO Settings</button><button onClick={() => setActionModal("Upload Logo / Banner")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Upload Logo / Banner</button></div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Product Mapping</div><h3 className="mt-1 text-xl font-bold tracking-tight">Top Brand Products</h3>
          <div className="mt-4 space-y-2">{(topProductsMap[selected.id] || []).map((item, index) => <div key={item} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-xs"><span className="font-bold text-slate-700">{item}</span><span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">#{index + 1}</span></div>)}</div>
          <div className="mt-5 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4">
            <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-600">Selected range revenue</span><b className="text-[#5E7F85]">৳{selected.filteredRevenue.toLocaleString()}</b></div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${revenueShare(selected.filteredRevenue)}%` }} /></div>
            <div className="mt-2 text-xs font-semibold text-slate-500">{revenueShare(selected.filteredRevenue)}% of total brand revenue in {dateLabel}</div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={() => setActionModal("Map Products")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Map Products</button><button onClick={() => setActionModal("Featured Sort Order")} className="rounded-2xl bg-[#5E7F85]/10 px-4 py-3 text-sm font-semibold text-[#5E7F85]">Featured Order</button></div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Brand Revenue Ranking</div><h3 className="mt-1 text-xl font-bold tracking-tight">{dateLabel}</h3>
          <div className="mt-4 space-y-3">{[...brandsWithRevenue].sort((a, b) => b.filteredRevenue - a.filteredRevenue).map((brand, index) => <button key={brand.id} onClick={() => setSelectedBrandId(brand.id)} className={`w-full rounded-2xl px-4 py-3 text-left text-xs transition ${selected.id === brand.id ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15" : "bg-stone-50 hover:bg-stone-100"}`}><div className="flex items-center justify-between gap-3"><span className="font-bold text-slate-800">#{index + 1} {brand.name}</span><span className="font-black text-[#5E7F85]">৳{brand.filteredRevenue.toLocaleString()}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${revenueShare(brand.filteredRevenue)}%` }} /></div></button>)}</div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm"><div className="text-sm font-bold text-amber-800">SEO + Storefront Note</div><div className="mt-2 text-sm leading-6 text-amber-700">Every visible brand should have clean slug, logo, banner, SEO title, meta description, featured sorting and mapped active products before showing strongly on storefront.</div></div>
      </div>
    </div>

    {actionModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">Brand Action</div><h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{actionModal}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{actionModal === "Add Brand" || actionModal === "Edit Brand" ? "Brand landing page, logo, SEO and homepage featured control ready for database integration." : `Selected brand: ${selected.name}`}</p></div><button onClick={() => setActionModal(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">✕</button></div>
        {(actionModal === "Add Brand" || actionModal === "Edit Brand") ? <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Brand Name<input value={brandDraft.name} onChange={(e) => updateDraftName(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="COSRX" /></label>
          <label className="text-sm font-semibold text-slate-700">Slug<input value={brandDraft.slug || "auto-generated-slug"} onChange={(e) => setBrandDraft({ ...brandDraft, slug: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none" /></label>
          <label className="text-sm font-semibold text-slate-700">Brand Type<select value={brandDraft.type} onChange={(e) => setBrandDraft({ ...brandDraft, type: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Official</option><option>Imported</option><option>Owned</option><option>Marketplace</option></select></label>
          <label className="text-sm font-semibold text-slate-700">Origin Country<input value={brandDraft.origin} onChange={(e) => setBrandDraft({ ...brandDraft, origin: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
          <label className="text-sm font-semibold text-slate-700">Status<select value={brandDraft.status} onChange={(e) => setBrandDraft({ ...brandDraft, status: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Active</option><option>Featured</option><option>Owned</option><option>Hidden</option></select></label>
          <label className="text-sm font-semibold text-slate-700">Storefront Visibility<select value={brandDraft.visibility} onChange={(e) => setBrandDraft({ ...brandDraft, visibility: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Visible</option><option>Hidden</option></select></label>
          <div className="text-sm font-semibold text-slate-700">
            Brand Logo
            <div className={`mt-2 rounded-2xl border border-dashed p-4 ${brandDraft.logo === "Ready" ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-stone-50"}`}>
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-white text-lg font-black text-[#5E7F85] shadow-sm">{brandDraft.name ? brandDraft.name.slice(0, 2).toUpperCase() : "LG"}</div>
              <div className="mt-3 flex gap-2"><button type="button" onClick={() => setBrandDraft({ ...brandDraft, logo: "Ready" })} className="flex-1 rounded-xl bg-[#5E7F85] px-3 py-2 text-xs font-bold text-white">Upload</button><button type="button" onClick={() => setBrandDraft({ ...brandDraft, logo: "Missing" })} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700">Remove</button></div>
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            Brand Banner
            <div className={`mt-2 rounded-2xl border border-dashed p-4 ${brandDraft.banner === "Ready" ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-stone-50"}`}>
              <div className="flex aspect-[3/1] items-center justify-center rounded-2xl bg-gradient-to-r from-[#5E7F85] to-[#d9e5e1] text-xs font-black text-white shadow-sm">{brandDraft.banner === "Ready" ? "Banner Ready" : "Upload 3:1 Banner"}</div>
              <div className="mt-3 flex gap-2"><button type="button" onClick={() => setBrandDraft({ ...brandDraft, banner: "Ready" })} className="flex-1 rounded-xl bg-[#5E7F85] px-3 py-2 text-xs font-bold text-white">Upload</button><button type="button" onClick={() => setBrandDraft({ ...brandDraft, banner: "Missing" })} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700">Remove</button></div>
            </div>
          </div>
          <label className="text-sm font-semibold text-slate-700">Sort Order<input value={brandDraft.sort} onChange={(e) => setBrandDraft({ ...brandDraft, sort: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
          <label className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">Homepage Featured<button onClick={() => setBrandDraft({ ...brandDraft, featured: !brandDraft.featured })} className={`rounded-full px-4 py-2 text-xs font-bold ${brandDraft.featured ? "bg-[#5E7F85] text-white" : "bg-white text-slate-500"}`}>{brandDraft.featured ? "ON" : "OFF"}</button></label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">SEO Title<input value={brandDraft.seoTitle} onChange={(e) => setBrandDraft({ ...brandDraft, seoTitle: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder={`${brandDraft.name || "Brand"} Products Price in Bangladesh | BrandnBeauty`} /></label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">Meta Description<textarea value={brandDraft.metaDescription} onChange={(e) => setBrandDraft({ ...brandDraft, metaDescription: e.target.value })} className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Write brand landing meta description..." /></label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">Brand About / Intro<textarea value={brandDraft.about} onChange={(e) => setBrandDraft({ ...brandDraft, about: e.target.value })} className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Short brand intro for frontend brand landing page..." /></label>
          <label className="text-sm font-semibold text-slate-700">Why Choose This Brand<textarea value={brandDraft.whyChoose} onChange={(e) => setBrandDraft({ ...brandDraft, whyChoose: e.target.value })} className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Quality, popularity, routine fit..." /></label>
          <label className="text-sm font-semibold text-slate-700">Authenticity Note<textarea value={brandDraft.authenticityNote} onChange={(e) => setBrandDraft({ ...brandDraft, authenticityNote: e.target.value })} className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Official/imported/source verification note..." /></label>
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3"><div className="text-sm font-bold text-slate-900">Brand SEO Checklist</div><Badge tone={brandSeoChecks.every((item) => item.ok) ? "good" : "warn"}>{brandSeoChecks.filter((item) => item.ok).length}/{brandSeoChecks.length}</Badge></div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">{brandSeoChecks.map((item) => <div key={item.label} className={`rounded-xl px-3 py-2 text-xs font-semibold ${item.ok ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-500"}`}>{item.ok ? "✅" : "○"} {item.label}</div>)}</div>
          </div>
        </div> : <div className="mt-6 grid gap-3 md:grid-cols-2">{["Brand landing preview", "Logo and banner upload", "SEO title and meta", "Homepage featured sorting", "Product mapping", "Storefront visibility"].map((item) => <div key={item} className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700">✓ {item}</div>)}</div>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setActionModal(null)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Close</button><button onClick={() => setActionModal(null)} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">{actionModal === "Edit Brand" ? "Save Changes" : actionModal === "Add Brand" ? "Save Brand" : "Confirm"}</button></div>
      </div>
    </div>}
  </div>;
}
