"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";
type ResultStatus = "draft" | "active" | "archived";
type ResultType = "before_after" | "customer_story" | "routine" | "video_review" | "image_review";
type MediaType = "image" | "video";
type StatusFilter = "all" | ResultStatus;
type TypeFilter = "all" | ResultType;

type MediaItem = {
  alt_text: string;
  media_type: MediaType;
  media_url: string;
  sort_order: number;
  thumbnail_url: string;
};

type ResultRow = {
  cover_media_type: MediaType;
  cover_media_url: string;
  customer_label: string;
  customer_name: string;
  deleted_at: string | null;
  featured: boolean;
  id: number;
  media_count: number;
  product_count: number;
  result_type: ResultType;
  short_description: string;
  slug: string;
  sort_order: number;
  status: ResultStatus;
  title: string;
  updated_at: string | null;
};

type ResultForm = {
  cover_media_type: MediaType;
  cover_media_url: string;
  customer_label: string;
  customer_name: string;
  featured: boolean;
  id: string;
  media: MediaItem[];
  product_ids: string[];
  result_type: ResultType;
  seo_description: string;
  seo_title: string;
  short_description: string;
  slug: string;
  sort_order: number;
  status: ResultStatus;
  story: string;
  title: string;
};

type ProductOption = {
  brand_name: string;
  id: string;
  image_url: string | null;
  price: string;
  product_name: string;
  product_type: "single" | "variant";
  sku: string | null;
  slug: string | null;
};

const MANAGE_RESULTS = bnbApiUrl("manage_real_results.php");
const STORE_PRODUCTS = bnbApiUrl("get_store_products.php");
const UPLOAD_MEDIA = bnbApiUrl("upload_media.php");
const MAX_MEDIA = 5;
const ACCEPTED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
const TYPE_OPTIONS: Array<{ label: string; value: ResultType }> = [
  { label: "Before / After", value: "before_after" },
  { label: "Customer Story", value: "customer_story" },
  { label: "Routine", value: "routine" },
  { label: "Video Review", value: "video_review" },
  { label: "Image Review", value: "image_review" },
];

