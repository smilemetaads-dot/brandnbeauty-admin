"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

type OfferStatus = "active" | "inactive" | "draft" | "expired";

type OfferRecord = {
  created_at?: string | null;
  destination_link: string;
  end_at: string | null;
  ends_at: string | null;
  id: string;
  image_url: string | null;
  internal_title: string;
  link: string;
  link_url: string;
  mobile_image_url: string | null;
  sort_order: number;
  start_at: string | null;
  starts_at: string | null;
  status: OfferStatus;
  title: string;
  updated_at?: string | null;
};

type OfferForm = {
  destination_link: string;
  end_at: string;
  id: string;
  image_url: string;
  internal_title: string;
  mobile_image_url: string;
  sort_order: number;
  start_at: string;
  status: OfferStatus;
};

type BadgeTone = "good" | "warn" | "bad" | "default" | "brand";
type ArtworkTarget = "image_url" | "mobile_image_url";
type ArtworkMeta = {
  dimensions: string;
  fileSize: string;
  format: string;
  height: number;
  name: string;
  warnings: string[];
  width: number;
};
type UploadFieldState = {
  error: string;
  isUploading: boolean;
  meta: ArtworkMeta | null;
  progress: number;
};

const GET_OFFERS_ENDPOINT = bnbApiUrl("get_offers.php?include_inactive=1");
const MANAGE_OFFERS_ENDPOINT = bnbApiUrl("manage_offers.php");
const UPLOAD_MEDIA_ENDPOINT = bnbApiUrl("upload_media.php");
const MAX_ARTWORK_BYTES = 5 * 1024 * 1024;
const ACCEPTED_ARTWORK_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RECOMMENDED_ARTWORK_BYTES = 400 * 1024;

