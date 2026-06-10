// REFERENCE ONLY.
// Original Canvas Concerns design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Concerns page.
/* eslint-disable */
// @ts-nocheck

/* Exact page component snippet extracted from brandnbeauty_admin_panel_preview (2)(10).jsx. */

function TaxonomyManagementPage({ type }) {
  // LOCKED: Categories and Concerns pages are frozen for current phase. Do not edit either page unless user explicitly says to unlock that exact page first.
  const isConcern = type === "concern";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(isConcern ? "acne" : "skincare");
  const [actionModal, setActionModal] = useState(null);
  const [entryType, setEntryType] = useState(isConcern ? "Concern" : "Parent Category");
  const [draftEntry, setDraftEntry] = useState({ name: "", slug: "", parent: isConcern ? "Skin Concern" : "Skincare", visibility: "Visible", menu: isConcern ? "Concern Menu" : "Header", status: "Active", priority: "5", seoTitle: "", metaDescription: "", banner: "Ready", concernType: "Skin", severity: "Medium", relatedCategories: "Skincare, Face Wash, Serum", education: "", safetyNote: "Cosmetic guidance only. Patch test before use." });
  const [editingEntry, setEditingEntry] = useState(null);

  const categoryRows = [
    { id: "skincare", name: "Skincare", slug: "skincare", parent: "Root", children: 5, products: 128, visibility: "Visible", menu: "Header", seo: 86, banner: "Ready", priority: 1, status: "Active", sub: ["Face Wash", "Serum", "Moisturizer", "Sunscreen", "Toner"] },
    { id: "hair-care", name: "Hair Care", slug: "hair-care", parent: "Root", children: 4, products: 42, visibility: "Visible", menu: "Header", seo: 74, banner: "Needs Image", priority: 2, status: "Active", sub: ["Shampoo", "Hair Mask", "Hair Serum", "Scalp Care"] },
    { id: "body-care", name: "Body Care", slug: "body-care", parent: "Root", children: 3, products: 31, visibility: "Visible", menu: "Header", seo: 69, banner: "Draft", priority: 3, status: "Active", sub: ["Body Wash", "Lotion", "Scrub"] },
    { id: "makeup", name: "Makeup", slug: "makeup", parent: "Root", children: 4, products: 18, visibility: "Hidden", menu: "Not in Menu", seo: 52, banner: "Missing", priority: 4, status: "Draft", sub: ["Lip", "Face", "Eye", "Brushes"] },
  ];

  const concernRows = [
    { id: "acne", name: "Acne", slug: "acne", parent: "Skin Concern", concernType: "Skin", severity: "Medium", relatedCategories: ["Face Wash", "Serum", "Spot Care"], children: 0, products: 54, visibility: "Visible", menu: "Concern Menu", seo: 82, banner: "Ready", priority: 1, status: "Active", sub: ["Acne Face Wash", "Acne Serum", "Spot Care"], routine: ["Cleanser", "Treatment", "Moisturizer", "Sunscreen"] },
    { id: "dark-spots", name: "Dark Spots", slug: "dark-spots", parent: "Skin Concern", concernType: "Skin", severity: "Medium", relatedCategories: ["Serum", "Cream", "Sunscreen"], children: 0, products: 37, visibility: "Visible", menu: "Concern Menu", seo: 78, banner: "Ready", priority: 2, status: "Active", sub: ["Brightening Serum", "Vitamin C", "Niacinamide"], routine: ["Cleanser", "Brightening Serum", "Moisturizer", "Sunscreen"] },
    { id: "oily-skin", name: "Oily Skin", slug: "oily-skin", parent: "Skin Concern", concernType: "Skin", severity: "Mild", relatedCategories: ["Face Wash", "Gel Moisturizer", "Mask"], children: 0, products: 29, visibility: "Visible", menu: "Concern Menu", seo: 71, banner: "Needs Image", priority: 3, status: "Active", sub: ["Oil Control", "Gel Moisturizer", "Clay Mask"], routine: ["Cleanser", "Toner", "Gel Moisturizer", "Sunscreen"] },
    { id: "sensitive-skin", name: "Sensitive Skin", slug: "sensitive-skin", parent: "Skin Concern", concernType: "Skin", severity: "Advanced", relatedCategories: ["Gentle Cleanser", "Barrier Care", "Calming Cream"], children: 0, products: 21, visibility: "Hidden", menu: "Not in Menu", seo: 58, banner: "Draft", priority: 4, status: "Draft", sub: ["Barrier Care", "Calming Serum", "Gentle Cleanser"], routine: ["Gentle Cleanser", "Calming Serum", "Barrier Cream", "Sunscreen"] },
  ];
  const concernGroups = [
    { title: "Skin Concern", desc: "Face-focused problem discovery", items: ["Acne", "Dark Spots", "Oily Skin", "Sensitive Skin", "Dry Skin"] },
    { title: "Hair Concern", desc: "Hair and scalp product discovery", items: ["Hairfall", "Dandruff", "Frizz", "Damaged Hair"] },
    { title: "Body Concern", desc: "Body care problem discovery", items: ["Body Acne", "Dark Underarm", "Dry Body Skin", "Rough Texture"] },
  ];

  const rows = isConcern ? concernRows : categoryRows;
  const parentOptions = isConcern ? ["Skin Concern", "Hair Concern", "Body Concern"] : categoryRows.map((item) => item.name);
  const selected = rows.find((item) => item.id === selectedId) || rows[0];
  const filtered = rows.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || `${item.name} ${item.slug} ${item.parent} ${item.status}`.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || item.status === statusFilter || item.visibility === statusFilter || item.menu === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const visibleCount = rows.filter((item) => item.visibility === "Visible").length;
  const totalProducts = rows.reduce((sum, item) => sum + item.products, 0);
  const avgSeo = Math.round(rows.reduce((sum, item) => sum + item.seo, 0) / rows.length);
  const needsWork = rows.filter((item) => item.seo < 75 || item.banner !== "Ready" || item.status !== "Active").length;
  const pageTitle = isConcern ? "Concerns Control Room" : "Categories Control Room";
  const pageLabel = isConcern ? "Concern" : "Category";
  const isSubEntry = entryType === "Subcategory";
  const isEntryFormModal = actionModal === "Add Entry" || actionModal === "Edit Entry";
  const modalTitle = actionModal === "Add Entry" ? `Add ${entryType}` : actionModal === "Edit Entry" ? `Edit ${editingEntry?.name || pageLabel}` : actionModal;
  const autoDraftSlug = draftEntry.name ? draftEntry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "auto-generated-slug";
  const actionFeatures = isConcern
    ? ["Create concern landing page", "Map concern to best products", "Add educational concern copy", "Generate concern SEO title/meta", "Control concern menu visibility", "Connect routine recommendations"]
    : ["Create parent category", "Create subcategory", "Select parent category", "Control header menu visibility", "Add category banner", "SEO title and meta", "Sort category display order", "Show product count"];
  const mappedProductsById = {
    skincare: ["Acne Balance Facewash", "Barrier Calm Serum", "Daily Sun Gel", "Hydra Gel Moisturizer"],
    "hair-care": ["Shiseido Fino Hair Mask", "Scalp Care Shampoo", "Hair Repair Serum"],
    "body-care": ["Kojic Body Wash", "Brightening Body Lotion", "Orchid Body Wash"],
    makeup: ["Lip Tint", "Soft Matte Compact", "Eye Brush Set"],
    acne: ["Acne Balance Facewash", "Spot Care Gel", "Niacinamide Serum", "Oil Control Toner"],
    "dark-spots": ["Vitamin C Serum", "Brightening Cream", "Niacinamide Serum"],
    "oily-skin": ["Oil Control Cleanser", "Gel Moisturizer", "Clay Mask"],
    "sensitive-skin": ["Barrier Calm Serum", "Gentle Cleanser", "Calming Moisturizer"],
  };

  const openEntryModal = (typeName) => {
    setEditingEntry(null);
    setEntryType(typeName);
    setDraftEntry({ name: "", slug: "", parent: parentOptions[0], visibility: "Visible", menu: isConcern ? "Concern Menu" : typeName === "Subcategory" ? "Under Parent" : "Header", status: "Active", priority: "5", seoTitle: "", metaDescription: "", banner: "Ready", concernType: "Skin", severity: "Medium", relatedCategories: "Skincare, Face Wash, Serum", education: "", safetyNote: "Cosmetic guidance only. Patch test before use." });
    setActionModal("Add Entry");
  };
  const openEditEntryModal = (row) => {
    setEditingEntry(row);
    setEntryType(row.parent === "Root" ? "Parent Category" : isConcern ? "Concern" : "Subcategory");
    setDraftEntry({ name: row.name, slug: row.slug, parent: row.parent === "Root" ? parentOptions[0] : row.parent, visibility: row.visibility, menu: row.menu, status: row.status, priority: String(row.priority), seoTitle: isConcern ? `${row.name} Care Products in Bangladesh | BrandnBeauty` : `${row.name} Price in Bangladesh | BrandnBeauty`, metaDescription: isConcern ? `Find authentic products for ${row.name.toLowerCase()} concern in Bangladesh. Shop routine-friendly skincare with COD and fast delivery from BrandnBeauty.` : `Shop authentic ${row.name} products in Bangladesh from BrandnBeauty with COD and fast delivery.`, banner: row.banner, concernType: row.concernType || "Skin", severity: row.severity || "Medium", relatedCategories: (row.relatedCategories || []).join(", "), education: `${row.name} concern page education copy for customer-friendly product discovery.`, safetyNote: "Cosmetic guidance only. Patch test before use." });
    setActionModal("Edit Entry");
  };

  return <div className="space-y-6">
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">Catalog Taxonomy</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{pageTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{isConcern ? "Manage problem-based discovery, concern landing SEO, routine mapping and concern filter visibility from one clean place." : "Manage parent category, subcategory, storefront menu, filter structure, SEO landing pages and banner visibility from one clean place."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActionModal(`Import ${pageLabel}s`)} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Import</button>
          {!isConcern && <button onClick={() => openEntryModal("Subcategory")} className="rounded-2xl border border-[#5E7F85]/30 bg-[#5E7F85]/10 px-5 py-3 text-sm font-semibold text-[#5E7F85]">Add Subcategory</button>}
          <button onClick={() => openEntryModal(isConcern ? "Concern" : "Parent Category")} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Add {isConcern ? "Concern" : "Category"}</button>
        </div>
      </div>
      <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Visible: <b className="text-[#5E7F85]">{visibleCount}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Products mapped: <b className="text-slate-900">{totalProducts}</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Avg SEO score: <b className="text-emerald-700">{avgSeo}/100</b></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Needs work: <b className="text-amber-700">{needsWork}</b></div>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[[`Total ${pageLabel}s`, String(rows.length), isConcern ? "Problem pages" : "Catalog structure"], [isConcern ? "Concern Groups" : "Subcategories", isConcern ? String(concernGroups.length) : String(rows.reduce((sum, item) => sum + item.children, 0)), isConcern ? "Skin, hair, body" : "Nested discovery"], ["Mapped Products", String(totalProducts), isConcern ? "Problem matching" : "Product discovery"], ["SEO Needs Work", String(needsWork), "Review banner/meta"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} active={item[0] === "SEO Needs Work"} />)}
    </div>

    {!isConcern && <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">Category Hierarchy</div>
          <div className="mt-1 text-sm leading-6 text-slate-600">Parent category er niche subcategory thakbe. Product add/edit page e ei structure thekei category and subcategory select hobe.</div>
        </div>
        <button onClick={() => openEntryModal("Subcategory")} className="w-fit rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">+ New Subcategory</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categoryRows.map((cat) => <div key={cat.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{cat.name}</div><div className="mt-1 text-xs text-slate-500">{cat.products} products • {cat.children} sub</div></div><Badge tone={cat.visibility === "Visible" ? "good" : "bad"}>{cat.visibility}</Badge></div>
          <div className="mt-4 flex flex-wrap gap-2">{cat.sub.map((item) => <span key={item} className="rounded-full bg-stone-50 px-3 py-2 text-xs font-bold text-slate-600">{item}</span>)}</div>
        </div>)}
      </div>
    </div>}

    {isConcern && <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">Concern Group View</div>
          <div className="mt-1 text-sm leading-6 text-slate-600">Concern pages problem-based discovery er jonno group wise thakbe. Frontend e Shop by Concern, filters and routine recommendations ekhanei control hobe.</div>
        </div>
        <button onClick={() => openEntryModal("Concern")} className="w-fit rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">+ New Concern</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {concernGroups.map((group) => <div key={group.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{group.title}</div><div className="mt-1 text-xs text-slate-500">{group.desc}</div></div><Badge tone="brand">{group.items.length}</Badge></div>
          <div className="mt-4 flex flex-wrap gap-2">{group.items.map((item) => <span key={item} className="rounded-full bg-stone-50 px-3 py-2 text-xs font-bold text-slate-600">{item}</span>)}</div>
        </div>)}
      </div>
    </div>}

    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">{isConcern ? "Problem-Based Discovery" : "Storefront Discovery"}</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">{isConcern ? "Concern Landing List" : `${pageLabel} Master List`}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActionModal("Sort Display Order")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Sort Order</button>
              <button onClick={() => setActionModal("Bulk Visibility Update")} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Bulk Visibility</button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="relative max-w-xl">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${pageLabel.toLowerCase()} / slug / parent...`} className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Active", "Draft", "Visible", "Hidden", isConcern ? "Concern Menu" : "Header"].map((item) => <button key={item} onClick={() => setStatusFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${statusFilter === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <TableHead><tr>{(isConcern ? ["Concern", "Type", "Severity", "Products", "Routine", "SEO", "Banner", "Status", "Action"] : [pageLabel, "Slug", "Parent", "Products", "Menu", "SEO", "Banner", "Status", "Action"]).map((head) => <th key={head} className="px-5 py-4 font-medium">{head}</th>)}</tr></TableHead>
            <tbody>
              {filtered.map((row) => <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${selected.id === row.id ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]" : row.status === "Draft" ? "bg-amber-50/25" : "bg-white"}`}>
                {isConcern ? <>
                  <td className="px-5 py-4"><div className="font-bold text-slate-900">{row.name}</div><div className="mt-1 text-xs text-slate-500">/{isConcern ? "concern" : "category"}/{row.slug}</div></td>
                  <td className="px-5 py-4"><Badge tone="brand">{row.concernType || "Skin"}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={(row.severity || "Medium") === "Advanced" ? "bad" : (row.severity || "Medium") === "Medium" ? "warn" : "good"}>{row.severity || "Medium"}</Badge></td>
                  <td className="px-5 py-4 font-semibold">{row.products}</td>
                  <td className="px-5 py-4"><div className="flex max-w-[240px] flex-wrap gap-1">{(row.routine || []).slice(0, 3).map((step) => <span key={step} className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold text-slate-600">{step}</span>)}</div></td>
                  <td className="px-5 py-4"><Badge tone={row.seo >= 80 ? "good" : row.seo >= 70 ? "warn" : "bad"}>{row.seo}/100</Badge></td>
                  <td className="px-5 py-4"><Badge tone={row.banner === "Ready" ? "good" : row.banner === "Missing" ? "bad" : "warn"}>{row.banner}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={row.status === "Active" ? "good" : "warn"}>{row.status}</Badge></td>
                </> : <>
                  <td className="px-5 py-4"><div className="font-bold text-slate-900">{row.name}</div><div className="mt-1 text-xs text-slate-500">Priority {row.priority} • {row.children} subcategories</div></td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-500">/{isConcern ? "concern" : "category"}/{row.slug}</td>
                  <td className="px-5 py-4">{row.parent}</td>
                  <td className="px-5 py-4 font-semibold">{row.products}</td>
                  <td className="px-5 py-4"><Badge tone={row.menu.includes("Not") ? "default" : "brand"}>{row.menu}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={row.seo >= 80 ? "good" : row.seo >= 70 ? "warn" : "bad"}>{row.seo}/100</Badge></td>
                  <td className="px-5 py-4"><Badge tone={row.banner === "Ready" ? "good" : row.banner === "Missing" ? "bad" : "warn"}>{row.banner}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={row.status === "Active" ? "good" : "warn"}>{row.status}</Badge></td>
                </>}
                <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-2"><button onClick={() => openEditEntryModal(row)} className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white">Edit</button><button onClick={() => { setSelectedId(row.id); setActionModal("Open Storefront Page"); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50">Open</button></div></td>
              </tr>)}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-5 py-14 text-center text-sm text-slate-500">No {pageLabel.toLowerCase()} found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium text-slate-500">Selected {pageLabel}</div><h3 className="mt-1 text-xl font-bold tracking-tight">{selected.name}</h3><div className="mt-1 text-xs text-slate-500">/{isConcern ? "concern" : "category"}/{selected.slug}</div></div><Badge tone={selected.visibility === "Visible" ? "good" : "bad"}>{selected.visibility}</Badge></div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-5 text-white shadow-sm">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
              <div className="absolute -bottom-12 left-1/2 h-36 w-36 rounded-full bg-white/10" />
              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">{isConcern ? "Shop by Concern" : "Storefront Landing"}</div>
                <div className="mt-3 text-2xl font-black tracking-tight">{selected.name}</div>
                <div className="mt-2 max-w-[240px] text-xs font-medium leading-5 text-white/85">{isConcern ? `Find routine-friendly products for ${selected.name.toLowerCase()} concern with simple guidance and safer cosmetic claims.` : "Authentic beauty products mapped with SEO, banner and menu visibility."}</div>
                <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">/{isConcern ? "concern" : "category"}/{selected.slug}</span><span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{selected.products} products</span></div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><Badge tone="brand">SEO {selected.seo}/100</Badge><Badge tone={selected.banner === "Ready" ? "good" : "warn"}>{selected.banner}</Badge><Badge tone="default">{selected.products} products</Badge></div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            {(isConcern ? [["Concern Group", selected.parent], ["Concern Type", selected.concernType || "Skin"], ["Severity", selected.severity || "Medium"], ["Products", selected.products], ["Routine Steps", selected.routine?.length || 0], ["Status", selected.status]] : [["Parent", selected.parent], ["Menu Visibility", selected.menu], ["Display Priority", selected.priority], ["Products", selected.products], ["Sub Items", selected.sub.length], ["Status", selected.status]]).map(([label, value]) => <div key={label} className="flex justify-between rounded-2xl bg-stone-50 px-4 py-3"><span className="text-slate-500">{label}</span><b>{value}</b></div>)}
          </div>
          <div className="mt-5 grid gap-3"><button onClick={() => setActionModal(`Edit ${selected.name}`)} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Edit {pageLabel}</button><button onClick={() => setActionModal("SEO Settings")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">SEO Settings</button><button onClick={() => setActionModal("Banner Upload")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Upload Banner</button></div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">{isConcern ? "Concern Mapping" : "Mapped Discovery"}</div>
          <h3 className="mt-1 text-xl font-bold tracking-tight">{isConcern ? "Routine / Related Filters" : "Sub Items / Filters"}</h3>
          <div className="mt-5 flex flex-wrap gap-2">{(isConcern ? selected.routine || selected.sub : selected.sub).map((item) => <span key={item} className="rounded-full bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]">{item}</span>)}</div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-3"><div className="text-sm font-medium text-slate-500">Top Mapped Products</div>{isConcern && <Badge tone="good">Filter ON</Badge>}</div>
            <div className="mt-3 space-y-2">{(mappedProductsById[selected.id] || []).slice(0, 4).map((item, index) => <div key={item} className="rounded-2xl bg-stone-50 px-4 py-3 text-xs">
              <div className="flex items-center justify-between gap-3"><span className="font-bold text-slate-700">{item}</span><span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">#{index + 1}</span></div>
              {isConcern && <div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-white px-2 py-1 font-bold text-slate-500">{index === 0 ? "Best Match" : "Related"}</span><span className="rounded-full bg-white px-2 py-1 font-bold text-slate-500">Step {(selected.routine || [])[Math.min(index, (selected.routine || []).length - 1)] || "Routine"}</span></div>}
            </div>)}</div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-sm font-bold text-amber-800">SEO + Storefront Note</div>
          <div className="mt-2 text-sm leading-6 text-amber-700">{isConcern ? "Every visible concern should have clean slug, educational intro, SEO title, meta description, routine mapping and safe cosmetic wording before showing on storefront." : `Every visible ${pageLabel.toLowerCase()} should have clean slug, banner, SEO title, meta description and mapped products before showing on storefront.`}</div>
        </div>
      </div>
    </div>

    {actionModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">{pageLabel} Action</div><h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{modalTitle}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{isEntryFormModal ? isConcern ? "Concern landing page, SEO, routine and product mapping er jonno ready form. Save korle pore Supabase concern table e jabe." : "Category/subcategory database integration er jonno ready form. Save korle pore Supabase table e jabe." : "This action is prepared for real database, SEO and storefront integration later."}</p></div><button onClick={() => setActionModal(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">✕</button></div>
        {isEntryFormModal ? <>
          {!isConcern && <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Parent Category", "Subcategory"].map((item) => <button key={item} onClick={() => setEntryType(item)} className={`rounded-2xl px-4 py-3 text-sm font-bold ${entryType === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-stone-50 text-slate-600"}`}>{item}</button>)}
          </div>}
          {isConcern && <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Skin", "Hair", "Body"].map((item) => <button key={item} onClick={() => setDraftEntry({ ...draftEntry, concernType: item, parent: `${item} Concern` })} className={`rounded-2xl px-4 py-3 text-sm font-bold ${draftEntry.concernType === item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-stone-50 text-slate-600"}`}>{item} Concern</button>)}
          </div>}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Name<input value={draftEntry.name} onChange={(e) => setDraftEntry({ ...draftEntry, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder={isSubEntry ? "Face Wash" : isConcern ? "Acne" : "Skincare"} /></label>
            <label className="text-sm font-semibold text-slate-700">Slug<input value={draftEntry.slug || autoDraftSlug} onChange={(e) => setDraftEntry({ ...draftEntry, slug: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none" /></label>
            {(isSubEntry || isConcern) && <label className="text-sm font-semibold text-slate-700">{isConcern ? "Concern Group" : "Parent"}<SelectPill value={draftEntry.parent} onChange={(value) => setDraftEntry({ ...draftEntry, parent: value })} options={parentOptions} /></label>}
            {isConcern && <label className="text-sm font-semibold text-slate-700">Severity<select value={draftEntry.severity} onChange={(e) => setDraftEntry({ ...draftEntry, severity: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Mild</option><option>Medium</option><option>Advanced</option></select></label>}
            {isConcern && <label className="md:col-span-2 text-sm font-semibold text-slate-700">Related Categories<input value={draftEntry.relatedCategories} onChange={(e) => setDraftEntry({ ...draftEntry, relatedCategories: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Face Wash, Serum, Sunscreen" /></label>}
            <label className="text-sm font-semibold text-slate-700">Visibility<select value={draftEntry.visibility} onChange={(e) => setDraftEntry({ ...draftEntry, visibility: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Visible</option><option>Hidden</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Menu Placement<select value={draftEntry.menu} onChange={(e) => setDraftEntry({ ...draftEntry, menu: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Header</option><option>Under Parent</option><option>Concern Menu</option><option>Not in Menu</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Status<select value={draftEntry.status} onChange={(e) => setDraftEntry({ ...draftEntry, status: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Active</option><option>Draft</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Sort Order<input value={draftEntry.priority} onChange={(e) => setDraftEntry({ ...draftEntry, priority: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" /></label>
            <label className="text-sm font-semibold text-slate-700">Banner Status<select value={draftEntry.banner} onChange={(e) => setDraftEntry({ ...draftEntry, banner: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option>Ready</option><option>Needs Image</option><option>Draft</option><option>Missing</option></select></label>
            <label className="md:col-span-2 text-sm font-semibold text-slate-700">SEO Title<input value={draftEntry.seoTitle} onChange={(e) => setDraftEntry({ ...draftEntry, seoTitle: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder={`${draftEntry.name || pageLabel} price in Bangladesh | BrandnBeauty`} /></label>
            <label className="md:col-span-2 text-sm font-semibold text-slate-700">Meta Description<textarea value={draftEntry.metaDescription} onChange={(e) => setDraftEntry({ ...draftEntry, metaDescription: e.target.value })} className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder={isConcern ? "Find acne care products in Bangladesh with simple routine guidance..." : "Write SEO meta description..."} /></label>
            {isConcern && <label className="md:col-span-2 text-sm font-semibold text-slate-700">Concern Education Copy<textarea value={draftEntry.education} onChange={(e) => setDraftEntry({ ...draftEntry, education: e.target.value })} className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Short educational intro for concern landing page..." /></label>}
            {isConcern && <label className="md:col-span-2 text-sm font-semibold text-slate-700">Safety Note<textarea value={draftEntry.safetyNote} onChange={(e) => setDraftEntry({ ...draftEntry, safetyNote: e.target.value })} className="mt-2 h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Cosmetic guidance only. Patch test before use." /></label>}
          </div>
          <div className="mt-5 rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm font-semibold leading-6 text-slate-700">{isConcern ? `${draftEntry.name || "Concern"} will be saved under ${draftEntry.parent}. It will control concern landing SEO, routine suggestion, product mapping and storefront filter visibility.` : isSubEntry ? `${draftEntry.name || "Subcategory"} will be saved under ${draftEntry.parent}. Product form e parent category select korle ei subcategory show korbe.` : `${draftEntry.name || pageLabel} will be created as a parent discovery page with SEO, banner and menu control.`}</div>
        </> : <div className="mt-6 grid gap-3 md:grid-cols-2">{actionFeatures.map((item) => <div key={item} className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-700">✓ {item}</div>)}</div>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setActionModal(null)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Close</button><button onClick={() => setActionModal(null)} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">{isEntryFormModal ? editingEntry ? "Save Changes" : "Save Draft" : "Confirm"}</button></div>
      </div>
    </div>}
  </div>;
}