const emptyForm: ResultForm = {
  cover_media_type: "image",
  cover_media_url: "",
  customer_label: "",
  customer_name: "",
  featured: false,
  id: "",
  media: [],
  product_ids: [],
  result_type: "customer_story",
  seo_description: "",
  seo_title: "",
  short_description: "",
  slug: "",
  sort_order: 1,
  status: "draft",
  story: "",
  title: "",
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

function StatCard({ helper, label, value }: { helper: string; label: string; value: string }) {
  return <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-medium text-slate-500">{label}</div><div className="mt-2 text-2xl font-black text-slate-950">{value}</div><div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div></div>;
}

function FieldError({ error }: { error?: string }) {
  return error ? <div className="mt-1 text-xs font-semibold text-rose-600">{error}</div> : null;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function labelType(value: ResultType | TypeFilter) {
  if (value === "all") return "All Types";
  return TYPE_OPTIONS.find((item) => item.value === value)?.label ?? "Customer Story";
}

function statusTone(status: ResultStatus): BadgeTone {
  if (status === "active") return "good";
  if (status === "archived") return "bad";
  return "warn";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not saved";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "Not saved" : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function money(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0 ? `Tk ${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "Price pending";
}
function normalizeStatus(value: unknown): ResultStatus {
  return value === "active" || value === "archived" || value === "draft" ? value : "draft";
}

function normalizeType(value: unknown): ResultType {
  return value === "before_after" || value === "routine" || value === "video_review" || value === "image_review" || value === "customer_story" ? value : "customer_story";
}

function normalizeMediaType(value: unknown): MediaType {
  return value === "video" ? "video" : "image";
}

function normalizeRow(raw: unknown): ResultRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ResultRow> & { id?: string | number };
  const id = Number(row.id ?? 0);
  const title = String(row.title ?? "").trim();
  if (!id || !title) return null;
  return {
    cover_media_type: normalizeMediaType(row.cover_media_type),
    cover_media_url: String(row.cover_media_url ?? ""),
    customer_label: String(row.customer_label ?? ""),
    customer_name: String(row.customer_name ?? ""),
    deleted_at: typeof row.deleted_at === "string" ? row.deleted_at : null,
    featured: Boolean(row.featured),
    id,
    media_count: Number(row.media_count ?? 0) || 0,
    product_count: Number(row.product_count ?? 0) || 0,
    result_type: normalizeType(row.result_type),
    short_description: String(row.short_description ?? ""),
    slug: String(row.slug ?? ""),
    sort_order: Number(row.sort_order ?? 0) || 0,
    status: normalizeStatus(row.status),
    title,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function normalizeMedia(raw: unknown, fallbackSort: number): MediaItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<MediaItem>;
  const mediaUrl = String(row.media_url ?? "").trim();
  if (!mediaUrl) return null;
  return {
    alt_text: String(row.alt_text ?? ""),
    media_type: normalizeMediaType(row.media_type),
    media_url: mediaUrl,
    sort_order: Number(row.sort_order ?? fallbackSort) || fallbackSort,
    thumbnail_url: String(row.thumbnail_url ?? ""),
  };
}

function normalizeForm(raw: unknown, fallbackSort: number): ResultForm {
  if (!raw || typeof raw !== "object") return { ...emptyForm, sort_order: fallbackSort };
  const row = raw as Partial<ResultForm> & { id?: string | number; products?: Array<{ id?: string | number; product_id?: string | number }> };
  return {
    cover_media_type: normalizeMediaType(row.cover_media_type),
    cover_media_url: String(row.cover_media_url ?? ""),
    customer_label: String(row.customer_label ?? ""),
    customer_name: String(row.customer_name ?? ""),
    featured: Boolean(row.featured),
    id: String(row.id ?? ""),
    media: Array.isArray(row.media) ? row.media.map((item, index) => normalizeMedia(item, index + 1)).filter((item): item is MediaItem => Boolean(item)) : [],
    product_ids: Array.isArray(row.product_ids)
      ? row.product_ids.map(String)
      : Array.isArray(row.products)
        ? row.products.map((product) => String(product.product_id ?? product.id)).filter(Boolean)
        : [],
    result_type: normalizeType(row.result_type),
    seo_description: String(row.seo_description ?? ""),
    seo_title: String(row.seo_title ?? ""),
    short_description: String(row.short_description ?? ""),
    slug: String(row.slug ?? ""),
    sort_order: Number(row.sort_order ?? fallbackSort) || fallbackSort,
    status: normalizeStatus(row.status),
    story: String(row.story ?? ""),
    title: String(row.title ?? ""),
  };
}

function normalizeProduct(raw: unknown): ProductOption | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ProductOption> & { id?: string | number };
  const id = String(row.id ?? "").trim();
  const productName = String(row.product_name ?? "").trim();
  if (!id || !productName) return null;
  return {
    brand_name: String(row.brand_name ?? "").trim(),
    id,
    image_url: typeof row.image_url === "string" && row.image_url ? row.image_url : null,
    price: String(row.price ?? "0"),
    product_name: productName,
    product_type: row.product_type === "variant" ? "variant" : "single",
    sku: typeof row.sku === "string" && row.sku ? row.sku : null,
    slug: typeof row.slug === "string" && row.slug ? row.slug : null,
  };
}

function MediaPreview({ media, title }: { media: Pick<MediaItem, "alt_text" | "media_type" | "media_url">; title: string }) {
  const src = bnbApiAssetUrl(media.media_url, "") || "";
  if (!src) return <div className="flex h-full min-h-24 items-center justify-center bg-stone-100 text-xs font-bold text-slate-400">No media</div>;
  if (media.media_type === "video") return <video className="h-full min-h-24 w-full bg-black object-cover" controls muted preload="metadata" src={src} title={title} />;
  return <img alt={media.alt_text || title} className="h-full min-h-24 w-full object-cover" src={src} />;
}

export function RealResultsManagerPanel() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState<ResultForm>(emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const loadResults = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${MANAGE_RESULTS}?include_deleted=1`, { cache: "no-store", headers: adminAuthHeaders(), signal });
      const payload = (await response.json()) as { message?: string; results?: unknown[]; success?: boolean };
      if (!response.ok || payload.success === false || !Array.isArray(payload.results)) throw new Error(payload.message || "Real Results could not be loaded.");
      setResults(payload.results.map(normalizeRow).filter((item): item is ResultRow => Boolean(item)));
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Real Results could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  const loadProducts = async (signal?: AbortSignal) => {
    setIsProductsLoading(true);
    try {
      const response = await fetch(STORE_PRODUCTS, { cache: "no-store", signal });
      const payload = (await response.json()) as { products?: unknown[]; success?: boolean };
      if (!response.ok || payload.success === false || !Array.isArray(payload.products)) throw new Error("Products could not be loaded.");
      setProducts(payload.products.map(normalizeProduct).filter((item): item is ProductOption => Boolean(item)));
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Products could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadResults(controller.signal);
      void loadProducts(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const stats = useMemo(() => ({
    active: results.filter((item) => item.status === "active" && !item.deleted_at).length,
    draft: results.filter((item) => item.status === "draft" && !item.deleted_at).length,
    featured: results.filter((item) => item.featured && item.status === "active" && !item.deleted_at).length,
    total: results.filter((item) => !item.deleted_at).length,
  }), [results]);

  const visibleResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...results].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id).filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.result_type !== typeFilter) return false;
      if (featuredOnly && !item.featured) return false;
      if (query && ![item.title, item.slug, item.customer_name, item.customer_label].some((value) => value.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [featuredOnly, results, search, statusFilter, typeFilter]);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectedProducts = useMemo(() => form.product_ids.map((id) => productById.get(id)).filter((item): item is ProductOption => Boolean(item)), [form.product_ids, productById]);
  const filteredProducts = useMemo(() => {
    const selected = new Set(form.product_ids);
    const available = products.filter((product) => !selected.has(product.id));
    const query = productSearch.trim().toLowerCase();
    if (!query) return available.slice(0, 40);
    return available.filter((product) => [product.product_name, product.brand_name, product.sku ?? "", product.slug ?? ""].some((value) => value.toLowerCase().includes(query))).slice(0, 60);
  }, [form.product_ids, productSearch, products]);

  const updateForm = (updates: Partial<ResultForm>) => {
    setForm((current) => ({ ...current, ...updates }));
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(updates).forEach((key) => delete next[key]);
      return next;
    });
  };

  const updateTitle = (title: string) => {
    setForm((current) => ({ ...current, title, slug: !current.id && !slugEdited ? slugify(title) : current.slug }));
    setFieldErrors((current) => ({ ...current, title: "", slug: "" }));
  };

  const startCreate = () => {
    setForm({ ...emptyForm, sort_order: Math.max(1, results.length + 1) });
    setSlugEdited(false);
    setFieldErrors({});
    setMessage("");
    setError("");
    setProductSearch("");
  };

  const editResult = async (result: ResultRow) => {
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${MANAGE_RESULTS}?action=get&id=${encodeURIComponent(result.id)}`, { cache: "no-store", headers: adminAuthHeaders() });
      const payload = (await response.json()) as { message?: string; result?: unknown; success?: boolean };
      if (!response.ok || payload.success === false || !payload.result) throw new Error(payload.message || "Real Result could not be opened.");
      setForm(normalizeForm(payload.result, results.length + 1));
      setSlugEdited(true);
      setProductSearch("");
      setMessage(`Editing ${result.title}.`);
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Real Result could not be opened.");
    }
  };

  const validateForm = (nextStatus = form.status) => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Title is required.";
    if (!form.slug.trim()) errors.slug = "Slug is required.";
    if (form.media.length > MAX_MEDIA) errors.media = "Use at most 5 media items.";
    if (new Set(form.product_ids).size !== form.product_ids.length) errors.products = "Duplicate products are not allowed.";
    form.media.forEach((item, index) => {
      if (!item.media_url.trim()) errors[`media-${index}`] = "Media URL is required.";
      if (item.media_type !== "image" && item.media_type !== "video") errors[`media-${index}`] = "Media type must be image or video.";
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0 ? nextStatus : null;
  };

  const saveResult = async (statusOverride?: ResultStatus) => {
    const nextStatus = validateForm(statusOverride ?? form.status);
    if (!nextStatus) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...form, status: nextStatus, product_ids: form.product_ids.map(Number), media: form.media.map((item, index) => ({ ...item, sort_order: index + 1 })) };
      const response = await fetch(MANAGE_RESULTS, { body: JSON.stringify(payload), headers: adminAuthHeaders({ "Content-Type": "application/json" }), method: "POST" });
      const body = (await response.json()) as { errors?: string[]; message?: string; result?: unknown; success?: boolean };
      if (!response.ok || body.success === false) {
        const detail = Array.isArray(body.errors) && body.errors.length ? ` ${body.errors.join(" ")}` : "";
        throw new Error((body.message || "Real Result could not be saved.") + detail);
      }
      setForm(normalizeForm(body.result, form.sort_order));
      setSlugEdited(true);
      setMessage(body.message || "Real Result saved.");
      await loadResults();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Real Result could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const postAction = async (body: Record<string, unknown>, fallback: string) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(MANAGE_RESULTS, { body: JSON.stringify(body), headers: adminAuthHeaders({ "Content-Type": "application/json" }), method: "POST" });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || fallback);
      setMessage(payload.message || fallback);
      await loadResults();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : fallback);
    }
  };

  const archiveResult = async (result: ResultRow) => {
    if (window.confirm(`Archive "${result.title}"? It will stop appearing publicly.`)) await postAction({ action: "archive", id: result.id }, "Real Result archived.");
  };

  const restoreResult = async (result: ResultRow) => {
    await postAction({ action: "restore", id: result.id }, "Real Result restored as draft.");
  };
  const addMediaSlot = () => {
    if (form.media.length >= MAX_MEDIA) {
      setFieldErrors((current) => ({ ...current, media: "A Real Result can include up to 5 media items." }));
      return;
    }
    updateForm({ media: [...form.media, { alt_text: "", media_type: "image", media_url: "", sort_order: form.media.length + 1, thumbnail_url: "" }] });
  };

  const updateMedia = (index: number, updates: Partial<MediaItem>) => updateForm({ media: form.media.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item) });
  const removeMedia = (index: number) => updateForm({ media: form.media.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, sort_order: itemIndex + 1 })) });
  const moveMedia = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.media.length) return;
    const next = [...form.media];
    [next[index], next[target]] = [next[target], next[index]];
    updateForm({ media: next.map((item, itemIndex) => ({ ...item, sort_order: itemIndex + 1 })) });
  };

  const uploadMedia = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_MEDIA.has(file.type)) {
      setError("Media must be JPG, PNG, WEBP, MP4, or WEBM.");
      return;
    }
    const isVideo = file.type.startsWith("video/");
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes) {
      setError(isVideo ? "Video must be no larger than 50MB." : "Image must be no larger than 5MB.");
      return;
    }
    setUploadIndex(index);
    setUploadProgress(0);
    setError("");
    try {
      const uploaded = await new Promise<{ media_type: MediaType; media_url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const body = new FormData();
        body.append("image", file);
        body.append("folder", "real-results");
        xhr.open("POST", UPLOAD_MEDIA);
        Object.entries(adminAuthHeaders()).forEach(([key, value]) => xhr.setRequestHeader(key, value));
        xhr.upload.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        };
        xhr.onerror = () => reject(new Error("Media upload failed."));
        xhr.onload = () => {
          let payload: { image_url?: string; media_type?: string; media_url?: string; message?: string; success?: boolean } = {};
          try { payload = JSON.parse(xhr.responseText || "{}"); } catch { reject(new Error("Media upload returned an invalid response.")); return; }
          if (xhr.status < 200 || xhr.status >= 300 || payload.success === false || !(payload.media_url || payload.image_url)) {
            reject(new Error(payload.message || "Media upload failed."));
            return;
          }
          resolve({ media_type: payload.media_type === "video" ? "video" : "image", media_url: payload.media_url || payload.image_url || "" });
        };
        xhr.send(body);
      });
      const media = form.media.map((item, itemIndex) => itemIndex === index ? { ...item, media_type: uploaded.media_type, media_url: uploaded.media_url } : item);
      updateForm({ cover_media_type: form.cover_media_url ? form.cover_media_type : uploaded.media_type, cover_media_url: form.cover_media_url || uploaded.media_url, media });
      setMessage("Media uploaded and linked.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Media upload failed.");
    } finally {
      setUploadIndex(null);
      setUploadProgress(0);
    }
  };

  const addProduct = (product: ProductOption) => {
    if (form.product_ids.includes(product.id)) {
      setFieldErrors((current) => ({ ...current, products: "Duplicate products are not allowed." }));
      return;
    }
    updateForm({ product_ids: [...form.product_ids, product.id] });
  };
  const removeProduct = (id: string) => updateForm({ product_ids: form.product_ids.filter((item) => item !== id) });
  const moveProduct = (id: string, direction: -1 | 1) => {
    const index = form.product_ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= form.product_ids.length) return;
    const next = [...form.product_ids];
    [next[index], next[target]] = [next[target], next[index]];
    updateForm({ product_ids: next });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard helper="Non-deleted records" label="Total" value={String(stats.total)} />
        <StatCard helper="Public eligible" label="Active" value={String(stats.active)} />
        <StatCard helper="Work in progress" label="Draft" value={String(stats.draft)} />
        <StatCard helper="Active homepage candidates" label="Featured" value={String(stats.featured)} />
      </div>
      {message ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.08fr)]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 className="text-lg font-black text-slate-950">Real Results</h2><p className="mt-1 text-sm text-slate-500">Manage curated customer stories with ordered media galleries.</p></div>
              <div className="flex flex-wrap gap-2"><button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700" onClick={() => void loadResults()} type="button">Refresh</button><button className="rounded-xl bg-[#5E7F85] px-4 py-2 text-xs font-bold text-white" onClick={startCreate} type="button">Add New Result</button></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, slug, customer" value={search} />
              <div className="grid grid-cols-2 gap-2">
                <select className="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none" onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}><option value="all">All Statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select>
                <select className="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none" onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} value={typeFilter}><option value="all">All Types</option>{TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><input checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} type="checkbox" /> Featured only</label>
          </div>
          {isLoading ? <div className="p-6 text-sm font-semibold text-slate-500">Loading Real Results...</div> : visibleResults.length === 0 ? <div className="p-6"><h3 className="text-lg font-bold text-slate-950">No Real Results found</h3><p className="mt-2 text-sm text-slate-500">Create a draft story, upload media, then activate it when approved.</p><button className="mt-4 rounded-xl bg-[#5E7F85] px-4 py-2 text-sm font-bold text-white" onClick={startCreate} type="button">Add First Result</button></div> : <div className="divide-y divide-slate-100">{visibleResults.map((result) => <article className="grid gap-4 p-5 lg:grid-cols-[88px_minmax(0,1fr)]" key={result.id}><button className="overflow-hidden rounded-2xl border border-slate-100 bg-stone-100" onClick={() => void editResult(result)} type="button">{result.cover_media_url ? <MediaPreview media={{ alt_text: result.title, media_type: result.cover_media_type, media_url: result.cover_media_url }} title={result.title} /> : <div className="flex h-24 items-center justify-center text-xs font-black text-slate-400">RR</div>}</button><div className="min-w-0 space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><button className="min-w-0 text-left" onClick={() => void editResult(result)} type="button"><h3 className="truncate text-sm font-black text-slate-950">{result.title}</h3><div className="mt-1 text-xs font-semibold text-slate-500">/{result.slug}</div></button><div className="flex flex-wrap gap-2"><Badge tone={statusTone(result.status)}>{result.status}</Badge>{result.featured ? <Badge tone="brand">Featured</Badge> : null}</div></div><div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500"><span>{labelType(result.result_type)}</span><span>{result.media_count} media</span><span>{result.product_count} products</span><span>Sort {result.sort_order}</span><span>Updated {formatDate(result.updated_at)}</span></div><div className="flex flex-wrap gap-2"><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" onClick={() => void editResult(result)} type="button">Edit</button>{result.status === "archived" || result.deleted_at ? <button className="rounded-xl bg-[#5E7F85] px-3 py-2 text-xs font-bold text-white" onClick={() => void restoreResult(result)} type="button">Restore</button> : <button className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700" onClick={() => void archiveResult(result)} type="button">Archive</button>}</div></div></article>)}</div>}
        </div>
        <form className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); void saveResult(); }}>
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="text-lg font-black text-slate-950">{form.id ? "Edit Real Result" : "Add New Result"}</h2><p className="mt-1 text-sm text-slate-500">Save a curated story with up to 5 media items and optional product links.</p></div>
            {form.id ? <Badge tone="brand">ID {form.id}</Badge> : <Badge tone="warn">Draft first</Badge>}
          </div>
          <section className="space-y-4">
            <div><h3 className="text-sm font-black text-slate-950">Basic Information</h3><p className="mt-1 text-xs font-semibold text-slate-500">Use neutral, approved story text only.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="text-sm font-bold text-slate-900">Title</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" maxLength={180} onChange={(event) => updateTitle(event.target.value)} value={form.title} /><FieldError error={fieldErrors.title} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-900">Slug</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" maxLength={200} onChange={(event) => { setSlugEdited(true); updateForm({ slug: slugify(event.target.value) }); }} value={form.slug} /><FieldError error={fieldErrors.slug} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-900">Customer Name</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" maxLength={120} onChange={(event) => updateForm({ customer_name: event.target.value })} value={form.customer_name} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-900">Customer Label</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" maxLength={120} onChange={(event) => updateForm({ customer_label: event.target.value })} value={form.customer_label} /></label>
            </div>
            <label className="block"><span className="text-sm font-bold text-slate-900">Short Description</span><textarea className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateForm({ short_description: event.target.value })} value={form.short_description} /></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Full Story</span><textarea className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateForm({ story: event.target.value })} value={form.story} /></label>
          </section>
          <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-black text-slate-950">Media Gallery</h3><p className="mt-1 text-xs font-semibold text-slate-500">Upload images or short videos. Maximum 5.</p></div><button className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" disabled={form.media.length >= MAX_MEDIA || uploadIndex !== null} onClick={addMediaSlot} type="button">Add Media</button></div>
            <FieldError error={fieldErrors.media} />
            {form.media.length === 0 ? <div className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-500">No media yet. Add a slot and upload artwork.</div> : <div className="space-y-3">{form.media.map((item, index) => <div className="grid gap-3 rounded-2xl border border-slate-100 p-3 lg:grid-cols-[140px_minmax(0,1fr)]" key={`${item.media_url}-${index}`}><div className="overflow-hidden rounded-2xl border border-slate-100 bg-stone-100"><MediaPreview media={item} title={`Media ${index + 1}`} /></div><div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={item.media_type === "video" ? "brand" : "default"}>{item.media_type}</Badge><div className="flex flex-wrap gap-2"><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40" disabled={index === 0} onClick={() => moveMedia(index, -1)} type="button">Up</button><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40" disabled={index === form.media.length - 1} onClick={() => moveMedia(index, 1)} type="button">Down</button><button className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => removeMedia(index)} type="button">Remove</button></div></div><label className="block rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-4 text-center text-sm font-bold text-slate-600 hover:border-[#5E7F85] hover:bg-[#5E7F85]/5"><input accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="sr-only" disabled={uploadIndex !== null} onChange={(event) => void uploadMedia(event, index)} type="file" />{uploadIndex === index ? `Uploading ${uploadProgress}%` : "Click to upload image/video"}</label><input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" onChange={(event) => updateMedia(index, { media_url: event.target.value })} placeholder="Uploaded media URL" value={item.media_url} /><FieldError error={fieldErrors[`media-${index}`]} /><div className="grid gap-3 md:grid-cols-2"><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" onChange={(event) => updateMedia(index, { alt_text: event.target.value })} placeholder="Alt text" value={item.alt_text} /><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" onChange={(event) => updateMedia(index, { thumbnail_url: event.target.value })} placeholder="Video thumbnail URL optional" value={item.thumbnail_url} /></div></div></div>)}</div>}
          </section>
          <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div><h3 className="text-sm font-black text-slate-950">Related Products</h3><p className="mt-1 text-xs font-semibold text-slate-500">Selected products keep the order shown here.</p></div><FieldError error={fieldErrors.products} />
            {selectedProducts.length === 0 ? <div className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-slate-500">No products selected.</div> : <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">{selectedProducts.map((product, index) => <div className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={product.id}><div className="flex min-w-0 items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-xl bg-stone-100">{product.image_url ? <img alt={product.product_name} className="h-full w-full object-cover" src={bnbApiAssetUrl(product.image_url, "") ?? ""} /> : null}</div><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-950">{product.product_name}</div><div className="text-xs font-semibold text-slate-500">{money(product.price)} - {product.brand_name || "No brand"}</div></div></div><div className="flex flex-wrap gap-2"><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40" disabled={index === 0} onClick={() => moveProduct(product.id, -1)} type="button">Up</button><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40" disabled={index === selectedProducts.length - 1} onClick={() => moveProduct(product.id, 1)} type="button">Down</button><button className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => removeProduct(product.id)} type="button">Remove</button></div></div>)}</div>}
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products by name, SKU, brand, or slug" value={productSearch} />
            {isProductsLoading ? <div className="text-sm font-semibold text-slate-500">Loading products...</div> : filteredProducts.length === 0 ? <div className="text-sm font-semibold text-slate-500">No matching active products.</div> : <div className="max-h-72 divide-y divide-slate-100 overflow-auto rounded-2xl border border-slate-100">{filteredProducts.map((product) => <div className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={product.id}><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-950">{product.product_name}</div><div className="text-xs font-semibold text-slate-500">{money(product.price)} - {product.brand_name || "No brand"} - {product.product_type}</div></div><button className="rounded-xl bg-[#5E7F85] px-4 py-2 text-xs font-bold text-white" onClick={() => addProduct(product)} type="button">Add</button></div>)}</div>}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="text-sm font-bold text-slate-900">Result Type</span><select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" onChange={(event) => updateForm({ result_type: event.target.value as ResultType })} value={form.result_type}>{TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Status</span><select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" onChange={(event) => updateForm({ status: event.target.value as ResultStatus })} value={form.status}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
            <label className="block"><span className="text-sm font-bold text-slate-900">Sort Order</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" min={0} onChange={(event) => updateForm({ sort_order: Number(event.target.value) || 0 })} type="number" value={form.sort_order} /></label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><input checked={form.featured} onChange={(event) => updateForm({ featured: event.target.checked })} type="checkbox" /> Featured on homepage later</label>
          </section>
          <section className="space-y-4"><div><h3 className="text-sm font-black text-slate-950">SEO</h3><p className="mt-1 text-xs font-semibold text-slate-500">Optional metadata for future story pages.</p></div><div className="grid gap-4 md:grid-cols-2"><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" maxLength={255} onChange={(event) => updateForm({ seo_title: event.target.value })} placeholder="SEO title" value={form.seo_title} /><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" maxLength={500} onChange={(event) => updateForm({ seo_description: event.target.value })} placeholder="SEO description" value={form.seo_description} /></div></section>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700" onClick={startCreate} type="button">Reset</button><button className="rounded-2xl border border-[#5E7F85]/30 bg-white px-5 py-3 text-sm font-bold text-[#4f747a] disabled:opacity-50" disabled={isSaving || uploadIndex !== null} onClick={() => void saveResult("draft")} type="button">Save Draft</button><button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={isSaving || uploadIndex !== null} onClick={() => void saveResult("active")} type="button">Save & Activate</button><button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={isSaving || uploadIndex !== null} type="submit">{form.id ? "Update" : "Save"}</button></div>
        </form>
      </section>
    </div>
  );
}
