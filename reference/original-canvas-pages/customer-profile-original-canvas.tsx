// REFERENCE ONLY.
// Original Canvas Customer Profile design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Customer Profile page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

function CustomerProfilePage() {
  // LOCKED: Customer Profile page frozen for current phase. Only revisit during final polish or explicit fixes.
  const profile = { name: "Sadia Akter", initials: "SA", phone: "01822XXXXXX", city: "Gazipur", joined: "Jan 2026", segment: "VIP", spend: "à§³18,420", orders: 14, loyalty: 72, risk: "Low" };
  const history = [["#1021", "Delivered", "à§³1,930"], ["#1018", "Returned", "à§³980"], ["#1002", "Delivered", "à§³1,450"], ["#0997", "Delivered", "à§³1,260"]];
  const favoriteProducts = ["Barrier Calm Serum", "Acne Balance Facewash", "Daily Sun Gel"];
  const communication = ["WhatsApp replied yesterday", "Called last week", "Messenger seen 3 days ago"];
  const liveActivity = ["Viewed serum page 2h ago", "Added combo to cart yesterday", "Opened Messenger ad this week"];
  const profileTags = ["VIP", "Repeat Buyer", "Acne Concern", "High AOV"];
  const notes = ["Prefers evening delivery", "Usually responds on WhatsApp", "Interested in combo offers"];
  const monthlySpend = [18, 10, 14, 22, 16, 28];
  const maxSpend = Math.max(...monthlySpend);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["Total Orders", "14", "4 in last 30 days"], ["Lifetime Value", "à§³18,420", "High repeat potential"], ["COD Risk Score", "22/100", "Low risk customer"], ["Last Order", "2 days ago", "Recently active"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#5E7F85]/10 via-white to-stone-50 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-[#5E7F85] text-2xl font-black text-white shadow-sm">
                    {profile.initials}
                    <div className="absolute -bottom-2 -right-2 rounded-full border-4 border-white bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">VIP</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500">Customer Identity</div>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">{profile.name}</h2>
                    <div className="mt-1 text-sm text-slate-500">{profile.phone} â€¢ {profile.city}</div>
                    <div className="mt-3 flex flex-wrap gap-2"><Badge tone="brand">{profile.segment}</Badge><Badge tone="good">{profile.risk} Risk</Badge></div>
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[8px] border-stone-100">
                    <div className="absolute inset-0 rounded-full border-[8px] border-[#5E7F85]" style={{ clipPath: `inset(${100 - profile.loyalty}% 0 0 0)` }} />
                    <div className="text-xl font-black text-[#5E7F85]">{profile.loyalty}%</div>
                  </div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Loyalty</div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-3">
              {[["Joined", profile.joined], ["Orders", profile.orders], ["Spend", profile.spend]].map(([k, v]) => <div key={k} className="rounded-2xl bg-stone-50 p-4"><div className="text-xs text-slate-500">{k}</div><div className="mt-1 font-bold text-slate-900">{v}</div></div>)}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Purchase Timeline</div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">6 Month Spend Trend</h3>
              <div className="mt-5 flex h-40 items-end gap-3 rounded-2xl bg-stone-50 p-4">
                {monthlySpend.map((value, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-xl bg-[#5E7F85]" style={{ height: `${(value / maxSpend) * 100}%` }} /><div className="text-[10px] text-slate-500">{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}</div></div>)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Favorite Products</div>
              <h3 className="mt-1 text-xl font-bold tracking-tight">Most Purchased</h3>
              <div className="mt-5 space-y-3">{favoriteProducts.map((item) => <div key={item} className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>)}</div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-slate-500">Order History</div><h3 className="mt-1 text-xl font-bold tracking-tight">Recent Orders</h3></div><button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">Export</button></div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-stone-50 text-slate-500"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Amount</th></tr></thead><tbody>{history.map(([id, status, amt]) => <tr key={id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold">{id}</td><td className="px-4 py-3"><Badge tone={status === "Returned" ? "bad" : status === "Partial" ? "warn" : "good"}>{status}</Badge></td><td className="px-4 py-3 text-right font-bold">{amt}</td></tr>)}</tbody></table></div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Live Activity Feed</div>
              <div className="mt-4 space-y-3">{liveActivity.map((item) => <div key={item} className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>)}</div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Tags & Notes</div>
              <div className="mt-4 flex flex-wrap gap-2">{profileTags.map((tag) => <span key={tag} className="rounded-full bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]">{tag}</span>)}</div>
              <div className="mt-4 space-y-2">{notes.map((note) => <div key={note} className="rounded-xl bg-stone-50 px-3 py-2 text-xs font-semibold text-slate-700">â€¢ {note}</div>)}</div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Risk Intelligence</div>
              <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Cancel Chance</span><b>8%</b></div><div className="flex justify-between"><span className="text-slate-500">Return Probability</span><b>12%</b></div><div className="flex justify-between"><span className="text-slate-500">Preferred Channel</span><b>WhatsApp</b></div></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight">Action Center</h3>
            <div className="mt-5 grid gap-3">
              <button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Create Order</button>
              <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">WhatsApp Offer</button>
              <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Call Customer</button>
              <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Upsell Combo</button>
              <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Recovery Offer</button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="text-sm font-bold text-amber-800">AI Recommendation</div>
            <div className="mt-2 text-sm leading-6 text-amber-700">Send serum + cleanser combo tonight 8PM with free delivery. Estimated reorder chance 74%.</div>
            <div className="mt-4 space-y-2">{communication.map((item) => <div key={item} className="rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-amber-800">{item}</div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
