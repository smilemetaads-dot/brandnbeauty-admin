import { AdminShell } from "@/components/admin/AdminShell";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const priorityItems = [
  ["Connect live orders module", "Orders", "Not Connected"],
  ["Connect inventory alerts", "Inventory", "Not Connected"],
  ["Connect courier settlement", "Courier", "Not Connected"],
  ["Connect finance reconciliation", "Finance", "Not Connected"],
];

const recentOrders = [
  ["Setup preview", "Orders module", "BDT --", "Not connected", "Preview"],
  ["Setup preview", "Courier module", "BDT --", "Not connected", "Preview"],
  ["Setup preview", "Finance module", "BDT --", "Not connected", "Preview"],
  ["Setup preview", "Inventory module", "BDT --", "Not connected", "Preview"],
];

const lowStock = [
  ["Inventory alerts", "Not connected", "Live stock rules come later"],
  ["Purchase stock entry", "Not connected", "Supplier flow comes later"],
  ["Out of stock blocking", "Not connected", "Product status exists first"],
];

const topProducts = [
  ["Products module", "Live catalog list connected", "Ready"],
  ["Product editor", "Create/update flow connected", "Ready"],
  ["Product status", "Archive-safe status flow connected", "Ready"],
];

const health = [
  ["Catalog Foundation", "96%", "Products, categories, concerns and brands connected"],
  ["Order Flow", "18%", "Orders module is a future live connection"],
  ["Stock Health", "32%", "Inventory module is a future live connection"],
  ["Finance Match", "12%", "Finance module is a future live connection"],
];

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#527B86]/10 text-[#527B86]",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function ChartCard() {
  const values = [42, 56, 61, 48, 72, 66, 58];
  const max = Math.max(...values);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500">
            Sales Trend
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            Weekly Revenue Preview
          </h2>
        </div>
        <Badge tone="brand">Setup Preview</Badge>
      </div>
      <div className="mt-6 flex h-72 items-end gap-4 overflow-x-auto rounded-3xl bg-stone-50 p-5">
        {values.map((value, index) => (
          <div
            className="flex min-w-[70px] flex-1 flex-col items-center gap-3"
            key={index}
          >
            <div className="text-xs font-semibold text-slate-500">
              BDT {value}k
            </div>
            <div className="flex h-48 w-full items-end justify-center rounded-2xl bg-white p-2">
              <div
                className="w-8 rounded-2xl bg-[#527B86]"
                style={{ height: `${(value / max) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">
        Static setup preview only. Live order and finance analytics are not
        connected yet.
      </p>
    </section>
  );
}

function DisabledQuickAction({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="group flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-semibold text-slate-400"
      disabled
      type="button"
    >
      <span>{children}</span>
      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-400">
        Not Connected
      </span>
    </button>
  );
}

export default function Home() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#527B86] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                  Overview
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Admin Command Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  A clean summary-only control room for the Zero Start admin
                  build. Detailed work stays inside the catalog, orders,
                  inventory, courier and finance modules as they come online.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Today Focus</div>
                  <div className="mt-1 text-lg font-black">Catalog Polish</div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Dispatch</div>
                  <div className="mt-1 text-lg font-black">Not Connected</div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-white/70">Profit</div>
                  <div className="mt-1 text-lg font-black">Not Connected</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <ChartCard />
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Action Priority
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Today Must Do
                </h2>
              </div>
              <Badge tone="warn">Setup Preview</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {priorityItems.map(([title, sub, level]) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4 text-sm"
                  key={title}
                >
                  <div>
                    <div className="font-bold text-slate-950">{title}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {sub}
                    </div>
                  </div>
                  <Badge tone="default">{level}</Badge>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Operations
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Recent Orders Preview
                </h2>
              </div>
              <Badge tone="default">Demo Setup Data</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                  <tr>
                    {["Record", "Module", "Amount", "Status", "Action"].map(
                      (head) => (
                        <th className="px-5 py-4 font-medium" key={head}>
                          {head}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((row) => (
                    <tr
                      className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86]"
                      key={`${row[0]}-${row[1]}`}
                    >
                      <td className="px-5 py-4 font-bold text-slate-950">
                        {row[0]}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{row[1]}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {row[2]}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="default">{row[3]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                          disabled
                          type="button"
                        >
                          {row[4]}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Business Health
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Snapshot
              </h2>
              <div className="mt-5 space-y-4">
                {health.map(([label, value, note]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-[#527B86]"
                        style={{ width: value }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{note}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">ERP Note</div>
              <div className="mt-2 text-sm leading-6 text-amber-700">
                Dashboard stays summary-only. Detailed actions will happen
                later inside Orders, Inventory, Courier and Finance pages.
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Low Stock Alert
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Restock Watch
            </h2>
            <div className="mt-5 space-y-3">
              {lowStock.map(([name, qty, note]) => (
                <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm" key={name}>
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-slate-950">{name}</b>
                    <span className="font-bold text-amber-700">{qty}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Top Products
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Catalog Winners
            </h2>
            <div className="mt-5 space-y-3">
              {topProducts.map(([name, detail, status], index) => (
                <div
                  className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm"
                  key={name}
                >
                  <div>
                    <div className="font-bold text-slate-950">
                      #{index + 1} {name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{detail}</div>
                  </div>
                  <b className="text-[#527B86]">{status}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-1">
            <div className="text-sm font-medium text-slate-500">
              Quick Actions
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Control Shortcuts
            </h2>
            <div className="mt-5 space-y-3">
              {[
                "Confirm Orders",
                "Print Invoices",
                "Send Courier",
                "Create Purchase Entry",
              ].map((item) => (
                <DisabledQuickAction key={item}>{item}</DisabledQuickAction>
              ))}
            </div>
          </section>
        </section>
      </div>
    </AdminShell>
  );
}
