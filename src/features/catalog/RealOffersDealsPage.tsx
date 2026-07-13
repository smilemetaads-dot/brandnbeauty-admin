"use client";

import { useEffect, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type OfferPreview = {
  apiStatus: "active" | "inactive" | "draft" | "expired";
  badge: string;
  channel: string;
  conflict: "Safe" | "Watch" | "Conflict";
  conversion: string;
  discount: string;
  discountCost: string;
  end: string;
  id: string;
  margin: string;
  netProfit: string;
  orders: string;
  products: string[];
  revenue: string;
  start: string;
  status: "Live" | "Scheduled" | "Ending Soon" | "Draft";
  stock: "Safe" | "Watch" | "Fast Moving";
  title: string;
  type: string;
  visibility: string;
};

type OfferDraft = {
  discount_label: string;
  ends_at: string;
  id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  starts_at: string;
  status: "active" | "inactive" | "draft" | "expired";
  subtitle: string;
  title: string;
};

const GET_OFFERS_ENDPOINT = bnbApiUrl("get_offers.php?include_inactive=1");
const MANAGE_OFFERS_ENDPOINT = bnbApiUrl("manage_offers.php");

const fallbackOffers: OfferPreview[] = [
  {
    apiStatus: "draft",
    badge: "CMS",
    channel: "Website",
    conflict: "Safe",
    conversion: "Coming later",
    discount: "Not set",
    discountCost: "Coming later",
    end: "Open",
    id: "cms-offer-placeholder",
    margin: "Coming later",
    netProfit: "Coming later",
    orders: "Coming later",
    products: ["Connect to CMS to load offer rows"],
    revenue: "Coming later",
    start: "Now",
    status: "Draft",
    stock: "Safe",
    title: "Offer CMS unavailable",
    type: "Offer row",
    visibility: "Hidden",
  },
];

const emptyDraft: OfferDraft = {
  discount_label: "Limited Offer",
  ends_at: "",
  id: "",
  image_url: "",
  link_url: "/products",
  sort_order: 1,
  starts_at: "",
  status: "inactive",
  subtitle: "",
  title: "",
};

const safetyRows = [
  ["Stock", true],
  ["Margin", true],
  ["Conflict", false],
  ["Dates", true],
  ["Visibility", true],
  ["Messenger", false],
] as const;

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const toneClassName: Record<BadgeTone, string> = {
    bad: "bg-rose-50 text-rose-700 ring-rose-100",
    brand: "bg-[#5E7F85]/10 text-[#4f747a] ring-[#5E7F85]/15",
    default: "bg-slate-100 text-slate-600 ring-slate-200",
    good: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warn: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClassName[tone]}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  className = "",
  title = "This control is coming later",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      aria-label={title}
      className={`cursor-not-allowed disabled:opacity-100 ${className}`}
      disabled
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({
  active = false,
  item,
}: {
  active?: boolean;
  item: [string, string, string];
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-5 shadow-sm transition ${
        active
          ? "border-[#5E7F85]/20 bg-[#5E7F85]/10"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{item[0]}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {item[1]}
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500">
            {item[2]}
          </div>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#5E7F85] shadow-sm">
          %
        </span>
      </div>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </thead>
  );
}

function statusToDisplay(status: OfferDraft["status"]): OfferPreview["status"] {
  if (status === "active") return "Live";
  if (status === "expired") return "Ending Soon";
  if (status === "draft") return "Draft";
  return "Draft";
}

function formatDateLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
}

function normalizeOfferDraft(raw: unknown, index = 0): OfferDraft | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Partial<OfferDraft> & {
    discount?: string;
    discount_label?: string;
    link?: string;
  };
  const title = typeof record.title === "string" ? record.title.trim() : "";

  if (!title) return null;

  return {
    discount_label:
      typeof record.discount_label === "string" && record.discount_label.trim()
        ? record.discount_label.trim()
        : typeof record.discount === "string"
          ? record.discount.trim()
          : "",
    ends_at: typeof record.ends_at === "string" ? record.ends_at : "",
    id: typeof record.id === "string" || typeof record.id === "number" ? String(record.id) : "",
    image_url: typeof record.image_url === "string" ? record.image_url : "",
    link_url:
      typeof record.link_url === "string" && record.link_url.trim()
        ? record.link_url.trim()
        : typeof record.link === "string" && record.link.trim()
          ? record.link.trim()
          : "/products",
    sort_order: Number(record.sort_order) || index + 1,
    starts_at: typeof record.starts_at === "string" ? record.starts_at : "",
    status:
      record.status === "inactive" ||
      record.status === "draft" ||
      record.status === "expired"
        ? record.status
        : "active",
    subtitle: typeof record.subtitle === "string" ? record.subtitle : "",
    title,
  };
}

