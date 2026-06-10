// REFERENCE ONLY.
// Original Canvas Offers & Deals design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Offers & Deals page.
/* eslint-disable */
// @ts-nocheck

/* Exact page component snippet extracted from brandnbeauty_admin_panel_preview (2)(10).jsx. */

function OffersDealsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOfferId, setSelectedOfferId] = useState("bogo-cleanser");
  const [actionModal, setActionModal] = useState(null);
  const [rangeFilter, setRangeFilter] = useState("30D");
  const [fromDate, setFromDate] = useState("2026-05-01");
  const [toDate, setToDate] = useState("2026-05-31");
  const [selectedProducts, setSelectedProducts] = useState(["Acne Balance Facewash", "Barrier Calm Serum"]);
  const [offerDraft, setOfferDraft] = useState({ title: "", type: "Combo Offer", rule: "Fixed Discount", discount: "150", start: "2026-05-01", end: "2026-05-15", visibility: "PDP + Cart", channel: "Website + Messenger", badge: "Limited Deal", minOrder: "999", maxDiscount: "300", usageLimit: "200", customer: "All Customers", coupon: "GLOW150", messengerSync: true, autoPause: true });

  const offerCatalogProducts = [
    { name: "Acne Balance Facewash", price: 890, cost: 430, stock: 44, activeOffer: "BOGO Facewash" },
    { name: "Barrier Calm Serum", price: 990, cost: 420, stock: 18, activeOffer: "Glow Routine Combo" },
    { name: "Hydra Gel Moisturizer", price: 850, cost: 390, stock: 72, activeOffer: "None" },
    { name: "Daily Sun Gel", price: 1250, cost: 720, stock: 0, activeOffer: "Free Delivery" },
    { name: "Routine Bundle", price: 2020, cost: 920, stock: 12, activeOffer: "None" },
  ];

  const offers = [
    { id: "bogo-cleanser", title: "Buy 1 Get 1 Facewash Deal", type: "Buy 1 Get 1", products: 2, revenue: 42500, orders: 58, views: 1800, clicks: 248, discountCost: 11200, netProfit: 18300, discount: "1 Free", start: "May 01", end: "May 07", status: "Live", visibility: "Homepage", channel: "Website", margin: "42%", stock: "Safe", badge: "BOGO", conflict: "Watch" },
    { id: "glow-combo", title: "Glow Routine Combo", type: "Combo Offer", products: 3, revenue: 68400, orders: 44, views: 1420, clicks: 206, discountCost: 6600, netProfit: 31200, discount: "৳150 Off", start: "May 03", end: "May 18", status: "Live", visibility: "PDP + Cart", channel: "Website + Messenger", margin: "51%", stock: "Watch", badge: "Combo", conflict: "Conflict" },
    { id: "free-delivery", title: "Free Delivery Over ৳999", type: "Free Shipping", products: 128, revenue: 92200, orders: 76, views: 2600, clicks: 410, discountCost: 9120, netProfit: 37400, discount: "Delivery Free", start: "May 01", end: "May 31", status: "Scheduled", visibility: "Checkout", channel: "Website", margin: "Healthy", stock: "Safe", badge: "Free Delivery", conflict: "Safe" },
    { id: "clearance", title: "Clearance Stock Sale", type: "Clearance Sale", products: 14, revenue: 18800, orders: 21, views: 620, clicks: 88, discountCost: 8200, netProfit: 4100, discount: "Up to 40%", start: "Apr 25", end: "May 05", status: "Ending Soon", visibility: "Offers Page", channel: "Website", margin: "Low", stock: "Fast Moving", badge: "Clearance", conflict: "Watch" },
    { id: "messenger", title: "Messenger Exclusive Combo", type: "Messenger Deal", products: 2, revenue: 31200, orders: 33, views: 980, clicks: 154, discountCost: 3300, netProfit: 14600, discount: "৳100 Off", start: "May 02", end: "May 12", status: "Draft", visibility: "Hidden", channel: "Messenger", margin: "48%", stock: "Safe", badge: "Inbox Deal", conflict: "Safe" },
  ];

  const offerRangeMultiplier = { Today: 0.12, "7D": 0.42, "30D": 1, "This Month": 1.12, Custom: 0.74 };
  const activeMultiplier = offerRangeMultiplier[rangeFilter] || 1;
  const dateViewLabel = rangeFilter === "Custom" ? `${fromDate || "From"} → ${toDate || "To"}` : rangeFilter;
  const rangedOffers = offers.map((offer) => ({
    ...offer,
    revenue: Math.round(offer.revenue * activeMultiplier),
    orders: Math.max(1, Math.round(offer.orders * activeMultiplier)),
    discountCost: Math.round(offer.discountCost * activeMultiplier),
    netProfit: Math.round(offer.netProfit * activeMultiplier),
  }));
  const selected = rangedOffers.find((item) => item.id === selectedOfferId) || rangedOffers[0];
  const topPerformingOffers = [...rangedOffers].sort((a, b) => b.netProfit - a.netProfit).slice(0, 3);
  const filteredOffers = rangedOffers.filter((offer) => {
    const q = search.toLowerCase();
    const bySearch = !q || `${offer.title} ${offer.type} ${offer.status} ${offer.channel} ${offer.conflict}`.toLowerCase().includes(q);
    const byStatus = statusFilter === "All" || offer.status === statusFilter || offer.type === statusFilter || offer.visibility === statusFilter || offer.conflict === statusFilter;
    return bySearch && byStatus;
  });
  const totalRevenue = rangedOffers.reduce((sum, offer) => sum + offer.revenue, 0);
  const totalOrders = rangedOffers.reduce((sum, offer) => sum + offer.orders, 0);
  const totalNetProfit = rangedOffers.reduce((sum, offer) => sum + offer.netProfit, 0);
  const totalDiscountCost = rangedOffers.reduce((sum, offer) => sum + offer.discountCost, 0);
  const liveCount = rangedOffers.filter((offer) => offer.status === "Live").length;
  const endingSoon = rangedOffers.filter((offer) => offer.status === "Ending Soon").length;
  const conflictCount = rangedOffers.filter((offer) => offer.conflict === "Conflict").length;
  const topOffer = [...rangedOffers].sort((a, b) => b.revenue - a.revenue)[0];
  const conversionRate = Math.round((totalOrders / Math.max(1, rangedOffers.reduce((sum, offer) => sum + offer.clicks, 0))) * 100);
  const selectedProductRows = offerCatalogProducts.filter((item) => selectedProducts.includes(item.name));
  const draftSubtotal = selectedProductRows.reduce((sum, item) => sum + item.price, 0);
  const draftCost = selectedProductRows.reduce((sum, item) => sum + item.cost, 0);
  const draftDiscount = Number(offerDraft.discount || 0);
  const courierCost = offerDraft.rule === "Free Delivery" ? 100 : 80;
  const draftNetProfit = Math.max(draftSubtotal - draftCost - draftDiscount - courierCost, 0);
  const draftMargin = draftSubtotal > 0 ? Math.round((draftNetProfit / draftSubtotal) * 100) : 0;
  const stockSafe = selectedProductRows.every((item) => item.stock > 10);
  const productConflict = selectedProductRows.filter((item) => item.activeOffer !== "None");
  const safetyChecks = [
    { label: "Stock safe", ok: stockSafe },
    { label: "Margin protected", ok: draftMargin >= 35 },
    { label: "Date range valid", ok: Boolean(offerDraft.start && offerDraft.end) },
    { label: "No double discount", ok: productConflict.length === 0 },
    { label: "Storefront placement selected", ok: offerDraft.visibility !== "Hidden" },
    { label: "Automation rule set", ok: offerDraft.autoPause },
  ];
  const offerProducts = {
    "bogo-cleanser": ["Acne Balance Facewash", "Glow Support Cleanser"],
    "glow-combo": ["Barrier Calm Serum", "Hydra Gel Moisturizer", "Daily Sun Gel"],
    "free-delivery": ["All visible products above threshold"],
    clearance: ["Old Toner Sample", "Near expiry body wash", "Slow moving moisturizer"],
    messenger: ["Peeling Gel", "Brightening Soap"],
  };
  const createOffer = () => {
    setActionModal("Create Offer");
    setSelectedProducts(["Acne Balance Facewash", "Barrier Calm Serum"]);
    setOfferDraft({ title: "", type: "Combo Offer", rule: "Fixed Discount", discount: "150", start: "2026-05-01", end: "2026-05-15", visibility: "PDP + Cart", channel: "Website + Messenger", badge: "Limited Deal", minOrder: "999", maxDiscount: "300", usageLimit: "200", customer: "All Customers", coupon: "GLOW150", messengerSync: true, autoPause: true });
  };
  const editSelectedOffer = () => {
    setActionModal("Edit Offer");
    setSelectedProducts((offerProducts[selected.id] || []).filter((name) => offerCatalogProducts.some((item) => item.name === name)));
    setOfferDraft({ title: selected.title, type: selected.type, rule: selected.type === "Free Shipping" ? "Free Delivery" : selected.type === "Buy 1 Get 1" ? "BOGO" : "Fixed Discount", discount: String(selected.discountCost ? Math.round(selected.discountCost / Math.max(1, selected.orders)) : 150), start: "2026-05-01", end: "2026-05-15", visibility: selected.visibility === "Hidden" ? "Hidden" : selected.visibility, channel: selected.channel, badge: selected.badge, minOrder: "999", maxDiscount: "300", usageLimit: "200", customer: "All Customers", coupon: selected.badge.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8), messengerSync: selected.channel.includes("Messenger"), autoPause: true });
  };
  const toggleOfferProduct = (name) => setSelectedProducts((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  return <div className="space-y-6">
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15" />
        <div className="absolute bottom-0 left-1/2 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">Catalog Promotions</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Offers & Deals Control Room</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">Create BOGO, combo, clearance, free delivery and Messenger-only offers with stock, margin, conflict and automation safety control.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActionModal("Preview Offers Page")} className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">Preview Page</button>
            <button onClick={createOffer} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm">Create Offer</button>
          </div>
        </div>
      </div>
      <div className="grid gap-3 border-t border-white/20 bg-stone-50/80 p-4 text-sm md:grid-cols-5">
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Offer revenue: <b className="text-[#5E7F85]">৳{totalRevenue.toLocaleString()}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Net profit: <b className="text-emerald-700">৳{totalNetProfit.toLocaleString()}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Discount cost: <b className="text-amber-700">৳{totalDiscountCost.toLocaleString()}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Date view: <b className="text-slate-900">{dateViewLabel}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Conflict: <b className="text-rose-700">{conflictCount}</b></div>
      </div>
    </div>

    <div className="overflow-visible rounded-[1.7rem] border border-[#5E7F85]/15 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Campaign Period Filter</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">Performance numbers update based on selected offer period.</div>
        </div>
        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap gap-2">{["Today", "7D", "30D", "This Month"].map((item) => <button key={item} onClick={() => setRangeFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${rangeFilter === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-stone-50"}`}>{item}</button>)}</div>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setRangeFilter("Custom"); }} className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none" />
            <input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setRangeFilter("Custom"); }} className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none" />
            <button onClick={() => setRangeFilter("Custom")} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Apply</button>
          </div>
        </div>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard item={["Active Offers", String(liveCount), "Live on storefront"]} index={0} active />
      <StatCard item={["Offer Revenue", `৳${totalRevenue.toLocaleString()}`, topOffer.title]} index={1} />
      <StatCard item={["Conversion Rate", `${conversionRate}%`, "Clicks to order"]} index={2} />
      <StatCard item={["Ending / Conflict", `${endingSoon}/${conflictCount}`, "Need decision"]} index={3} active />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="text-sm font-medium text-slate-500">Promotion Engine</div><h2 className="mt-1 text-xl font-bold tracking-tight">Offer Campaign List</h2><div className="mt-2 text-sm text-slate-500">Manage discount rules, product mapping, margins, conflicts and storefront placement.</div></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => setActionModal("Bulk Schedule")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Bulk Schedule</button><button onClick={createOffer} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Create Offer</button></div>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="relative max-w-xl"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search offer / type / channel / conflict..." className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span></div>
            <div className="flex flex-wrap gap-2">{["All", "Live", "Scheduled", "Ending Soon", "Draft", "Buy 1 Get 1", "Combo Offer", "Clearance Sale", "Conflict", "Hidden"].map((item) => <button key={item} onClick={() => setStatusFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${statusFilter === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <TableHead><tr>{["Offer", "Type", "Revenue", "Profit", "Conv.", "Discount Cost", "Stock", "Conflict", "Status", "Action"].map((head) => <th key={head} className="px-5 py-4 font-medium">{head}</th>)}</tr></TableHead>
            <tbody>
              {filteredOffers.map((offer) => {
                const conv = Math.round((offer.orders / Math.max(1, offer.clicks)) * 100);
                return <tr key={offer.id} onClick={() => setSelectedOfferId(offer.id)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${selectedOfferId === offer.id ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]" : offer.conflict === "Conflict" ? "bg-rose-50/25" : offer.status === "Ending Soon" ? "bg-amber-50/30" : "bg-white"}`}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">%</div><div><div className="font-bold text-slate-900">{offer.title}</div><div className="mt-1 text-xs text-slate-500">{offer.badge} • {offer.channel} • {offer.visibility}</div></div></div></td>
                  <td className="px-5 py-4"><Badge tone="brand">{offer.type}</Badge></td>
                  <td className="px-5 py-4 font-bold text-slate-900">৳{offer.revenue.toLocaleString()}</td>
                  <td className="px-5 py-4 font-bold text-emerald-700">৳{offer.netProfit.toLocaleString()}</td>
                  <td className="px-5 py-4 font-semibold">{conv}%</td>
                  <td className="px-5 py-4 font-semibold text-amber-700">৳{offer.discountCost.toLocaleString()}</td>
                  <td className="px-5 py-4"><Badge tone={offer.stock === "Safe" ? "good" : "warn"}>{offer.stock}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={offer.conflict === "Conflict" ? "bad" : offer.conflict === "Watch" ? "warn" : "good"}>{offer.conflict}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={offer.status === "Live" ? "good" : offer.status === "Ending Soon" || offer.status === "Scheduled" ? "warn" : "default"}>{offer.status}</Badge></td>
                  <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-2"><button onClick={() => { setSelectedOfferId(offer.id); editSelectedOffer(); }} className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white">Edit</button><button onClick={() => { setSelectedOfferId(offer.id); setActionModal("Offer Preview"); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50">Open</button></div></td>
                </tr>;
              })}
              {filteredOffers.length === 0 && <tr><td colSpan={10} className="px-5 py-14 text-center text-sm text-slate-500">No offers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium text-slate-500">Selected Offer</div><h3 className="mt-1 text-xl font-bold tracking-tight">{selected.title}</h3><div className="mt-1 text-xs text-slate-500">{selected.type} • {selected.channel}</div></div><Badge tone={selected.status === "Live" ? "good" : selected.status === "Ending Soon" ? "warn" : "default"}>{selected.status}</Badge></div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#789ca2] to-[#d9e5e1] p-5 text-white shadow-sm"><div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" /><div className="relative"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">{selected.badge}</div><div className="mt-3 text-2xl font-black tracking-tight">{selected.title}</div><div className="mt-2 text-sm font-medium text-white/85">{selected.discount} • {selected.start} to {selected.end}</div><button className="mt-5 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-900">Shop Offer</button></div></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[ ["Revenue", `৳${selected.revenue.toLocaleString()}`], ["Orders", selected.orders], ["Net Profit", `৳${selected.netProfit.toLocaleString()}`], ["Discount Cost", `৳${selected.discountCost.toLocaleString()}`] ].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-bold text-slate-900">{value}</div></div>)}
            </div>
          </div>
          <div className="mt-5 grid gap-3"><button onClick={editSelectedOffer} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Edit Offer</button><button onClick={() => setActionModal("Duplicate Offer")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Duplicate Offer</button><button onClick={() => setActionModal("Pause Offer")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">Pause Offer</button></div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Top Performing Offers</div><h3 className="mt-1 text-xl font-bold tracking-tight">{dateViewLabel}</h3>
          <div className="mt-4 space-y-3">{topPerformingOffers.map((offer, index) => <button key={offer.id} onClick={() => setSelectedOfferId(offer.id)} className={`w-full rounded-2xl px-4 py-3 text-left text-xs transition ${selectedOfferId === offer.id ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15" : "bg-stone-50 hover:bg-stone-100"}`}><div className="flex items-center justify-between gap-3"><span className="font-bold text-slate-800">#{index + 1} {offer.title}</span><span className="font-black text-[#5E7F85]">৳{offer.netProfit.toLocaleString()}</span></div><div className="mt-2 text-slate-500">Revenue ৳{offer.revenue.toLocaleString()} • Orders {offer.orders}</div></button>)}</div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Offer Safety Panel</div><h3 className="mt-1 text-xl font-bold tracking-tight">Publish Protection</h3>
          <div className="mt-4 grid gap-2">{[ ["Stock", selected.stock === "Safe"], ["Margin", selected.margin !== "Low"], ["Conflict", selected.conflict !== "Conflict"], ["Dates", selected.status !== "Expired"], ["Visibility", selected.visibility !== "Hidden"], ["Messenger", selected.channel.includes("Messenger") || selected.channel === "Website"] ].map(([label, ok]) => <div key={label} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}><span>{ok ? "✅" : "⚠"} {label}</span><span>{ok ? "Safe" : "Review"}</span></div>)}</div>
        </div>

        <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-6 shadow-sm">
          <div className="text-sm font-bold text-[#5E7F85]">Automation Rule Summary</div>
          <div className="mt-4 space-y-3 text-xs font-semibold leading-5 text-slate-700">
            <div className="rounded-2xl bg-white px-4 py-3">✓ Stock low হলে offer auto pause হবে</div>
            <div className="rounded-2xl bg-white px-4 py-3">✓ Offer expired হলে auto disable হবে</div>
            <div className="rounded-2xl bg-white px-4 py-3">✓ Double discount conflict হলে publish block হবে</div>
            <div className="rounded-2xl bg-white px-4 py-3">✓ Messenger sync ON থাকলে inbox offer reply তে যাবে</div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Product Mapping</div><h3 className="mt-1 text-xl font-bold tracking-tight">Offer Products</h3>
          <div className="mt-4 space-y-2">{(offerProducts[selected.id] || []).map((item, index) => <div key={item} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-xs"><span className="font-bold text-slate-700">{item}</span><span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">#{index + 1}</span></div>)}</div>
        </div>
      </div>
    </div>

    {actionModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className={`w-full rounded-[2rem] bg-white p-6 shadow-2xl ${actionModal === "Create Offer" || actionModal === "Edit Offer" ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">Offer Action</div><h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{actionModal}</h3><p className="mt-2 text-sm leading-6 text-slate-500">Control discount rule, product mapping, margin protection, conflict check and automation behavior.</p></div><button onClick={() => setActionModal(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">✕</button></div>
        {(actionModal === "Create Offer" || actionModal === "Edit Offer") ? <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Offer Title<input value={offerDraft.title} onChange={(event) => setOfferDraft({ ...offerDraft, title: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Glow Routine Combo" /></label>
              <label className="text-sm font-semibold text-slate-700">Offer Type<select value={offerDraft.type} onChange={(event) => setOfferDraft({ ...offerDraft, type: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Combo Offer</option><option>Buy 1 Get 1</option><option>Clearance Sale</option><option>Free Shipping</option><option>Messenger Deal</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Rule Type<select value={offerDraft.rule} onChange={(event) => setOfferDraft({ ...offerDraft, rule: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Fixed Discount</option><option>Percentage Discount</option><option>BOGO</option><option>Free Delivery</option><option>Bundle Price</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Discount Value<input value={offerDraft.discount} onChange={(event) => setOfferDraft({ ...offerDraft, discount: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="৳100 / 20 / 1 Free" /></label>
              <label className="text-sm font-semibold text-slate-700">Minimum Order Value<input value={offerDraft.minOrder} onChange={(event) => setOfferDraft({ ...offerDraft, minOrder: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">Max Discount Cap<input value={offerDraft.maxDiscount} onChange={(event) => setOfferDraft({ ...offerDraft, maxDiscount: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">Usage Limit<input value={offerDraft.usageLimit} onChange={(event) => setOfferDraft({ ...offerDraft, usageLimit: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">Customer Eligibility<select value={offerDraft.customer} onChange={(event) => setOfferDraft({ ...offerDraft, customer: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>All Customers</option><option>New Customers</option><option>Repeat Customers</option><option>VIP Customers</option><option>Messenger Only</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Coupon Code<input value={offerDraft.coupon} onChange={(event) => setOfferDraft({ ...offerDraft, coupon: event.target.value.toUpperCase() })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold uppercase outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">Badge Text<input value={offerDraft.badge} onChange={(event) => setOfferDraft({ ...offerDraft, badge: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">Start Date<input type="date" value={offerDraft.start} onChange={(event) => setOfferDraft({ ...offerDraft, start: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">End Date<input type="date" value={offerDraft.end} onChange={(event) => setOfferDraft({ ...offerDraft, end: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">Visibility<select value={offerDraft.visibility} onChange={(event) => setOfferDraft({ ...offerDraft, visibility: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Homepage</option><option>Offers Page</option><option>PDP + Cart</option><option>Checkout</option><option>Visible</option><option>Hidden</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Channel<select value={offerDraft.channel} onChange={(event) => setOfferDraft({ ...offerDraft, channel: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Website</option><option>Website + Messenger</option><option>Messenger</option><option>Checkout Only</option></select></label>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5">
              <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-bold text-slate-900">Product Picker</div><div className="mt-1 text-xs text-slate-500">Select products for this offer and check stock/conflict instantly.</div></div><Badge tone="brand">{selectedProducts.length} Selected</Badge></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{offerCatalogProducts.map((item) => <button key={item.name} type="button" onClick={() => toggleOfferProduct(item.name)} className={`rounded-2xl border p-4 text-left transition ${selectedProducts.includes(item.name) ? "border-[#5E7F85] bg-[#5E7F85]/5 ring-2 ring-[#5E7F85]/10" : "border-slate-200 bg-white hover:bg-stone-50"}`}><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{item.name}</div><div className="mt-1 text-xs text-slate-500">৳{item.price} • Cost ৳{item.cost} • Stock {item.stock}</div></div><input type="checkbox" checked={selectedProducts.includes(item.name)} readOnly className="mt-1 h-4 w-4" /></div><div className="mt-3"><Badge tone={item.activeOffer === "None" ? "good" : "warn"}>{item.activeOffer === "None" ? "No conflict" : item.activeOffer}</Badge></div></button>)}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => setOfferDraft({ ...offerDraft, messengerSync: !offerDraft.messengerSync })} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold"><span>Messenger Sync</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${offerDraft.messengerSync ? "bg-[#5E7F85] text-white" : "bg-white text-slate-500"}`}>{offerDraft.messengerSync ? "ON" : "OFF"}</span></button>
              <button type="button" onClick={() => setOfferDraft({ ...offerDraft, autoPause: !offerDraft.autoPause })} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold"><span>Auto Pause When Stock Low</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${offerDraft.autoPause ? "bg-[#5E7F85] text-white" : "bg-white text-slate-500"}`}>{offerDraft.autoPause ? "ON" : "OFF"}</span></button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Margin Calculator</div>
              <div className="mt-4 space-y-3 text-sm">
                {[ ["Product subtotal", `৳${draftSubtotal.toLocaleString()}`], ["Buying cost", `৳${draftCost.toLocaleString()}`], ["Discount loss", `৳${draftDiscount.toLocaleString()}`], ["Courier cost", `৳${courierCost}`], ["Net profit", `৳${draftNetProfit.toLocaleString()}`], ["Profit margin", `${draftMargin}%`] ].map(([label, value]) => <div key={label} className="flex justify-between rounded-2xl bg-stone-50 px-4 py-3"><span className="text-slate-500">{label}</span><b className={label === "Net profit" || label === "Profit margin" ? draftMargin >= 35 ? "text-emerald-700" : "text-rose-700" : "text-slate-900"}>{value}</b></div>)}
              </div>
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${draftMargin >= 35 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{draftMargin >= 35 ? "✅ Safe margin" : "⚠ Margin risk, adjust discount"}</div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Conflict Checker</div>
              <div className="mt-4 space-y-2">{productConflict.length ? productConflict.map((item) => <div key={item.name} className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">⚠ {item.name} already in {item.activeOffer}</div>) : <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">✅ No active offer conflict found</div>}</div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3"><div className="text-sm font-bold text-slate-900">Publish Safety</div><Badge tone={safetyChecks.every((item) => item.ok) ? "good" : "warn"}>{safetyChecks.filter((item) => item.ok).length}/{safetyChecks.length}</Badge></div>
              <div className="mt-4 grid gap-2">{safetyChecks.map((item) => <div key={item.label} className={`rounded-xl px-3 py-2 text-xs font-semibold ${item.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{item.ok ? "✅" : "⚠"} {item.label}</div>)}</div>
            </div>

            <div className="rounded-[1.5rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Storefront Preview</div>
              <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] to-[#d9e5e1] p-5 text-white"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">{offerDraft.badge}</div><div className="mt-2 text-2xl font-black">{offerDraft.title || "Offer Title Preview"}</div><div className="mt-2 text-sm text-white/85">{offerDraft.rule} • {offerDraft.discount || 0} discount</div><button className="mt-5 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-900">Shop Offer</button></div>
            </div>
          </div>
        </div> : <div className="mt-6 grid gap-3 md:grid-cols-2">{["Offer storefront preview", "Product mapping", "Discount safety check", "Date schedule", "Messenger offer sync", "Margin protection", "Conflict checker", "Auto pause rules"].map((item) => <div key={item} className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700">✓ {item}</div>)}</div>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setActionModal(null)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Close</button><button onClick={() => setActionModal(null)} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${safetyChecks.every((item) => item.ok) || !(actionModal === "Create Offer" || actionModal === "Edit Offer") ? "bg-[#5E7F85] text-white" : "bg-slate-200 text-slate-500"}`}>{actionModal === "Create Offer" ? "Save Offer" : actionModal === "Edit Offer" ? "Save Changes" : "Confirm"}</button></div>
      </div>
    </div>}
  </div>;
}
