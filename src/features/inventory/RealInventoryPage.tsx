import Image from "next/image";

import { AdminShell } from "@/components/admin/AdminShell";

import type {
  InventoryMovementRecord,
  InventoryProductRecord,
} from "./inventory-data";
import { StockAdjustmentForm } from "./StockAdjustmentForm";

type RealInventoryPageProps = {
  movements: InventoryMovementRecord[];
  products: InventoryProductRecord[];
};

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const LOW_STOCK_THRESHOLD = 10;
const HEALTHY_STOCK_SCALE = 50;

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
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
  icon,
  active = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.7rem] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85] transition group-hover:bg-[#5E7F85] group-hover:text-white">
          {icon}
        </div>
      </div>
      <div className="relative mt-4 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600">
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

function getStockLabel(stock: number) {
  if (stock <= 0) {
    return "Out";
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return "Low";
  }

  return "Healthy";
}

function getStockPercentage(stock: number) {
  return Math.min(Math.max((stock / HEALTHY_STOCK_SCALE) * 100, 0), 100);
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

function formatMovementType(value: string) {
  const labels: Record<string, string> = {
    stock_in: "Stock In",
    stock_out: "Stock Out",
    correction: "Correction",
    order_deduction: "Order Deduction",
    order_restore: "Order Restore",
    manual_adjustment: "Manual Adjustment",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function DisabledAction({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function SectionHeader({
  badge,
  children,
  helper,
  tone = "brand",
}: {
  badge?: string;
  children: React.ReactNode;
  helper?: string;
  tone?: BadgeTone;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            {children}
          </h2>
          {badge ? <Badge tone={tone}>{badge}</Badge> : null}
        </div>
        {helper ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function RealInventoryPage({
  movements,
  products,
}: RealInventoryPageProps) {
  const totalSkus = products.length;
  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
  ).length;
  const outOfStockCount = products.filter((product) => product.stock <= 0)
    .length;
  const activeProductsCount = products.filter(
    (product) => product.status === "active",
  ).length;
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
  );
  const outOfStockProducts = products.filter((product) => product.stock <= 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5E7F85]">
                Catalog Operations
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Inventory Control Center
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Clean live stock view from Supabase products with source-style
                health badges, low-stock awareness, and future-safe operational
                placeholders.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DisabledAction>Import CSV Not Connected</DisabledAction>
              <div className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">
                Manual Adjustment Connected
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Read mode: <b className="text-[#5E7F85]">Live products</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Stock adjustment: <b className="text-emerald-700">Connected</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Movement logging: <b className="text-emerald-700">Connected</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Safety: <b className="text-emerald-700">No hard delete</b>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            active
            helper="Live product rows"
            icon="SKU"
            label="Total SKUs"
            value={String(totalSkus)}
          />
          <StatCard
            helper={`1-${LOW_STOCK_THRESHOLD} units`}
            icon="LO"
            label="Low Stock"
            value={String(lowStockCount)}
          />
          <StatCard
            helper="Zero or below"
            icon="OO"
            label="Out of Stock"
            value={String(outOfStockCount)}
          />
          <StatCard
            helper="Status active"
            icon="AC"
            label="Active Products"
            value={String(activeProductsCount)}
          />
        </section>

        <StockAdjustmentForm products={products} />

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeader badge="Automation Ready" helper={
              "Ordered by lowest stock first, then product name. Progress bars are derived from live stock only."
            }>
              Inventory Stock Directory
            </SectionHeader>
            <div>
              <p className="sr-only">
                Ordered by lowest stock first, then product name. Progress bars
                are derived from live stock only.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Manual Adjust Connected
              </div>
              <DisabledAction>Export Not Connected</DisabledAction>
            </div>
          </div>

          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500 xl:min-w-[320px]">
                Search/filter UI will connect after inventory workflows are
                built.
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["All", products.length, "default"],
                  ["Healthy", products.length - lowStockCount - outOfStockCount, "good"],
                  ["Low", lowStockCount, "warn"],
                  ["Out", outOfStockCount, "bad"],
                ].map(([label, count, tone]) => (
                  <Badge key={label} tone={tone as BadgeTone}>
                    {label}: {count}
                  </Badge>
                ))}
              </div>
            </div>
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
                    "Health",
                    "Status",
                    "Updated",
                    "Action",
                  ].map((head) => (
                    <th className="px-5 py-4 font-medium" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const stockPercentage = getStockPercentage(product.stock);
                    const stockLabel = getStockLabel(product.stock);

                    return (
                      <tr
                          className={`border-t border-slate-100 transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85] ${
                          stockLabel === "Out"
                            ? "bg-rose-50/40"
                            : stockLabel === "Low"
                              ? "bg-amber-50/40"
                              : "bg-white"
                        }`}
                        key={product.id}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <Image
                                alt=""
                                className="h-11 w-11 rounded-2xl bg-stone-100 object-cover"
                                height={44}
                                src={product.image}
                                unoptimized
                                width={44}
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">
                                {product.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
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
                          <div className="font-bold text-slate-950">
                            {product.stock}
                          </div>
                          <div className="mt-2 h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#5E7F85]"
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getStockTone(product.stock)}>
                            {stockLabel}
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
                        <td className="px-5 py-4">
                          <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                            disabled
                            type="button"
                          >
                            Open Later
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="px-5 py-14 text-center text-sm text-slate-500"
                      colSpan={9}
                    >
                      No inventory products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeader
              badge="Connected"
              helper="Latest read-only movement rows from inventory_movements."
            >
              Recent Stock Movements
            </SectionHeader>
            <Badge tone="default">Recent {movements.length}</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                <tr>
                  {[
                    "Product",
                    "Movement Type",
                    "Quantity",
                    "Previous Stock",
                    "New Stock",
                    "Note",
                    "Created At",
                  ].map((head) => (
                    <th className="px-5 py-4 font-medium" key={head}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.length > 0 ? (
                  movements.map((movement) => (
                    <tr
                      className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                      key={movement.id}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-950">
                          {movement.products?.name ?? "Unknown product"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {movement.products?.sku ?? "No SKU"} /{" "}
                          {movement.products?.slug ?? movement.product_id}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="brand">
                          {formatMovementType(movement.movement_type)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {movement.quantity}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {movement.previous_stock}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {movement.new_stock}
                      </td>
                      <td className="max-w-[260px] px-5 py-4 text-slate-600">
                        {movement.note ?? "No note"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(movement.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-5 py-14 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      No inventory movements found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-amber-900">Smart Alerts</h2>
            <div className="mt-4 space-y-3 text-sm text-amber-900">
              <div className="rounded-2xl bg-white/70 p-4">
                {lowStockCount} SKUs are at or below {LOW_STOCK_THRESHOLD}{" "}
                units.
                {lowStockProducts[0] ? ` Watch: ${lowStockProducts[0].name}.` : ""}
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                {outOfStockCount} products are out of stock.
                {outOfStockProducts[0]
                  ? ` First blocked item: ${outOfStockProducts[0].name}.`
                  : ""}
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                Stock adjustment is connected with negative-stock prevention.
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                Movement rows are logged in inventory_movements.
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Today Stock Movement
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              New manual adjustments are logged and shown in the recent movement
              history table above.
            </p>
            <div className="mt-5 space-y-3">
              {[
                "Stock In Logged",
                "Stock Out Logged",
                "Correction Logged",
              ].map((item) => (
                <div className="rounded-2xl bg-stone-50 p-4 text-sm" key={item}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{item}</span>
                    <Badge tone="brand">Action Log</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Quick Actions
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Source actions are visible as disabled placeholders only.
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Manual Stock Adjustment",
                  status: "Connected",
                  connected: true,
                },
                {
                  label: "Bulk Update",
                  status: "Not Connected",
                  connected: false,
                },
                {
                  label: "Export Report",
                  status: "Not Connected",
                  connected: false,
                },
              ].map((item) => (
                <button
                  className={`flex w-full items-center justify-between rounded-2xl p-4 text-left text-sm font-semibold ${
                    item.connected
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-stone-50 text-slate-400"
                  }`}
                  disabled
                  key={item.label}
                  type="button"
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full bg-white px-3 py-1 text-[11px] font-bold ${
                      item.connected ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </section>
      </div>
    </AdminShell>
  );
}