function offerPreviewFromDraft(draft: OfferDraft, index = 0): OfferPreview {
  return {
    apiStatus: draft.status,
    badge: draft.discount_label || "Offer",
    channel: "Website",
    conflict: "Safe",
    conversion: "Preview",
    discount: draft.discount_label || "Special Deal",
    discountCost: "Preview",
    end: formatDateLabel(draft.ends_at, "Open"),
    id: draft.id || `offer-${index + 1}`,
    margin: "Preview",
    netProfit: "Preview",
    orders: "Preview",
    products: [draft.subtitle || "Homepage offer card"],
    revenue: "Preview",
    start: formatDateLabel(draft.starts_at, "Now"),
    status: statusToDisplay(draft.status),
    stock: "Safe",
    title: draft.title,
    type: draft.discount_label || "Offer",
    visibility: draft.status === "active" ? "Homepage" : "Hidden",
  };
}

function draftFromPreview(offer: OfferPreview): OfferDraft {
  return {
    discount_label: offer.discount,
    ends_at: offer.end === "Open" ? "" : offer.end,
    id: offer.id,
    image_url: "",
    link_url: "/products",
    sort_order: 1,
    starts_at: offer.start === "Now" ? "" : offer.start,
    status: offer.apiStatus,
    subtitle: offer.products[0] || "",
    title: offer.title,
  };
}