const emptyForm: OfferForm = {
  destination_link: "/products",
  end_at: "",
  id: "",
  image_url: "",
  internal_title: "",
  mobile_image_url: "",
  sort_order: 1,
  start_at: "",
  status: "inactive",
};

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    bad: "bg-rose-50 text-rose-700 ring-rose-100",
    brand: "bg-[#5E7F85]/10 text-[#4f747a] ring-[#5E7F85]/15",
    default: "bg-slate-100 text-slate-600 ring-slate-200",
    good: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warn: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${tones[tone]}`}>{children}</span>;
}

function normalizeDateInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 16).replace(" ", "T");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Open";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "Open";
  return date.toLocaleString("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

function normalizeOffer(raw: unknown, index = 0): OfferRecord | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Partial<OfferRecord> & {
    end_at?: string | null;
    starts_at?: string | null;
    title?: string;
  };
  const title = String(record.internal_title || record.title || "").trim();
  if (!title) return null;

  const status = ["active", "inactive", "draft", "expired"].includes(String(record.status))
    ? (record.status as OfferStatus)
    : "inactive";
  const link = String(record.destination_link || record.link_url || record.link || "/products").trim() || "/products";

  return {
    created_at: record.created_at ?? null,
    destination_link: link,
    end_at: record.end_at ?? record.ends_at ?? null,
    ends_at: record.ends_at ?? record.end_at ?? null,
    id: String(record.id || `offer-${index + 1}`),
    image_url: typeof record.image_url === "string" && record.image_url ? record.image_url : null,
    internal_title: title,
    link,
    link_url: link,
    mobile_image_url: typeof record.mobile_image_url === "string" && record.mobile_image_url ? record.mobile_image_url : null,
    sort_order: Number(record.sort_order) || index + 1,
    start_at: record.start_at ?? record.starts_at ?? null,
    starts_at: record.starts_at ?? record.start_at ?? null,
    status,
    title,
    updated_at: record.updated_at ?? null,
  };
}

function formFromOffer(offer: OfferRecord): OfferForm {
  return {
    destination_link: offer.destination_link || "/products",
    end_at: normalizeDateInput(offer.end_at),
    id: offer.id,
    image_url: offer.image_url || "",
    internal_title: offer.internal_title,
    mobile_image_url: offer.mobile_image_url || "",
    sort_order: offer.sort_order,
    start_at: normalizeDateInput(offer.start_at),
    status: offer.status,
  };
}

function getScheduleState(offer: OfferRecord) {
  const now = Date.now();
  const start = offer.start_at ? new Date(offer.start_at.replace(" ", "T")).getTime() : null;
  const end = offer.end_at ? new Date(offer.end_at.replace(" ", "T")).getTime() : null;

  if (offer.status !== "active") return { label: "Inactive", tone: "default" as BadgeTone };
  if (start && start > now) return { label: "Scheduled", tone: "warn" as BadgeTone };
  if (end && end < now) return { label: "Expired", tone: "bad" as BadgeTone };
  return { label: "Active", tone: "good" as BadgeTone };
}

function sortedOffers(offers: OfferRecord[]) {
  return [...offers].sort((first, second) => first.sort_order - second.sort_order || Number(first.id) - Number(second.id));
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatFileType(file: File) {
  const fromMime = file.type.split("/")[1]?.replace("jpeg", "jpg") || "";
  const fromName = file.name.split(".").pop() || fromMime || "image";
  return fromName.toUpperCase();
}

function inspectArtworkFile(file: File): Promise<ArtworkMeta> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const warnings: string[] = [];

      if (width !== height) warnings.push("Image is not square.");
      if (width > 2000 || height > 2000) warnings.push("Artwork dimensions are larger than needed for homepage cards.");
      if (file.size > RECOMMENDED_ARTWORK_BYTES) warnings.push("File is above the 400 KB recommended maximum.");
      if (width !== height) warnings.push("Text near edges may crop in square card placement.");

      URL.revokeObjectURL(objectUrl);
      resolve({
        dimensions: `${width} x ${height}`,
        fileSize: formatFileSize(file.size),
        format: formatFileType(file),
        height,
        name: file.name,
        warnings,
        width,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Selected file could not be inspected as an image."));
    };

    image.src = objectUrl;
  });
}

export function RealOffersDealsPage() {
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadState, setUploadState] = useState<Record<ArtworkTarget, UploadFieldState>>({
    image_url: { error: "", isUploading: false, meta: null, progress: 0 },
    mobile_image_url: { error: "", isUploading: false, meta: null, progress: 0 },
  });
  const [dragTarget, setDragTarget] = useState<ArtworkTarget | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const orderedOffers = useMemo(() => sortedOffers(offers), [offers]);
  const isUploading = uploadState.image_url.isUploading || uploadState.mobile_image_url.isUploading;
  const activeVisibleCount = orderedOffers.filter((offer) => getScheduleState(offer).label === "Active" && offer.image_url).slice(0, 4).length;

  const loadOffers = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(GET_OFFERS_ENDPOINT, {
        cache: "no-store",
        headers: adminAuthHeaders(),
        signal,
      });
      const payload = (await response.json()) as { message?: string; offers?: unknown[]; success?: boolean };
      if (!response.ok || payload.success === false || !Array.isArray(payload.offers)) {
        throw new Error(payload.message || "Offers could not be loaded.");
      }
      const nextOffers = payload.offers.map(normalizeOffer).filter((item): item is OfferRecord => Boolean(item));
      setOffers(sortedOffers(nextOffers));
      setForm((current) => (current.id || current.internal_title ? current : { ...emptyForm, sort_order: nextOffers.length + 1 }));
    } catch (loadError) {
      if (!signal?.aborted) {
        setError(loadError instanceof Error ? loadError.message : "Offers could not be loaded.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      void loadOffers(controller.signal);
    });
    return () => controller.abort();
  }, []);

  const updateForm = (updates: Partial<OfferForm>) => setForm((current) => ({ ...current, ...updates }));

  const saveOffer = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(MANAGE_OFFERS_ENDPOINT, {
        body: JSON.stringify({ offer: form }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; offer?: unknown; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Offer could not be saved.");

      const savedOffer = normalizeOffer(payload.offer);
      if (savedOffer) {
        setOffers((current) => sortedOffers(current.some((item) => item.id === savedOffer.id) ? current.map((item) => (item.id === savedOffer.id ? savedOffer : item)) : [...current, savedOffer]));
        setForm(formFromOffer(savedOffer));
      }
      setMessage(payload.message || "Offer saved successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Offer could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadArtworkFile = async (file: File, target: ArtworkTarget) => {
    const label = target === "image_url" ? "Desktop artwork" : "Mobile artwork";

    if (!ACCEPTED_ARTWORK_TYPES.has(file.type)) {
      const message = `${label} must be a JPG, PNG, or WEBP image.`;
      setUploadState((current) => ({ ...current, [target]: { ...current[target], error: message, isUploading: false, progress: 0 } }));
      setError(message);
      return;
    }

    if (file.size <= 0 || file.size > MAX_ARTWORK_BYTES) {
      const message = `${label} must be greater than 0 bytes and no larger than 5MB.`;
      setUploadState((current) => ({ ...current, [target]: { ...current[target], error: message, isUploading: false, progress: 0 } }));
      setError(message);
      return;
    }

    setError("");
    setMessage("");
    setUploadState((current) => ({ ...current, [target]: { ...current[target], error: "", isUploading: true, progress: 0 } }));

    try {
      const meta = await inspectArtworkFile(file);
      setUploadState((current) => ({ ...current, [target]: { ...current[target], meta } }));

      const uploadedUrl = await new Promise<string>((resolve, reject) => {
        const body = new FormData();
        body.append("image", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", UPLOAD_MEDIA_ENDPOINT);

        Object.entries(adminAuthHeaders()).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.upload.onprogress = (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          const progress = Math.max(1, Math.min(99, Math.round((progressEvent.loaded / progressEvent.total) * 100)));
          setUploadState((current) => ({ ...current, [target]: { ...current[target], progress } }));
        };

        xhr.onerror = () => reject(new Error("Image upload failed."));
        xhr.onload = () => {
          let payload: { image_url?: string; message?: string; success?: boolean } = {};
          try {
            payload = JSON.parse(xhr.responseText || "{}") as typeof payload;
          } catch {
            reject(new Error("Image upload returned an invalid response."));
            return;
          }

          if (xhr.status < 200 || xhr.status >= 300 || payload.success === false || !payload.image_url) {
            reject(new Error(payload.message || "Image upload failed."));
            return;
          }

          resolve(payload.image_url);
        };

        xhr.send(body);
      });

      updateForm({ [target]: uploadedUrl });
      setUploadState((current) => ({ ...current, [target]: { ...current[target], error: "", isUploading: false, progress: 100 } }));
      setMessage(`${label} uploaded and linked automatically.`);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Image upload failed.";
      setUploadState((current) => ({ ...current, [target]: { ...current[target], error: message, isUploading: false, progress: 0 } }));
      setError(message);
    }
  };

  const uploadArtwork = async (event: ChangeEvent<HTMLInputElement>, target: ArtworkTarget) => {
    const file = event.target.files?.[0];
    if (file) await uploadArtworkFile(file, target);
    event.target.value = "";
  };

  const handleArtworkDrop = async (event: DragEvent<HTMLLabelElement>, target: ArtworkTarget) => {
    event.preventDefault();
    setDragTarget(null);
    const file = event.dataTransfer.files?.[0];
    if (file) await uploadArtworkFile(file, target);
  };

  const renderArtworkUploader = (target: ArtworkTarget, title: string, helper: string) => {
    const state = uploadState[target];
    const value = form[target];
    const previewUrl = bnbApiAssetUrl(value, "") || "";
    const isDragging = dragTarget === target;

    return (
      <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{helper}</div>
        {target === "image_url" ? (
          <div className="mt-3 rounded-2xl border border-[#5E7F85]/15 bg-white p-3 text-xs text-slate-600">
            <div className="font-bold text-slate-900">Recommended</div>
            <div className="mt-1">1000 x 1000 px</div>
            <div className="mt-3 font-bold text-slate-900">Safe margin</div>
            <div className="mt-1">Keep important text/products 80px away from all edges.</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><span className="font-bold">Preferred:</span> WebP</div>
              <div><span className="font-bold">Maximum:</span> 400 KB recommended</div>
            </div>
          </div>
        ) : null}

        <label
          className={`group relative mt-3 flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition ${
            isDragging
              ? "border-[#5E7F85] bg-[#5E7F85]/10"
              : state.isUploading
                ? "border-[#5E7F85]/50 bg-white"
                : value
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-300 bg-white hover:border-[#5E7F85] hover:bg-[#5E7F85]/5"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragTarget(target);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragTarget((current) => (current === target ? null : current));
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => void handleArtworkDrop(event, target)}
        >
          <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isUploading} onChange={(event) => uploadArtwork(event, target)} type="file" />
          {previewUrl ? <img alt={`${title} preview`} className="absolute inset-0 h-full w-full object-cover" src={previewUrl} /> : null}
          {previewUrl ? <div className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" /> : null}
          <div className={`relative z-10 rounded-2xl px-4 py-3 transition ${previewUrl ? "bg-white/90 shadow-sm" : ""}`}>
            {state.isUploading ? (
              <>
                <div className="text-sm font-black text-[#5E7F85]">Uploading {state.progress}%</div>
                <div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#5E7F85] transition-all duration-150" style={{ width: `${state.progress}%` }} />
                </div>
              </>
            ) : value ? (
              <>
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-lg font-black text-white">✓</div>
                <div className="mt-2 text-sm font-black text-slate-950">Artwork uploaded</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">Drop another file or click to replace</div>
              </>
            ) : (
              <>
                <div className="text-sm font-black text-slate-900">Drag & drop artwork here</div>
                <div className="mt-1 text-sm font-semibold text-[#5E7F85]">or click to browse</div>
              </>
            )}
          </div>
        </label>

        {state.meta ? (
          <div className="mt-3 grid gap-2 rounded-2xl bg-white p-3 text-xs text-slate-600 sm:grid-cols-3">
            <div><span className="font-bold text-slate-900">Dimensions:</span><br />{state.meta.dimensions}</div>
            <div><span className="font-bold text-slate-900">File size:</span><br />{state.meta.fileSize}</div>
            <div><span className="font-bold text-slate-900">Format:</span><br />{state.meta.format}</div>
          </div>
        ) : null}

        {state.meta?.warnings.length ? (
          <div className="mt-3 space-y-2">
            {state.meta.warnings.map((warning) => (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700" key={warning}>Warning: {warning}</div>
            ))}
          </div>
        ) : null}
        {state.error ? <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{state.error}</div> : null}
        {value ? <details className="mt-3 text-xs text-slate-500"><summary className="cursor-pointer font-semibold">Uploaded URL</summary><input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500" readOnly value={value} /></details> : null}
      </div>
    );
  };
  const updateStatus = async (offer: OfferRecord, status: OfferStatus) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(MANAGE_OFFERS_ENDPOINT, {
        body: JSON.stringify({ action: "status", id: offer.id, status }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; offer?: unknown; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Status could not be updated.");
      const savedOffer = normalizeOffer(payload.offer);
      if (savedOffer) setOffers((current) => sortedOffers(current.map((item) => (item.id === savedOffer.id ? savedOffer : item))));
      setMessage(payload.message || "Offer status updated.");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Status could not be updated.");
    }
  };

  const moveOffer = async (offer: OfferRecord, direction: -1 | 1) => {
    const index = orderedOffers.findIndex((item) => item.id === offer.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= orderedOffers.length) return;

    const next = [...orderedOffers];
    [next[index], next[target]] = [next[target], next[index]];
    const normalized = next.map((item, itemIndex) => ({ ...item, sort_order: itemIndex + 1 }));
    setOffers(normalized);

    try {
      const response = await fetch(MANAGE_OFFERS_ENDPOINT, {
        body: JSON.stringify({ action: "reorder", order: normalized.map((item) => item.id) }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Order could not be saved.");
      setMessage(payload.message || "Offer order saved.");
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "Order could not be saved.");
      void loadOffers();
    }
  };

  const deleteOffer = async (offer: OfferRecord) => {
    if (!window.confirm(`Delete "${offer.internal_title}"? The database row will be removed, but shared image files will remain.`)) return;
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${MANAGE_OFFERS_ENDPOINT}?id=${encodeURIComponent(offer.id)}&confirm=delete`, {
        headers: adminAuthHeaders(),
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Offer could not be deleted.");
      setOffers((current) => sortedOffers(current.filter((item) => item.id !== offer.id).map((item, index) => ({ ...item, sort_order: index + 1 }))));
      if (form.id === offer.id) setForm({ ...emptyForm, sort_order: Math.max(1, offers.length) });
      setMessage(payload.message || "Offer deleted successfully.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Offer could not be deleted.");
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#5E7F85]">Homepage CMS</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Special Offers</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage square promotional artwork for the homepage Special Offers row. Up to four active, currently scheduled offers with desktop artwork appear publicly in sort order.
              </p>
            </div>
            <button
              className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#4f747a]"
              onClick={() => setForm({ ...emptyForm, sort_order: offers.length + 1 })}
              type="button"
            >
              Add Offer
            </button>
          </div>
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-stone-50 p-4"><b>{offers.length}</b><span className="ml-2 text-slate-500">total records</span></div>
            <div className="rounded-2xl bg-stone-50 p-4"><b>{activeVisibleCount}</b><span className="ml-2 text-slate-500">visible now</span></div>
            <div className="rounded-2xl bg-stone-50 p-4"><b>4</b><span className="ml-2 text-slate-500">homepage limit</span></div>
            <div className="rounded-2xl bg-stone-50 p-4"><b>1000 x 1000</b><span className="ml-2 text-slate-500">recommended</span></div>
          </div>
        </section>

        {message ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Offer Records</h2>
              <p className="mt-1 text-sm text-slate-500">Active means eligible; schedule dates decide whether it is visible now without changing the stored status.</p>
            </div>
            {isLoading ? (
              <div className="p-6 text-sm font-semibold text-slate-500">Loading offers...</div>
            ) : orderedOffers.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-bold text-slate-950">No special offers yet</h3>
                <p className="mt-2 text-sm text-slate-500">Add an offer with square artwork before this homepage section appears publicly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[920px] text-left text-sm xl:min-w-full">
                  <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Artwork</th>
                      <th className="px-5 py-4">Internal Title</th>
                      <th className="px-5 py-4">Link</th>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Schedule</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedOffers.map((offer, index) => {
                      const schedule = getScheduleState(offer);
                      const imageSrc = bnbApiAssetUrl(offer.image_url, null);
                      return (
                        <tr className="border-t border-slate-100 align-middle" key={offer.id}>
                          <td className="px-5 py-4">
                            <button className="block overflow-hidden rounded-2xl border border-slate-200 bg-stone-50" onClick={() => setForm(formFromOffer(offer))} type="button">
                              {imageSrc ? <img alt={offer.internal_title} className="h-16 w-16 object-cover" src={imageSrc} /> : <span className="flex h-16 w-16 items-center justify-center text-[10px] font-bold text-slate-400">No image</span>}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-950">{offer.internal_title}</div>
                            <div className="mt-1 text-xs text-slate-500">ID {offer.id}</div>
                          </td>
                          <td className="max-w-[220px] truncate px-5 py-4 text-slate-600">{offer.destination_link}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{offer.sort_order}</span>
                              <button className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40" disabled={index === 0} onClick={() => moveOffer(offer, -1)} type="button">Up</button>
                              <button className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40" disabled={index === orderedOffers.length - 1} onClick={() => moveOffer(offer, 1)} type="button">Down</button>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            <div>Start: {formatDate(offer.start_at)}</div>
                            <div className="mt-1">End: {formatDate(offer.end_at)}</div>
                          </td>
                          <td className="px-5 py-4"><Badge tone={schedule.tone}>{schedule.label}</Badge></td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-bold text-[#5E7F85]" onClick={() => setForm(formFromOffer(offer))} type="button">Edit</button>
                              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" onClick={() => updateStatus(offer, offer.status === "active" ? "inactive" : "active")} type="button">{offer.status === "active" ? "Deactivate" : "Activate"}</button>
                              <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => deleteOffer(offer)} type="button">Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:self-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{form.id ? "Edit Offer" : "Add Offer"}</h2>
                <p className="mt-1 text-sm text-slate-500">Artwork contains its own offer title and CTA. The internal title is used for admin and accessibility only.</p>
              </div>
              <Badge tone={form.status === "active" ? "good" : "default"}>{form.status}</Badge>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Internal Title
                <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-[#5E7F85]" onChange={(event) => updateForm({ internal_title: event.target.value })} placeholder="Buy 1 Get 1" value={form.internal_title} />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Destination Link
                <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-[#5E7F85]" onChange={(event) => updateForm({ destination_link: event.target.value })} placeholder="/products" value={form.destination_link} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Sort Order
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-[#5E7F85]" min={0} onChange={(event) => updateForm({ sort_order: Number(event.target.value) || 0 })} type="number" value={form.sort_order} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Status
                  <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-[#5E7F85]" onChange={(event) => updateForm({ status: event.target.value as OfferStatus })} value={form.status}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                    <option value="expired">Expired</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Start Date and Time
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-[#5E7F85]" onChange={(event) => updateForm({ start_at: event.target.value })} type="datetime-local" value={form.start_at} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  End Date and Time
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-[#5E7F85]" onChange={(event) => updateForm({ end_at: event.target.value })} type="datetime-local" value={form.end_at} />
                </label>
              </div>

              {renderArtworkUploader("image_url", "Desktop Artwork", "Required. Choose or drop square promotional artwork.")}

              {renderArtworkUploader("mobile_image_url", "Mobile Artwork", "Optional. Desktop artwork is used when this is blank.")}

              <div className="flex flex-wrap gap-3 pt-1">
                <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isSaving || isUploading} onClick={saveOffer} type="button">
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700" onClick={() => setForm({ ...emptyForm, sort_order: offers.length + 1 })} type="button">Cancel</button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
