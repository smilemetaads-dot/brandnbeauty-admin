import {
  AdminActionButtons,
  AdminBadge,
  AdminChartCard,
  AdminSectionCard,
  AdminTable,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
} from "@/components/admin/AdminUiPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";

const previewBars = [
  { label: "Mon", value: 42, valueLabel: "Preview" },
  { label: "Tue", value: 56, valueLabel: "Preview" },
  { label: "Wed", value: 61, valueLabel: "Preview" },
  { label: "Thu", value: 48, valueLabel: "Preview" },
  { label: "Fri", value: 72, valueLabel: "Preview" },
  { label: "Sat", value: 66, valueLabel: "Preview" },
  { label: "Sun", value: 58, valueLabel: "Preview" },
];

const plannedAlerts = [
  {
    helper: "Order queue",
    title: "Confirmation analytics not connected",
  },
  {
    helper: "Finance",
    title: "Settlement mismatch analytics not connected",
  },
  {
    helper: "Inventory",
    title: "Stock threshold analytics not connected",
  },
];

const catalogRows = [
  {
    brand: "Pending",
    price: "Not connected",
    product: "Product analytics row",
    status: "Preview",
    stock: "Pending",
  },
  {
    brand: "Pending",
    price: "Not connected",
    product: "Catalog performance row",
    status: "Preview",
    stock: "Pending",
  },
  {
    brand: "Pending",
    price: "Not connected",
    product: "Merchandising insight row",
    status: "Preview",
    stock: "Pending",
  },
];

export default function BusinessAnalyticsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminChartCard
            actions={<AdminBadge tone="default">Preview pulse</AdminBadge>}
            bars={previewBars}
            label="Sales Trend"
            title="Weekly Revenue Overview"
          />

          <AdminSectionCard
            actions={<AdminBadge tone="default">Not Connected</AdminBadge>}
            subtitle="Smart Alerts"
            title="Priority Today"
          >
            <div className="mt-5 space-y-3 text-sm">
              {plannedAlerts.map((alert) => (
                <div
                  className="rounded-2xl bg-stone-50 p-4 text-slate-700"
                  key={alert.helper}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-amber-600">!</span>
                    <div>
                      <div className="font-bold text-slate-900">
                        {alert.title}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {alert.helper}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminSectionCard>
        </section>

        <AdminTableShell
          actions={
            <>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                disabled
                type="button"
              >
                Filter
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400"
                disabled
                type="button"
              >
                Export
              </button>
            </>
          }
          badge="Catalog"
          label="Product Management"
          title="Product Catalog"
        >
          <AdminTable>
            <AdminTableHead>
              <tr>
                {["Product", "Brand", "Price", "Stock", "Status", "Action"].map(
                  (heading) => (
                    <th className="px-5 py-4 font-medium" key={heading}>
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </AdminTableHead>
            <tbody>
              {catalogRows.map((row) => (
                <AdminTableRow key={row.product}>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      {row.product}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      Preview layout only
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{row.brand}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">
                    {row.price}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{row.stock}</td>
                  <td className="px-5 py-4">
                    <AdminBadge tone="default">{row.status}</AdminBadge>
                  </td>
                  <td className="px-5 py-4">
                    <AdminActionButtons
                      actions={[
                        { disabled: true, label: "Edit" },
                        { disabled: true, label: "View" },
                      ]}
                    />
                  </td>
                </AdminTableRow>
              ))}
            </tbody>
          </AdminTable>
        </AdminTableShell>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-sm font-bold text-amber-800">
            Planned Analytics Module
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-700">
            This page now matches the Canvas analytics layout, but revenue,
            alert, and catalog analytics are still not connected. Real analytics
            should be wired later from approved live reporting sources.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