export function RealOffersDealsPage() {
  const [offers, setOffers] = useState<OfferPreview[]>(fallbackOffers);
  const [selectedOfferId, setSelectedOfferId] = useState(fallbackOffers[0]?.id || "");
  const [draft, setDraft] = useState<OfferDraft>(emptyDraft);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(GET_OFFERS_ENDPOINT, {
      cache: "no-store",
      headers: adminAuthHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          offers?: unknown[];
          success?: boolean;
        };

        if (!response.ok || payload.success === false || !Array.isArray(payload.offers)) {
          return fallbackOffers;
        }

        const liveOffers = payload.offers
          .map(normalizeOfferDraft)
          .filter((item): item is OfferDraft => Boolean(item))
          .map(offerPreviewFromDraft);

        return liveOffers.length ? liveOffers : fallbackOffers;
      })
      .then((items) => {
        setOffers(items);
        setSelectedOfferId((current) => current || items[0]?.id || "");
        setDraft((current) =>
          current.title
            ? current
            : {
                ...emptyDraft,
                sort_order: items.length + 1,
              },
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Offers could not be loaded.", error);
        }
      });

    return () => controller.abort();
  }, []);

  const selectedOffer =
    offers.find((offer) => offer.id === selectedOfferId) || offers[0] || fallbackOffers[0];
  const topOffers = offers.slice(0, 3);
  const activeOfferCount = offers.filter((offer) => offer.apiStatus === "active").length;

  const saveOffer = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(MANAGE_OFFERS_ENDPOINT, {
        body: JSON.stringify({ offer: draft }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        offer?: unknown;
        success?: boolean;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Offer could not be saved.");
      }

      const savedDraft = normalizeOfferDraft(payload.offer);
      if (savedDraft) {
        const preview = offerPreviewFromDraft(savedDraft);
        setOffers((current) => {
          const exists = current.some((offer) => offer.id === preview.id);
          return exists
            ? current.map((offer) => (offer.id === preview.id ? preview : offer))
            : [preview, ...current];
        });
        setSelectedOfferId(preview.id);
        setDraft(savedDraft);
      }

      setMessage(payload.message || "Offer saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Offer could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#5E7F85] via-[#6f949a] to-[#d9e5e1] p-6 text-white">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15" />
            <div className="absolute bottom-0 left-1/2 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                  Catalog Promotions
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Offers & Deals Control Room
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
                  Create and edit homepage offer cards through the live local
                  offers table. Active offers appear on the homepage during
                  their start/end date window in sort order.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <DisabledButton className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
                  Preview coming later
                </DisabledButton>
                <button
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSaving}
                  onClick={saveOffer}
                  type="button"
                >
                  Create Offer
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-white/20 bg-stone-50/80 p-4 text-sm md:grid-cols-5">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Offer revenue: <b className="text-[#5E7F85]">Coming later</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Net profit: <b className="text-emerald-700">Coming later</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Discount cost: <b className="text-amber-700">Coming later</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Date view: <b className="text-slate-900">Content dates</b>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">
              Conflict: <b className="text-rose-700">Coming later</b>
            </div>
          </div>
        </section>

        <section className="overflow-visible rounded-[1.7rem] border border-[#5E7F85]/15 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">
                Campaign Period Filter
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                Performance numbers are coming later until offer analytics are
                connected.
              </div>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">
                {["Today", "7D", "30D", "This Month"].map((item) => (
                  <DisabledButton
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      item === "30D"
                        ? "bg-[#5E7F85] text-white"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                    key={item}
                  >
                    {item}
                  </DisabledButton>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <DisabledButton className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  May 01, 2026
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  May 31, 2026
                </DisabledButton>
                <DisabledButton className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">
                  Apply coming later
                </DisabledButton>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard active item={["Active Offers", String(activeOfferCount), "Live on storefront"]} />
          <StatCard item={["Offer Revenue", "Coming later", "Analytics pending"]} />
          <StatCard item={["Conversion Rate", "Coming later", "Analytics pending"]} />
          <StatCard active item={["Total Offers", String(offers.length), "Database rows"]} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Promotion Engine
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Offer Campaign List
                  </h2>
                  <div className="mt-2 text-sm text-slate-500">
                    Manage offer title, subtitle, optional discount label,
                    image, CTA route, status and date window.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    Bulk schedule coming later
                  </DisabledButton>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isSaving}
                    onClick={saveOffer}
                    type="button"
                  >
                    Create Offer
                  </button>
                </div>
              </div>
              {message ? (
                <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  {message}
                </div>
              ) : null}
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="relative max-w-xl">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none"
                    disabled
                    placeholder="Search offer / type / channel / conflict..."
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    Search
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "All",
                    "Live",
                    "Scheduled",
                    "Ending Soon",
                    "Draft",
                    "Buy 1 Get 1",
                    "Combo Offer",
                    "Clearance Sale",
                    "Conflict",
                    "Hidden",
                  ].map((item) => (
                    <DisabledButton
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        item === "All"
                          ? "bg-[#5E7F85] text-white"
                          : "border border-slate-200 bg-white text-slate-600"
                      }`}
                      key={item}
                    >
                      {item}
                    </DisabledButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1120px] text-left text-sm xl:min-w-full">
                <TableHead>
                  <tr>
                    {[
                      "Offer",
                      "Type",
                      "Revenue",
                      "Profit",
                      "Conv.",
                      "Discount Cost",
                      "Stock",
                      "Conflict",
                      "Status",
                      "Action",
                    ].map((head) => (
                      <th className="px-5 py-4 font-medium" key={head}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </TableHead>
                <tbody>
                  {offers.map((offer) => (
                    <tr
                      className={`border-t border-slate-100 transition ${
                        offer.id === selectedOffer.id
                          ? "bg-[#5E7F85]/[0.06] shadow-[inset_3px_0_0_#5E7F85]"
                          : offer.conflict === "Conflict"
                            ? "bg-rose-50/25"
                            : offer.status === "Ending Soon"
                              ? "bg-amber-50/30"
                              : "bg-white"
                      }`}
                      key={offer.id}
                      onClick={() => setSelectedOfferId(offer.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">
                            %
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {offer.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {offer.badge} / {offer.channel} / {offer.visibility}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="brand">{offer.type}</Badge>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {offer.revenue}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {offer.netProfit}
                      </td>
                      <td className="px-5 py-4 font-semibold">{offer.conversion}</td>
                      <td className="px-5 py-4 font-semibold text-amber-700">
                        {offer.discountCost}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={offer.stock === "Safe" ? "good" : "warn"}>
                          {offer.stock}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            offer.conflict === "Conflict"
                              ? "bad"
                              : offer.conflict === "Watch"
                                ? "warn"
                                : "good"
                          }
                        >
                          {offer.conflict}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            offer.status === "Live"
                              ? "good"
                              : offer.status === "Ending Soon" ||
                                  offer.status === "Scheduled"
                                ? "warn"
                                : "default"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <DisabledButton className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85]">
                            Open coming later
                          </DisabledButton>
                          <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedOfferId(offer.id);
                              setDraft(draftFromPreview(offer));
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Selected Offer
                  </div>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    {selectedOffer.title}
                  </h3>
                  <div className="mt-1 text-xs text-slate-500">
                    {selectedOffer.type} / {selectedOffer.channel}
                  </div>
                </div>
                <Badge tone="good">{selectedOffer.status}</Badge>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-stone-50 p-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E7F85] via-[#789ca2] to-[#d9e5e1] p-5 text-white shadow-sm">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
                  <div className="relative">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                      {selectedOffer.badge}
                    </div>
                    <div className="mt-3 text-2xl font-black tracking-tight">
                      {selectedOffer.title}
                    </div>
                    <div className="mt-2 text-sm font-medium text-white/85">
                      {selectedOffer.discount} / {selectedOffer.start} to{" "}
                      {selectedOffer.end}
                    </div>
                    <DisabledButton className="mt-5 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-900">
                      Shop offer coming later
                    </DisabledButton>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Revenue", selectedOffer.revenue],
                    ["Orders", selectedOffer.orders],
                    ["Net Profit", selectedOffer.netProfit],
                    ["Discount Cost", selectedOffer.discountCost],
                  ].map(([label, value]) => (
                    <div className="rounded-2xl bg-white p-4" key={label}>
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="mt-1 font-bold text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <DisabledButton className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">
                  Edit in form below
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  Duplicate coming later
                </DisabledButton>
                <DisabledButton className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  Pause coming later
                </DisabledButton>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Top Performing Offers
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                30D
              </h3>
              <div className="mt-4 space-y-3">
                {topOffers.map((offer, index) => (
                  <div
                    className={`w-full rounded-2xl px-4 py-3 text-left text-xs ${
                      offer.id === selectedOffer.id
                        ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15"
                        : "bg-stone-50"
                    }`}
                    key={offer.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-800">
                        #{index + 1} {offer.title}
                      </span>
                      <span className="font-black text-[#5E7F85]">
                        {offer.netProfit}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-500">
                      Revenue {offer.revenue} / Orders {offer.orders}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Offer Safety Panel
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Publish Protection
              </h3>
              <div className="mt-4 grid gap-2">
                {safetyRows.map(([label, ok]) => (
                  <div
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold ${
                      ok
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                    key={label}
                  >
                    <span>{label}</span>
                    <span>{ok ? "Safe" : "Review"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-6 shadow-sm">
              <div className="text-sm font-bold text-[#5E7F85]">
                Automation Rule Summary
              </div>
              <div className="mt-4 space-y-3 text-xs font-semibold leading-5 text-slate-700">
                {[
                  "Low-stock auto pause is coming later.",
                  "Expired-offer auto disable is coming later.",
                  "Double-discount conflict blocking is coming later.",
                  "Messenger offer replies are not connected for launch.",
                ].map((item) => (
                  <div className="rounded-2xl bg-white px-4 py-3" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Product Mapping
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Offer Products
              </h3>
              <div className="mt-4 space-y-2">
                {selectedOffer.products.map((item, index) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-xs"
                    key={item}
                  >
                    <span className="font-bold text-slate-700">{item}</span>
                    <span className="rounded-full bg-white px-2 py-1 font-bold text-[#5E7F85]">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Offer Builder
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Create / Edit Offer
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Save homepage offer cards and deal rows directly to the local
                PHP/MySQL offers table. Title, optional subtitle/discount,
                image, link, status, dates and sort order control the homepage
                cards. Blank, #, external and unsafe links fall back to /products.
                Use wide 16:9 images, around 1200 x 675.
              </p>
            </div>
            <Badge tone="good">Live Save</Badge>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Offer title"
              value={draft.title}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
              onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))}
              placeholder="Subtitle"
              value={draft.subtitle}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
              onChange={(event) => setDraft((current) => ({ ...current, discount_label: event.target.value }))}
              placeholder="Discount label"
              value={draft.discount_label}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
              onChange={(event) => setDraft((current) => ({ ...current, link_url: event.target.value }))}
              placeholder="/products"
              value={draft.link_url}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
              onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value }))}
              placeholder="/offer-bogo.jpg"
              value={draft.image_url}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
              onChange={(event) => setDraft((current) => ({ ...current, starts_at: event.target.value }))}
              type="date"
              value={draft.starts_at ? draft.starts_at.slice(0, 10) : ""}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
              onChange={(event) => setDraft((current) => ({ ...current, ends_at: event.target.value }))}
              type="date"
              value={draft.ends_at ? draft.ends_at.slice(0, 10) : ""}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                onChange={(event) => setDraft((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
                type="number"
                value={draft.sort_order}
              />
              <select
                className="rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as OfferDraft["status"],
                  }))
                }
                value={draft.status}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isSaving}
              onClick={saveOffer}
              type="button"
            >
              {isSaving ? "Saving..." : "Save Offer"}
            </button>
            <button
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              onClick={() =>
                setDraft({
                  ...emptyDraft,
                  sort_order: offers.length + 1,
                })
              }
              type="button"
            >
              New Draft
            </button>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
