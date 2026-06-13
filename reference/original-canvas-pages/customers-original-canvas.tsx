// REFERENCE ONLY.
// Original Canvas Customers design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Customers page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

function CustomersPage() {
  const customers = [
    { name: "Sadia Akter", phone: "01822XXXXXX", orders: 6, spend: 8420, city: "Gazipur", segment: "VIP", risk: "Low", last: "2 days ago" },
    { name: "Raisa Khan", phone: "01711XXXXXX", orders: 3, spend: 2980, city: "Dhaka", segment: "Repeat", risk: "Medium", last: "7 days ago" },
    { name: "Ayesha Siddika", phone: "01933XXXXXX", orders: 1, spend: 2020, city: "Narayanganj", segment: "New", risk: "Medium", last: "Today" },
    { name: "Mitu Islam", phone: "01644XXXXXX", orders: 4, spend: 5450, city: "Chattogram", segment: "Sleeping", risk: "High", last: "31 days ago" }
  ];
  const [selected, setSelected] = useState(customers[0]);
  const lastOrders = [
    ["#1021", "Delivered", "à§³1,930"],
    ["#1018", "Returned", "à§³980"],
    ["#1012", "Partial", "à§³2,020"]
  ];
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("All");

  const filtered = customers.filter((c) => {
    const bySeg = segment === "All" || c.segment === segment || (segment === "Risk" && c.risk === "High");
    const q = search.toLowerCase();
    const bySearch = !q || `${c.name} ${c.phone} ${c.city}`.toLowerCase().includes(q);
    return bySeg && bySearch;
  });

  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[['Total Customers','1,284','Growing base'],['Repeat Rate','38%','Strong retention'],['VIP Customers','84','High LTV'],['Risk Customers','19','Need followup']].map((item,index)=><StatCard key={item[0]} item={item} index={index} />)}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="text-sm font-medium text-slate-500">CRM Center</div><h2 className="mt-1 text-xl font-bold tracking-tight">Customers Database</h2></div>
            <div className="flex gap-2"><button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Export</button><button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Create Segment</button></div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search customer / phone / city..." className="w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none" />
            <div className="flex flex-wrap gap-2">{['All','VIP','Repeat','Sleeping','Risk'].map((item)=><button key={item} onClick={()=>setSegment(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${segment===item?'bg-[#5E7F85] text-white':'border border-slate-200 bg-white text-slate-600'}`}>{item}</button>)}</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <TableHead><tr>{['Customer','Orders','Lifetime Spend','City','Segment','Risk','Last Order','Action'].map(h=><th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></TableHead>
            <tbody>
              {filtered.map((row)=><tr key={row.phone} onClick={()=>setSelected(row)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${selected.phone===row.phone ? 'bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]' : 'bg-white'}`}>
                <td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.name}</div><div className="text-xs text-slate-500">{row.phone}</div></td>
                <td className="px-5 py-4 font-semibold">{row.orders}</td>
                <td className="px-5 py-4 font-semibold">à§³{row.spend.toLocaleString()}</td>
                <td className="px-5 py-4">{row.city}</td>
                <td className="px-5 py-4"><Badge tone={row.segment==='VIP'?'brand':row.segment==='Sleeping'?'warn':'good'}>{row.segment}</Badge></td>
                <td className="px-5 py-4"><Badge tone={row.risk==='High'?'bad':row.risk==='Medium'?'warn':'good'}>{row.risk}</Badge></td>
                <td className="px-5 py-4">{row.last}</td>
                <td className="px-5 py-4"><ActionButtons actions={['Open','Offer']} /></td>
              </tr>)}
              {filtered.length===0 && <tr><td colSpan="8" className="px-5 py-10 text-center text-slate-500">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Customer Profile</div><h3 className="mt-1 text-xl font-bold tracking-tight">{selected.name}</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><b>{selected.phone}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Orders</span><b>{selected.orders}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Lifetime Value</span><b>à§³{selected.spend.toLocaleString()}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Segment</span><b>{selected.segment}</b></div>
          </div>
          <div className="mt-5 grid gap-3">
            <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">WhatsApp Offer</button>
            <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Call Customer</button>
            <button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Create Manual Order</button>
          </div>
          <div className="mt-5 rounded-2xl bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Last Orders</div>
            <div className="mt-3 space-y-2">
              {lastOrders.map(([id,status,amount]) => <div key={id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs"><div><div className="font-bold text-slate-900">{id}</div><div className="text-slate-500">{status}</div></div><b>{amount}</b></div>)}
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-sm font-bold text-amber-800">AI Suggestion</div>
          <div className="mt-2 text-sm leading-6 text-amber-700">{selected.name} bought before. Send combo serum offer with free delivery.</div>
        </div>
      </div>
    </div>
  </div>;
}
