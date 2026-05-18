import { AdminShell } from "@/components/admin/AdminShell";

import type { InventoryProductRecord } from "./inventory-data";

type RealInventoryPageProps = {
  products: InventoryProductRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const LOW_STOCK_THRESHOLD = 10;

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

function StatCard({
  label,
  value,
  helper,
  active = false,
}: {
  label: string;
  value: string;
  helper: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border bg-white p-5 shadow-sm ${
        active ? "border-[#527B86] ring-2 ring-[#527B86]/15" : "border-slate-200"
      }`}
    >
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-3 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600">
        {helper}
      </div>
    </div>
  );
}

function getStockTone(stock: number): BadgeTone {
  if (stock <= 0) {
    return "bad";
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return "warn";
  }

  return "good";
}

function getStatusTone(status: string | null): BadgeTone {
  if (status === "active") {
    return "good";
  }

  if (status === "out_of_stock") {
    return "bad";
  }

  if (status === "low_stock") {
    return "warn";
  }

  return "default";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: string | null) {
  return status ? status.replaceAll("_", " ") : "unknown";
}

export function RealInventoryPage({ products }: RealInventoryPageProps) {
  const totalSkus = products.length;
  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
  ).length;
  const outOfStockCount = products.filter((product) => product.stock <= 0)
    .length;
  const activeProductsCount = products.filter(
    (product) => product.status === "active",
  ).length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#527B86]">
                Catalog Operations
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Inventory
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Read-only stock overview from live product records. Stock
                adjustment and movement history will be added in later steps.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                disabled
                type="button"
              >
                Stock Adjustment Not Connected
              </button>
              <button
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                disabled
                type="button"
              >
                Movement History Later
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Stock adjustment:{" "}
              <b className="text-amber-700">Not connected yet</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Stock movement history:{" "}
              <b className="text-amber-700">Will come later</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            active
            helper="Live product rows"
            label="Total SKUs"
            value={String(totalSkus)}
          />
          <StatCard
            helper={`1-${LOW_STOCK_THRESHOLD} units`}
            label="Low Stock"
            value={String(lowStockCount)}
          />
          <StatCard
            helper="Zero or below"
            label="Out of Stock"
            value={String(outOfStockCount)}
          />
          <StatCard
            helper="Status active"
            label="Active Products"
            value={String(activeProductsCount)}
          />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Product Stock List
                </h2>
                <Badge tone="brand">Read Only</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ordered by lowest stock first, then product name.
              </p>
            </div>
            <Badge tone="default">No stock mutation in this step</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                <tr>
                  {[
                    "Product",
                    "SKU",
                    "Brand",
                    "Category",
                    "Stock",
                    "Status",
                    "Updated",
                  ].map((head) => (
                    <th className="px-5 py-4 font-medium" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr
                      className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#527B86]"
                      key={product.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#527B86]/10 text-xs font-black text-[#527B86]">
                            {product.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-950">
                              {product.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {product.slug} / BDT {product.price}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {product.sku ?? "No SKU"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {product.brands?.name ?? "No brand"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {product.categories?.name ?? "No category"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getStockTone(product.stock)}>
                          {product.stock}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={getStatusTone(product.status)}>
                          {formatStatus(product.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(product.updated_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-5 py-14 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      No inventory products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
