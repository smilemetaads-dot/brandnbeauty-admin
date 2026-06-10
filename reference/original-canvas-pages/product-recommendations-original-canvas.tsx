// REFERENCE ONLY.
// Original Canvas Product Recommendations design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Product Recommendations page.
/* eslint-disable */
// @ts-nocheck

/* Exact page component snippet extracted from brandnbeauty_admin_panel_preview (2)(10).jsx. */

function CatalogPlaceholderPage({ page }) {
  const [search, setSearch] = useState("");
  const [ruleFilter, setRuleFilter] = useState("All");
  const [selectedRuleId, setSelectedRuleId] = useState("acne-routine");
  const [actionModal, setActionModal] = useState(null);
  const [activeTab, setActiveTab] = useState("PDP Blocks");
  const [previewProduct, setPreviewProduct] = useState("Acne Balance Facewash");
  const [recommendationGoal, setRecommendationGoal] = useState("Conversion");
  const [ruleDraft, setRuleDraft] = useState({
    title: "",
    type: "Frequently Bought Together",
    placement: "Product Details Page",
    trigger: "Same Concern",
    status: "Active",
    priority: "High",
    maxItems: "4",
    discount: "100",
    autoRefresh: true,
    excludeOOS: true,
    messengerSync: true,
    lockedSequence: false,
  });
  const [selectedProducts, setSelectedProducts] = useState(["Barrier Calm Serum", "Hydra Gel Moisturizer"]);

  const recommendationProducts = [
    { name: "Acne Balance Facewash", brand: "Some By Mi", category: "Face Wash", concern: "Acne", routine: "Cleanser", price: 890, stock: 44, sold: 128, margin: 42, score: 94 },
    { name: "Barrier Calm Serum", brand: "BrandnBeauty", category: "Serum", concern: "Sensitive Skin", routine: "Treatment", price: 990, stock: 18, sold: 96, margin: 51, score: 91 },
    { name: "Hydra Gel Moisturizer", brand: "Simple", category: "Moisturizer", concern: "Dry Skin", routine: "Moisturizer", price: 850, stock: 72, sold: 54, margin: 45, score: 84 },
    { name: "Daily Sun Gel", brand: "Beauty of Joseon", category: "Sunscreen", concern: "Daily Protection", routine: "Sunscreen", price: 1250, stock: 0, sold: 72, margin: 38, score: 78 },
    { name: "Routine Bundle", brand: "BrandnBeauty", category: "Bundle", concern: "Routine", routine: "Bundle", price: 2020, stock: 12, sold: 31, margin: 58, score: 88 },
    { name: "Niacinamide Serum", brand: "The Derma Plus", category: "Serum", concern: "Dark Spots", routine: "Treatment", price: 890, stock: 36, sold: 74, margin: 55, score: 86 },
  ];

  const recommendationRules = [
    { id: "acne-routine", title: "Acne Routine Builder", type: "Complete Your Routine", placement: "PDP", trigger: "Concern: Acne", products: 4, revenue: 84500, clicks: 820, addToCart: 146, conversion: 18, aovLift: 22, status: "Active", stock: "Safe", priority: "High", automation: "Auto Refresh", goal: "Conversion", productsList: ["Acne Balance Facewash", "Barrier Calm Serum", "Hydra Gel Moisturizer", "Daily Sun Gel"] },
    { id: "fbt-serum", title: "Serum + Moisturizer Combo", type: "Frequently Bought Together", placement: "PDP + Cart", trigger: "Bought Together", products: 2, revenue: 62200, clicks: 610, addToCart: 118, conversion: 19, aovLift: 28, status: "Active", stock: "Watch", priority: "High", automation: "Manual Locked", goal: "AOV", productsList: ["Barrier Calm Serum", "Hydra Gel Moisturizer"] },
    { id: "similar-facewash", title: "Similar Facewash Suggestions", type: "Similar Products", placement: "PDP Bottom", trigger: "Same Category", products: 6, revenue: 38500, clicks: 540, addToCart: 69, conversion: 13, aovLift: 11, status: "Active", stock: "Safe", priority: "Medium", automation: "Auto Refresh", goal: "Discovery", productsList: ["Acne Balance Facewash", "Hydra Gel Moisturizer", "Niacinamide Serum"] },
    { id: "cart-upsell", title: "Cart Upsell Add-on", type: "Cart Recommendation", placement: "Cart Drawer", trigger: "Cart Value", products: 3, revenue: 52400, clicks: 440, addToCart: 92, conversion: 21, aovLift: 31, status: "Scheduled", stock: "Safe", priority: "High", automation: "Rule Based", goal: "AOV", productsList: ["Daily Sun Gel", "Routine Bundle", "Hydra Gel Moisturizer"] },
    { id: "recently-viewed", title: "Recently Viewed Recovery", type: "Recently Viewed", placement: "PDP + Homepage", trigger: "Browsing History", products: 8, revenue: 21200, clicks: 720, addToCart: 44, conversion: 6, aovLift: 8, status: "Draft", stock: "Mixed", priority: "Low", automation: "Behavior Based", goal: "Recovery", productsList: ["Routine Bundle", "Daily Sun Gel"] },
  ];

  const selectedRule = recommendationRules.find((item) => item.id === selectedRuleId) || recommendationRules[0];
  const filteredRules = recommendationRules.filter((rule) => {
    const q = search.toLowerCase();
    const bySearch = !q || `${rule.title} ${rule.type} ${rule.placement} ${rule.trigger} ${rule.status} ${rule.goal}`.toLowerCase().includes(q);
    const byFilter = ruleFilter === "All" || rule.type === ruleFilter || rule.status === ruleFilter || rule.priority === ruleFilter || rule.stock === ruleFilter || rule.goal === ruleFilter;
    return bySearch && byFilter;
  });
  const totalRevenue = recommendationRules.reduce((sum, item) => sum + item.revenue, 0);
  const totalAddToCart = recommendationRules.reduce((sum, item) => sum + item.addToCart, 0);
  const avgConversion = Math.round(recommendationRules.reduce((sum, item) => sum + item.conversion, 0) / recommendationRules.length);
  const avgAovLift = Math.round(recommendationRules.reduce((sum, item) => sum + item.aovLift, 0) / recommendationRules.length);
  const activeRules = recommendationRules.filter((item) => item.status === "Active").length;
  const stockWarnings = recommendationRules.filter((item) => item.stock !== "Safe").length;
  const selectedProductRows = recommendationProducts.filter((item) => selectedProducts.includes(item.name));
  const bundleTotal = selectedProductRows.reduce((sum, item) => sum + item.price, 0);
  const bundleMargin = selectedProductRows.length ? Math.round(selectedProductRows.reduce((sum, item) => sum + item.margin, 0) / selectedProductRows.length) : 0;
  const stockSafe = selectedProductRows.every((item) => item.stock > 0);
  const expectedAovLift = Math.max(12, selectedProducts.length * 7 + (ruleDraft.type.includes("Together") ? 8 : 0));
  const recommendedForPreview = recommendationRules.find((item) => item.productsList.includes(previewProduct)) || selectedRule;
  const previewItems = recommendedForPreview.productsList.slice(0, 4);
  const topRules = [...recommendationRules].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const ruleHealth = Math.round((Number(stockSafe) * 25) + (selectedProducts.length >= 2 ? 25 : 0) + (bundleMargin >= 35 ? 25 : 0) + (ruleDraft.excludeOOS ? 15 : 0) + (ruleDraft.placement ? 10 : 0));
  const safetyChecks = [
    { label: "Stock-safe sequence", ok: stockSafe || ruleDraft.excludeOOS },
    { label: "Minimum 2 products", ok: selectedProducts.length >= 2 },
    { label: "Placement selected", ok: Boolean(ruleDraft.placement) },
    { label: "Trigger logic selected", ok: Boolean(ruleDraft.trigger) },
    { label: "Margin healthy", ok: bundleMargin >= 35 },
    { label: "OOS excluded", ok: ruleDraft.excludeOOS },
  ];
  const tabs = {
    "PDP Blocks": ["Complete Your Routine", "Frequently Bought Together", "Similar Products", "Recommended For You"],
    "Cart Upsell": ["Cart Recommendation", "Free Delivery Add-on", "Bundle Save", "Checkout Cross-sell"],
    "Routine Builder": ["Cleanser", "Treatment", "Moisturizer", "Sunscreen"],
    Automation: ["Auto Refresh", "Exclude OOS", "Messenger Sync", "Manual Lock"],
  };
  const createRule = () => {
    setActionModal("Create Recommendation Rule");
    setSelectedProducts(["Barrier Calm Serum", "Hydra Gel Moisturizer"]);
    setRuleDraft({ title: "", type: "Frequently Bought Together", placement: "Product Details Page", trigger: "Same Concern", status: "Active", priority: "High", maxItems: "4", discount: "100", autoRefresh: true, excludeOOS: true, messengerSync: true, lockedSequence: false });
  };
  const editRule = (rule = selectedRule) => {
    setSelectedRuleId(rule.id);
    setActionModal("Edit Recommendation Rule");
    setSelectedProducts(rule.productsList.filter((item) => recommendationProducts.some((product) => product.name === item)));
    setRuleDraft({ title: rule.title, type: rule.type, placement: rule.placement, trigger: rule.trigger, status: rule.status, priority: rule.priority, maxItems: String(rule.products), discount: "100", autoRefresh: rule.automation !== "Manual Locked", excludeOOS: true, messengerSync: true, lockedSequence: rule.automation === "Manual Locked" });
  };
  const toggleProduct = (name) => setSelectedProducts((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  return <div className="space-y-6">
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15" />
        <div className="absolute bottom-0 left-1/2 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">Catalog Intelligence</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Product Recommendations Engine</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">Control PDP recommendations, complete-routine blocks, frequently bought together, cart upsells, similar products and recovery rules with stock, margin and conversion safety.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActionModal("Storefront Recommendation Preview")} className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">Preview PDP</button>
            <button onClick={createRule} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm">Create Rule</button>
          </div>
        </div>
      </div>
      <div className="grid gap-3 border-t border-white/20 bg-stone-50/80 p-4 text-sm md:grid-cols-5">
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Revenue: <b className="text-[#5E7F85]">৳{totalRevenue.toLocaleString()}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Add to cart: <b className="text-emerald-700">{totalAddToCart}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Avg conv.: <b className="text-slate-900">{avgConversion}%</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">AOV lift: <b className="text-[#5E7F85]">+{avgAovLift}%</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Stock watch: <b className="text-amber-700">{stockWarnings}</b></div>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard item={["Active Rules", String(activeRules), "Live blocks"]} index={0} active />
      <StatCard item={["Recommendation Sales", `৳${totalRevenue.toLocaleString()}`, "Attributed revenue"]} index={1} />
      <StatCard item={["AOV Lift", `+${avgAovLift}%`, "Bundle effect"]} index={2} />
      <StatCard item={["Stock Watch", String(stockWarnings), "Review mapping"]} index={3} active />
    </div>

    <div className="overflow-hidden rounded-[2rem] border border-[#5E7F85]/15 bg-white shadow-sm">
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="text-sm font-bold text-slate-900">Recommendation Strategy Board</div>
          <div className="mt-1 text-sm text-slate-500">Use different goals for different placements: conversion, AOV, discovery and recovery.</div>
        </div>
        <div className="flex flex-wrap gap-2">{["Conversion", "AOV", "Discovery", "Recovery"].map((item) => <button key={item} onClick={() => setRecommendationGoal(item)} className={`rounded-full px-4 py-2 text-xs font-bold ${recommendationGoal === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-stone-50 text-slate-600"}`}>{item}</button>)}</div>
      </div>
      <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 md:grid-cols-4">
        {[
          ["Conversion", "PDP routine + FBT", "Push add-to-cart"],
          ["AOV", "Cart add-on + bundle", "Increase order value"],
          ["Discovery", "Similar + recommended", "Help product browsing"],
          ["Recovery", "Recently viewed", "Bring users back"],
        ].map(([goal, title, desc]) => <button key={goal} onClick={() => setRecommendationGoal(goal)} className={`rounded-2xl p-4 text-left transition ${recommendationGoal === goal ? "bg-[#5E7F85] text-white shadow-sm" : "bg-white text-slate-700 hover:bg-stone-100"}`}><div className="font-bold">{title}</div><div className={`mt-1 text-xs ${recommendationGoal === goal ? "text-white/80" : "text-slate-500"}`}>{desc}</div></button>)}
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
      {Object.keys(tabs).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab ? "bg-[#5E7F85] text-white shadow-sm" : "text-slate-600 hover:bg-stone-50"}`}>{tab}</button>)}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="text-sm font-medium text-slate-500">Recommendation Rules</div><h2 className="mt-1 text-xl font-bold tracking-tight">Conversion Mapping List</h2><div className="mt-2 text-sm text-slate-500">Set product sequence, placement, trigger logic, stock safety and conversion priority.</div></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => setActionModal("Bulk Auto Mapping")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Bulk Mapping</button><button onClick={createRule} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Create Rule</button></div>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="relative max-w-xl"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rule / type / placement / trigger..." className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span></div>
            <div className="flex flex-wrap gap-2">{["All", "Active", "Scheduled", "Draft", "High", "Safe", "Watch", "Conversion", "AOV", "Discovery", "Recovery"].map((item) => <button key={item} onClick={() => setRuleFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${ruleFilter === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <TableHead><tr>{["Rule", "Type", "Goal", "Placement", "Trigger", "Revenue", "Conv.", "AOV", "Stock", "Action"].map((head) => <th key={head} className="px-5 py-4 font-medium">{head}</th>)}</tr></TableHead>
            <tbody>
              {filteredRules.map((rule) => <tr key={rule.id} onClick={() => setSelectedRuleId(rule.id)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${selectedRuleId === rule.id ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]" : rule.stock !== "Safe" ? "bg-amber-50/25" : "bg-white"}`}>
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-lg font-black text-[#5E7F85]">↗</div><div><div className="font-bold text-slate-900">{rule.title}</div><div className="mt-1 text-xs text-slate-500">{rule.products} products • {rule.automation}</div></div></div></td>
                <td className="px-5 py-4"><Badge tone="brand">{rule.type}</Badge></td>
                <td className="px-5 py-4"><Badge tone={rule.goal === "Recovery" ? "warn" : rule.goal === "AOV" ? "brand" : "good"}>{rule.goal}</Badge></td>
                <td className="px-5 py-4 font-semibold text-slate-700">{rule.placement}</td>
                <td className="px-5 py-4 text-slate-600">{rule.trigger}</td>
                <td className="px-5 py-4 font-bold text-slate-900">৳{rule.revenue.toLocaleString()}</td>
                <td className="px-5 py-4 font-semibold">{rule.conversion}%</td>
                <td className="px-5 py-4 font-bold text-emerald-700">+{rule.aovLift}%</td>
                <td className="px-5 py-4"><Badge tone={rule.stock === "Safe" ? "good" : "warn"}>{rule.stock}</Badge></td>
                <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-2"><button onClick={() => editRule(rule)} className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white">Edit</button><button onClick={() => { setSelectedRuleId(rule.id); setActionModal("Rule Preview"); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50">Open</button></div></td>
              </tr>)}
              {filteredRules.length === 0 && <tr><td colSpan={10} className="px-5 py-14 text-center text-sm text-slate-500">No recommendation rules found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium text-slate-500">Selected Rule</div><h3 className="mt-1 text-xl font-bold tracking-tight">{selectedRule.title}</h3><div className="mt-1 text-xs text-slate-500">{selectedRule.type} • {selectedRule.placement}</div></div><Badge tone={selectedRule.status === "Active" ? "good" : "warn"}>{selectedRule.status}</Badge></div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-stone-50 p-4">
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3"><div className="font-bold text-slate-900">PDP Preview Block</div><Badge tone="brand">{selectedRule.products} items</Badge></div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {selectedRule.productsList.slice(0, 4).map((item, index) => <div key={item} className="rounded-2xl border border-slate-100 bg-stone-50 p-3"><div className="flex aspect-square items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-400">IMG</div><div className="mt-2 text-xs font-bold text-slate-800">{item}</div><div className="mt-1 text-[10px] text-[#5E7F85]">Sequence #{index + 1}</div></div>)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[["Revenue", `৳${selectedRule.revenue.toLocaleString()}`], ["Add to Cart", selectedRule.addToCart], ["Conversion", `${selectedRule.conversion}%`], ["AOV Lift", `+${selectedRule.aovLift}%`]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-bold text-slate-900">{value}</div></div>)}
            </div>
          </div>
          <div className="mt-5 grid gap-3"><button onClick={() => editRule(selectedRule)} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Edit Rule</button><button onClick={() => setActionModal("Duplicate Rule")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Duplicate Rule</button><button onClick={() => setActionModal("Pause Rule")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">Pause Rule</button></div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Live Sequence Test</div><h3 className="mt-1 text-xl font-bold tracking-tight">Preview Product</h3>
          <select value={previewProduct} onChange={(event) => setPreviewProduct(event.target.value)} className="mt-4 w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none">{recommendationProducts.map((item) => <option key={item.name}>{item.name}</option>)}</select>
          <div className="mt-4 space-y-2">{previewItems.map((item, index) => <div key={item} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-xs"><span className="font-bold text-slate-700">{item}</span><span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">#{index + 1}</span></div>)}</div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Top Rules</div><h3 className="mt-1 text-xl font-bold tracking-tight">Revenue Ranking</h3>
          <div className="mt-4 space-y-3">{topRules.map((rule, index) => <button key={rule.id} onClick={() => setSelectedRuleId(rule.id)} className={`w-full rounded-2xl px-4 py-3 text-left text-xs transition ${selectedRuleId === rule.id ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15" : "bg-stone-50 hover:bg-stone-100"}`}><div className="flex items-center justify-between gap-3"><span className="font-bold text-slate-800">#{index + 1} {rule.title}</span><span className="font-black text-[#5E7F85]">৳{rule.revenue.toLocaleString()}</span></div><div className="mt-2 text-slate-500">AOV +{rule.aovLift}% • Conv {rule.conversion}%</div></button>)}</div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm"><div className="text-sm font-bold text-amber-800">Professional Rule</div><div className="mt-2 text-sm leading-6 text-amber-700">Prioritize same concern, next routine step, in-stock products, healthy margin and proven best sellers. Out-of-stock products should be excluded from conversion blocks unless it is a notify-me recovery strategy.</div></div>
      </div>
    </div>

    {actionModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className={`w-full rounded-[2rem] bg-white p-6 shadow-2xl ${actionModal === "Create Recommendation Rule" || actionModal === "Edit Recommendation Rule" ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">Recommendation Action</div><h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{actionModal}</h3><p className="mt-2 text-sm leading-6 text-slate-500">Build conversion-focused recommendation logic with product sequence, stock protection, routine mapping and Messenger sync.</p></div><button onClick={() => setActionModal(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">✕</button></div>
        {(actionModal === "Create Recommendation Rule" || actionModal === "Edit Recommendation Rule") ? <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Rule Title<input value={ruleDraft.title} onChange={(event) => setRuleDraft({ ...ruleDraft, title: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Acne routine recommendation" /></label>
              <label className="text-sm font-semibold text-slate-700">Recommendation Type<select value={ruleDraft.type} onChange={(event) => setRuleDraft({ ...ruleDraft, type: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Frequently Bought Together</option><option>Complete Your Routine</option><option>Similar Products</option><option>Recommended For You</option><option>Recently Viewed</option><option>Cart Recommendation</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Placement<select value={ruleDraft.placement} onChange={(event) => setRuleDraft({ ...ruleDraft, placement: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Product Details Page</option><option>PDP + Cart</option><option>PDP Bottom</option><option>Cart Drawer</option><option>Checkout</option><option>Homepage</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Trigger Logic<select value={ruleDraft.trigger} onChange={(event) => setRuleDraft({ ...ruleDraft, trigger: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Same Concern</option><option>Same Category</option><option>Bought Together</option><option>Routine Step</option><option>Cart Value</option><option>Browsing History</option><option>Manual Selection</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Status<select value={ruleDraft.status} onChange={(event) => setRuleDraft({ ...ruleDraft, status: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Active</option><option>Scheduled</option><option>Draft</option><option>Paused</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Priority<select value={ruleDraft.priority} onChange={(event) => setRuleDraft({ ...ruleDraft, priority: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>High</option><option>Medium</option><option>Low</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Max Items<input value={ruleDraft.maxItems} onChange={(event) => setRuleDraft({ ...ruleDraft, maxItems: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
              <label className="text-sm font-semibold text-slate-700">Bundle Discount<input value={ruleDraft.discount} onChange={(event) => setRuleDraft({ ...ruleDraft, discount: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-stone-50 p-5">
              <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-bold text-slate-900">Product Sequence Builder</div><div className="mt-1 text-xs text-slate-500">Select products for this block. Later this can support drag-and-drop sequence ordering.</div></div><Badge tone="brand">{selectedProducts.length} Selected</Badge></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{recommendationProducts.map((item) => <button key={item.name} type="button" onClick={() => toggleProduct(item.name)} className={`rounded-2xl border p-4 text-left transition ${selectedProducts.includes(item.name) ? "border-[#5E7F85] bg-[#5E7F85]/5 ring-2 ring-[#5E7F85]/10" : "border-slate-200 bg-white hover:bg-stone-50"}`}><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{item.name}</div><div className="mt-1 text-xs text-slate-500">{item.brand} • {item.category} • {item.routine}</div></div><input type="checkbox" checked={selectedProducts.includes(item.name)} readOnly className="mt-1 h-4 w-4" /></div><div className="mt-3 flex flex-wrap gap-2"><Badge tone={item.stock > 0 ? "good" : "bad"}>{item.stock > 0 ? `Stock ${item.stock}` : "OOS"}</Badge><Badge tone={item.margin >= 45 ? "brand" : "warn"}>Margin {item.margin}%</Badge><Badge tone="default">Score {item.score}</Badge></div></button>)}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {[ ["Auto Refresh", "autoRefresh"], ["Exclude OOS", "excludeOOS"], ["Messenger Sync", "messengerSync"], ["Manual Lock", "lockedSequence"] ].map(([label, key]) => <button key={key} type="button" onClick={() => setRuleDraft({ ...ruleDraft, [key]: !ruleDraft[key] })} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold"><span>{label}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${ruleDraft[key] ? "bg-[#5E7F85] text-white" : "bg-white text-slate-500"}`}>{ruleDraft[key] ? "ON" : "OFF"}</span></button>)}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><div className="text-sm font-bold text-slate-900">Rule Health</div><Badge tone={ruleHealth >= 80 ? "good" : "warn"}>{ruleHealth}/100</Badge></div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${ruleHealth}%` }} /></div>
              <div className="mt-4 space-y-3 text-sm">
                {[["Selected products", selectedProducts.length], ["Bundle value", `৳${bundleTotal.toLocaleString()}`], ["Avg margin", `${bundleMargin}%`], ["Expected AOV lift", `+${expectedAovLift}%`], ["Stock status", stockSafe ? "Safe" : "OOS Review"]].map(([label, value]) => <div key={label} className="flex justify-between rounded-2xl bg-stone-50 px-4 py-3"><span className="text-slate-500">{label}</span><b className={label === "Avg margin" ? bundleMargin >= 35 ? "text-emerald-700" : "text-rose-700" : "text-slate-900"}>{value}</b></div>)}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3"><div className="text-sm font-bold text-slate-900">Publish Safety</div><Badge tone={safetyChecks.every((item) => item.ok) ? "good" : "warn"}>{safetyChecks.filter((item) => item.ok).length}/{safetyChecks.length}</Badge></div>
              <div className="mt-4 grid gap-2">{safetyChecks.map((item) => <div key={item.label} className={`rounded-xl px-3 py-2 text-xs font-semibold ${item.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{item.ok ? "✅" : "⚠"} {item.label}</div>)}</div>
            </div>

            <div className="rounded-[1.5rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Storefront Preview</div>
              <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="font-bold text-slate-900">{ruleDraft.type}</div><Badge tone="brand">Live Block</Badge></div><div className="mt-4 grid grid-cols-2 gap-3">{selectedProducts.slice(0, 4).map((item) => <div key={item} className="rounded-2xl bg-stone-50 p-3"><div className="flex aspect-square items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-400">IMG</div><div className="mt-2 text-xs font-bold text-slate-800">{item}</div></div>)}</div></div>
            </div>
          </div>
        </div> : <div className="mt-6 grid gap-3 md:grid-cols-2">{["PDP recommendation preview", "Product sequence control", "Routine-step mapping", "Stock-safe automation", "Cart upsell rules", "Messenger sync", "Recently viewed recovery", "AOV lift tracking"].map((item) => <div key={item} className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700">✓ {item}</div>)}</div>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setActionModal(null)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Close</button><button onClick={() => setActionModal(null)} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${safetyChecks.every((item) => item.ok) || !(actionModal === "Create Recommendation Rule" || actionModal === "Edit Recommendation Rule") ? "bg-[#5E7F85] text-white" : "bg-slate-200 text-slate-500"}`}>{actionModal === "Create Recommendation Rule" ? "Save Rule" : actionModal === "Edit Recommendation Rule" ? "Save Changes" : "Confirm"}</button></div>
      </div>
    </div>}
  </div>;
}
