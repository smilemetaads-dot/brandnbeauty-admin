"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type ConfirmationSettings = {
  thank_you_heading: string;
  thank_you_message: string;
  thank_you_next_steps: string;
  thank_you_payment_note: string;
  invoice_footer_note: string;
};

const defaults: ConfirmationSettings = {
  thank_you_heading: "Order received",
  thank_you_message:
    "Thank you. Your order has been received by BrandnBeauty. Our team may contact you to confirm details, and delivery timing can vary by courier and destination.",
  thank_you_next_steps:
    "Our support team may call to confirm your order and delivery details.\nPlease keep your phone reachable. Courier timing depends on destination, product availability, and delivery partner schedules.",
  thank_you_payment_note: "Cash on Delivery is payable when your order is delivered.",
  invoice_footer_note: "This invoice is generated from live BrandnBeauty order data.",
};

const GET_SETTINGS = bnbApiUrl("get_settings.php");
const UPDATE_SETTINGS = bnbApiUrl("update_settings.php");

function clean(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function RealInvoiceThankYouSettingsPage() {
  const [settings, setSettings] = useState<ConfirmationSettings>(defaults);
  const [draft, setDraft] = useState<ConfirmationSettings>(defaults);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setStatus("loading");
        const response = await fetch(GET_SETTINGS, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as Partial<ConfirmationSettings>;

        if (!response.ok) throw new Error("Settings could not be loaded.");

        const next: ConfirmationSettings = {
          thank_you_heading: clean(payload.thank_you_heading, defaults.thank_you_heading),
          thank_you_message: clean(payload.thank_you_message, defaults.thank_you_message),
          thank_you_next_steps: clean(payload.thank_you_next_steps, defaults.thank_you_next_steps),
          thank_you_payment_note: clean(payload.thank_you_payment_note, defaults.thank_you_payment_note),
          invoice_footer_note: clean(payload.invoice_footer_note, defaults.invoice_footer_note),
        };

        setSettings(next);
        setDraft(next);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Settings could not be loaded.");
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  async function save() {
    setMessage("");
    setStatus("saving");

    try {
      const response = await fetch(UPDATE_SETTINGS, {
        method: "POST",
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ settings: draft }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; message?: string; settings?: Partial<ConfirmationSettings> }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Order confirmation settings could not be saved.");
      }

      const next = { ...draft, ...(payload.settings || {}) };
      setSettings(next);
      setDraft(next);
      setStatus("ready");
      setMessage(payload.message || "Order confirmation settings saved.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Order confirmation settings could not be saved.");
    }
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(draft);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#527B86]">
                Orders · Customer confirmation
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Invoice & Thank You Settings
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Edit the live post-checkout copy and the footer used by the staff print invoice.
                Order data, totals and payment status remain sourced from the canonical order record.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                Live settings
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                Admin-authenticated save
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Admin invoice", "Live", "Print route uses live order data"],
            ["Invoice footer", "Live", "Editable and persisted"],
            ["Thank-you page", "Live", "Reads persisted customer-facing copy"],
            ["Track Order", "Live", "Linked after checkout"],
          ].map(([label, value, helper]) => (
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={label}>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block">
              <span className="text-sm font-black text-slate-800">Thank-you heading</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#527B86]"
                maxLength={120}
                onChange={(e) => setDraft((v) => ({ ...v, thank_you_heading: e.target.value }))}
                value={draft.thank_you_heading}
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-800">Thank-you message</span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#527B86]"
                maxLength={800}
                onChange={(e) => setDraft((v) => ({ ...v, thank_you_message: e.target.value }))}
                value={draft.thank_you_message}
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-800">What happens next</span>
              <textarea
                className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#527B86]"
                maxLength={1200}
                onChange={(e) => setDraft((v) => ({ ...v, thank_you_next_steps: e.target.value }))}
                value={draft.thank_you_next_steps}
              />
              <span className="mt-1 block text-xs font-semibold text-slate-400">
                One line becomes one customer-facing step.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-800">Payment note</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#527B86]"
                maxLength={300}
                onChange={(e) => setDraft((v) => ({ ...v, thank_you_payment_note: e.target.value }))}
                value={draft.thank_you_payment_note}
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-800">Invoice footer note</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#527B86]"
                maxLength={500}
                onChange={(e) => setDraft((v) => ({ ...v, invoice_footer_note: e.target.value }))}
                value={draft.invoice_footer_note}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <button
                className="rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!dirty || status === "saving" || status === "loading"}
                onClick={() => void save()}
                type="button"
              >
                {status === "saving" ? "Saving…" : "Save Live Settings"}
              </button>
              <button
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 disabled:opacity-40"
                disabled={!dirty || status === "saving"}
                onClick={() => setDraft(settings)}
                type="button"
              >
                Reset Draft
              </button>
              {message ? (
                <span className={`text-sm font-bold ${status === "error" ? "text-rose-700" : "text-emerald-700"}`}>
                  {message}
                </span>
              ) : null}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-[#527B86]/20 bg-[#527B86]/5 p-6">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#527B86]">Live boundary</div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                These fields change presentation only. They do not alter orders, totals, payment state,
                courier state, inventory or finance records.
              </p>
            </section>
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Still intentionally separate</h2>
              <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
                <p>Customer PDF download is not claimed. Customers use the confirmation and tracking routes.</p>
                <p>Staff can save the browser print invoice as PDF through the browser print dialog.</p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
