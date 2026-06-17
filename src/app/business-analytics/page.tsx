"use client";

import { useEffect, useMemo, useState } from "react";

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
import {
  defaultCmsMeta,
  fetchCmsMeta,
  type CmsMeta,
} from "@/features/cms/cms-meta-client";

const previewBars = [
  { label: "Mon", value: 42, valueLabel: "Preview" },
  { label: "Tue", value: 56, valueLabel: "Preview" },
  { label: "Wed", value: 61, valueLabel: "Preview" },
  { label: "Thu", value: 48, valueLabel: "Preview" },
  { label: "Fri", value: 72, valueLabel: "Preview" },
  { label: "Sat", value: 66, valueLabel: "Preview" },
  { label: "Sun", value: 58, valueLabel: "Preview" },
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
  const [cmsMeta, setCmsMeta] = useState<CmsMeta>(defaultCmsMeta);

  useEffect(() => {
    const controller = new AbortController();

    fetchCmsMeta(controller.signal)
      .then(setCmsMeta)
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("CMS analytics metadata could not be loaded.", error);
        }
      });

    return () => controller.abort();
  }, []);

  const liveBars = useMemo(
    () =>
      previewBars.map((bar, index) => ({
        ...bar,
        value:
          index === previewBars.length - 1
            ? Math.max(8, Math.min(cmsMeta.analytics_summary.direct_sales * 8, 100))
            : bar.value,
        valueLabel:
          index === previewBars.length - 1
            ? `${cmsMeta.analytics_summary.direct_sales} sales`
            : "Live meta",
      })),
    [cmsMeta.analytics_summary.direct_sales],
  );
  const liveAlerts = [
    {
      helper: "Revenue",
      title: `Gross revenue ${new Intl.NumberFormat("en-BD", {
        currency: "BDT",
        maximumFractionDigits: 0,
        style: "currency",
      }).format(cmsMeta.analytics_summary.gross_revenue)}`,
    },
    {
      helper: "Promotions",
      title: `${cmsMeta.analytics_summary.active_promotions} active promotions`,
    },
    {
      helper: "Reviews",
      title: `${cmsMeta.reviews.length} review records available`,
    },
  ];
  const liveCatalogRows = cmsMeta.banners.slice(0, 3).map((banner) => ({
    brand: "CMS",
    price: banner.link,
    product: banner.title,
    status: "Live",
    stock: banner.text || "Banner slot",
  }));

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminChartCard
            actions={<AdminBadge tone="good">Live CMS meta</AdminBadge>}
            bars={liveBars}
            label="Sales Trend"
            title="Weekly Revenue Overview"
          />

          <AdminSectionCard
            actions={<AdminBadge tone="brand">Connected</AdminBadge>}
            subtitle="Smart Alerts"
            title="Priority Today"
          >
            <div className="mt-5 space-y-3 text-sm">
              {liveAlerts.map((alert) => (
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
              {(liveCatalogRows.length ? liveCatalogRows : catalogRows).map(
                (row) => (
                  <AdminTableRow key={row.product}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {row.product}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        CMS metadata row
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{row.brand}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {row.price}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{row.stock}</td>
                    <td className="px-5 py-4">
                      <AdminBadge
                        tone={row.status === "Live" ? "good" : "default"}
                      >
                        {row.status}
                      </AdminBadge>
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
                ),
              )}
            </tbody>
          </AdminTable>
        </AdminTableShell>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-sm font-bold text-amber-800">
            Planned Analytics Module
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-700">
            This page now reads CMS metadata from the local PHP backend. Export
            and filter actions remain disabled until write/report endpoints are added.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
