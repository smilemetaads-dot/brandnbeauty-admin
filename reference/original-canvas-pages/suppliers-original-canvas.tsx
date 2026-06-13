// REFERENCE ONLY.
// Original Canvas Suppliers design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Suppliers page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

function SuppliersPage() {
  // LOCKED: Suppliers page frozen for current phase. Revisit later for real save-to-list/database integration.
  const supplierRows = [
    { name: "Some By Mi", contact: "Nabila Trading", phone: "01888XXXXXX", products: 12, purchase: 124000, payable: 22000, paid: 102000, lead: "7 days", score: 92, status: "Active", terms: "Net 15", lastPO: "2 days ago", category: "Skincare" },
    { name: "Simple", contact: "Glow Import BD", phone: "01777XXXXXX", products: 8, purchase: 48000, payable: 0, paid: 48000, lead: "4 days", score: 88, status: "Active", terms: "Advance", lastPO: "6 days ago", category: "Moisturizer" },
    { name: "Beauty of Joseon", contact: "K-Beauty Hub", phone: "01999XXXXXX", products: 6, purchase: 82500, payable: 18500, paid: 64000, lead: "10 days", score: 76, status: "Inactive", terms: "Net 30", lastPO: "21 days ago", category: "Premium" },
    { name: "BrandnBeauty Factory", contact: "Internal Production", phone: "01666XXXXXX", products: 28, purchase: 192000, payable: 0, paid: 192000, lead: "2 days", score: 97, status: "Primary", terms: "Internal", lastPO: "Today", category: "Own Brand" },
  ];
  const [selected, setSelected] = useState(supplierRows[0]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", contact: "", phone: "", category: "Skincare", terms: "Net 15", lead: "7 days", status: "Active", note: "" });
  useEffect(() => {
    const open = () => setAddSupplierOpen(true);
    window.addEventListener("bnb-open-add-supplier", open);
    return () => window.removeEventListener("bnb-open-add-supplier", open);
  }, []);
  const filtered = supplierRows.filter((s) => {
    const q = search.toLowerCase();
    const bySearch = !q || `${s.name} ${s.contact} ${s.status} ${s.category}`.toLowerCase().includes(q);
    const byStatus = statusFilter === "All" || s.status === statusFilter || (statusFilter === "Due" && s.payable > 0);
    return bySearch && byStatus;
  });
  const totalDue = supplierRows.reduce((sum, row) => sum + row.payable, 0);
  const avgLead = Math.round(supplierRows.reduce((sum, row) => sum + Number(row.lead.replace(/[^0-9]/g, "")), 0) / supplierRows.length);
  const recentPOs = [["PO-2201", "Some By Mi", "à§³24,500", "Received"], ["PO-2198", "BrandnBeauty Factory", "à§³38,000", "In Production"], ["PO-2194", "Beauty of Joseon", "à§³18,500", "Due"]];

  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard item={["Total Suppliers", String(supplierRows.length), "Approved vendors"]} index={0} />
      <StatCard item={["Outstanding Due", `à§³${totalDue.toLocaleString()}`, "Need settlement"]} index={1} />
      <StatCard item={["Avg Lead Time", `${avgLead} days`, "Restock planning"]} index={2} />
      <StatCard item={["Top Score", "97%", "Best vendor health"]} index={3} />
    </div>

    <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-gradient-to-r from-[#5E7F85]/10 via-white to-stone-50 p-5 text-sm shadow-sm">
      <div className="font-bold text-slate-900">Procurement Focus</div>
      <div className="mt-1 text-slate-600">Payable due à§³{totalDue.toLocaleString()} â€¢ Prioritize fast lead-time suppliers for best-selling SKUs.</div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">Vendor Control Room</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight">Suppliers Directory</h2>
              <div className="mt-1 text-sm text-slate-500">Manage purchasing, payables, lead time and supplier health.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Export</button>
              <button onClick={() => setAddSupplierOpen(true)} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Add Supplier</button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search supplier / contact / category..." className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" />
            <div className="flex flex-wrap gap-2">{["All", "Active", "Primary", "Inactive", "Due"].map((item)=><button key={item} onClick={()=>setStatusFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${statusFilter===item ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
