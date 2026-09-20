"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

type CollectionStatus = "active" | "inactive" | "draft" | "deleted";
type EditableStatus = Exclude<CollectionStatus, "deleted">;
type StatusFilter = "all" | CollectionStatus;
type BadgeTone = "good" | "warn" | "bad" | "default" | "brand";
type UploadTarget = "desktop_image_url" | "mobile_image_url";

type CollectionSummary = {
  eyebrow_label: string;
  id: string;
  product_count: number;
  slug: string;
  sort_order: number;
  status: CollectionStatus;
  title: string;
  updated_at: string | null;
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

type CollectionForm = {
  description: string;
  desktop_image_url: string;
  eyebrow_label: string;
  id: string;
  mobile_image_url: string;
  product_ids: string[];
  seo_description: string;
  seo_title: string;
  slug: string;
  sort_order: number;
  status: EditableStatus;
  title: string;
};

type FieldErrors = Partial<Record<keyof CollectionForm | "products", string>>;

const MANAGE_COLLECTIONS_ENDPOINT = bnbApiUrl("manage_collections.php");
const STORE_PRODUCTS_ENDPOINT = bnbApiUrl("get_store_products.php");
const UPLOAD_MEDIA_ENDPOINT = bnbApiUrl("upload_media.php");
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyForm: CollectionForm = {
  description: "",
  desktop_image_url: "",
  eyebrow_label: "",
  id: "",
  mobile_image_url: "",
  product_ids: [],
  seo_description: "",
  seo_title: "",
  slug: "",
  sort_order: 1,
  status: "draft",
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

function statusTone(status: CollectionStatus): BadgeTone {
  if (status === "active") return "good";
  if (status === "draft") return "warn";
  if (status === "deleted") return "bad";
  return "default";
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not saved";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "Not saved";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function money(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number <= 0) return "Price pending";
  return `Tk ${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function normalizeStatus(value: unknown): CollectionStatus {
  return value === "active" || value === "inactive" || value === "draft" || value === "deleted" ? value : "draft";
}

function normalizeCollection(raw: unknown): CollectionSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CollectionSummary>;
  const id = String(row.id ?? "").trim();
  const title = String(row.title ?? "").trim();
  if (!id || !title) return null;

  return {
    eyebrow_label: String(row.eyebrow_label ?? "").trim(),
    id,
    product_count: Number(row.product_count ?? 0) || 0,
    slug: String(row.slug ?? "").trim(),
    sort_order: Number(row.sort_order ?? 0) || 0,
    status: normalizeStatus(row.status),
    title,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
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

function collectionFormFromDetail(raw: unknown, fallbackSort = 1): CollectionForm {
  if (!raw || typeof raw !== "object") return { ...emptyForm, sort_order: fallbackSort };
  const row = raw as Partial<CollectionForm> & { products?: Array<{ id?: number | string; product_id?: number | string }> };
  const status = normalizeStatus(row.status);

  return {
    description: String(row.description ?? ""),
    desktop_image_url: String(row.desktop_image_url ?? ""),
    eyebrow_label: String(row.eyebrow_label ?? ""),
    id: String(row.id ?? ""),
    mobile_image_url: String(row.mobile_image_url ?? ""),
    product_ids: Array.isArray(row.product_ids)
      ? row.product_ids.map(String)
      : Array.isArray(row.products)
        ? row.products.map((product) => String(product.product_id ?? product.id)).filter(Boolean)
        : [],
    seo_description: String(row.seo_description ?? ""),
    seo_title: String(row.seo_title ?? ""),
    slug: String(row.slug ?? ""),
    sort_order: Number(row.sort_order ?? fallbackSort) || fallbackSort,
    status: status === "deleted" ? "draft" : status,
    title: String(row.title ?? ""),
  };
}

function validateForm(form: CollectionForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = "Title is required.";
  if (!form.slug.trim()) errors.slug = "Slug is required.";
  if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  if (!Number.isFinite(form.sort_order) || form.sort_order < 0) errors.sort_order = "Sort order must be 0 or higher.";
  if (form.title.length > 191) errors.title = "Title must be 191 characters or less.";
  if (form.eyebrow_label.length > 120) errors.eyebrow_label = "Eyebrow label must be 120 characters or less.";
  if (form.seo_title.length > 191) errors.seo_title = "SEO title must be 191 characters or less.";
  if (form.seo_description.length > 255) errors.seo_description = "SEO description must be 255 characters or less.";
  if (new Set(form.product_ids).size !== form.product_ids.length) errors.products = "Duplicate products are not allowed.";
  return errors;
}

function FieldError({ error }: { error?: string }) {
  return error ? <div className="mt-1 text-xs font-semibold text-rose-600">{error}</div> : null;
}

function Thumbnail({ alt, url }: { alt: string; url: string | null | undefined }) {
  const source = bnbApiAssetUrl(url, "");
  return source ? (
    <img alt={alt} className="h-14 w-14 rounded-2xl border border-slate-200 object-cover" src={source} />
  ) : (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-stone-100 text-xs font-black text-[#5E7F85]">BNB</div>
  );
}

export function RealCollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState<CollectionForm>({ ...emptyForm });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [productSearch, setProductSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [uploading, setUploading] = useState<UploadTarget | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const orderedCollections = useMemo(
    () => [...collections].sort((first, second) => first.sort_order - second.sort_order || Number(first.id) - Number(second.id)),
    [collections],
  );
  const visibleCollections = useMemo(
    () => (statusFilter === "all" ? orderedCollections : orderedCollections.filter((collection) => collection.status === statusFilter)),
    [orderedCollections, statusFilter],
  );
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectedProducts = useMemo(
    () => form.product_ids.map((id) => productById.get(id)).filter((product): product is ProductOption => Boolean(product)),
    [form.product_ids, productById],
  );
  const selectedIds = useMemo(() => new Set(form.product_ids), [form.product_ids]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const available = products.filter((product) => !selectedIds.has(product.id));
    if (!query) return available.slice(0, 40);
    return available
      .filter((product) => [product.product_name, product.sku ?? "", product.brand_name, product.slug ?? ""].some((value) => value.toLowerCase().includes(query)))
      .slice(0, 60);
  }, [productSearch, products, selectedIds]);

  const loadCollections = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${MANAGE_COLLECTIONS_ENDPOINT}?include_deleted=1`, {
        cache: "no-store",
        headers: adminAuthHeaders(),
        signal,
      });
      const payload = (await response.json()) as { collections?: unknown[]; message?: string; success?: boolean };
      if (!response.ok || payload.success === false || !Array.isArray(payload.collections)) {
        throw new Error(payload.message || "Collections could not be loaded.");
      }
      setCollections(payload.collections.map(normalizeCollection).filter((item): item is CollectionSummary => Boolean(item)));
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Collections could not be loaded.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  const loadProducts = async (signal?: AbortSignal) => {
    setIsProductsLoading(true);
    try {
      const response = await fetch(STORE_PRODUCTS_ENDPOINT, { cache: "no-store", signal });
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
    queueMicrotask(() => {
      void loadCollections(controller.signal);
      void loadProducts(controller.signal);
    });
    return () => controller.abort();
  }, []);

  const startCreate = () => {
    setFieldErrors({});
    setError("");
    setMessage("");
    setSlugEdited(false);
    setProductSearch("");
    setForm({ ...emptyForm, sort_order: Math.max(1, collections.length + 1) });
  };

  const editCollection = async (collection: CollectionSummary) => {
    setFieldErrors({});
    setError("");
    setMessage("");
    setProductSearch("");
    try {
      const response = await fetch(`${MANAGE_COLLECTIONS_ENDPOINT}?action=get&id=${encodeURIComponent(collection.id)}`, {
        cache: "no-store",
        headers: adminAuthHeaders(),
      });
      const payload = (await response.json()) as { collection?: unknown; message?: string; success?: boolean };
      if (!response.ok || payload.success === false || !payload.collection) throw new Error(payload.message || "Collection could not be opened.");
      setForm(collectionFormFromDetail(payload.collection, collections.length + 1));
      setSlugEdited(true);
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Collection could not be opened.");
    }
  };

  const updateForm = (updates: Partial<CollectionForm>) => {
    setForm((current) => ({ ...current, ...updates }));
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(updates).forEach((key) => delete next[key as keyof CollectionForm]);
      return next;
    });
  };

  const updateTitle = (title: string) => {
    setForm((current) => ({ ...current, title, slug: !current.id && !slugEdited ? slugify(title) : current.slug }));
    setFieldErrors((current) => ({ ...current, title: undefined, slug: undefined }));
  };

  const saveCollection = async () => {
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(MANAGE_COLLECTIONS_ENDPOINT, {
        body: JSON.stringify(form),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { collection?: unknown; errors?: string[]; message?: string; success?: boolean };
      if (!response.ok || payload.success === false) {
        const validationMessage = Array.isArray(payload.errors) && payload.errors.length ? ` ${payload.errors.join(" ")}` : "";
        throw new Error((payload.message || "Collection could not be saved.") + validationMessage);
      }
      setForm(collectionFormFromDetail(payload.collection, form.sort_order));
      setSlugEdited(true);
      setMessage(payload.message || "Collection saved successfully.");
      await loadCollections();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Collection could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCollectionStatus = async (collection: CollectionSummary, status: EditableStatus) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(MANAGE_COLLECTIONS_ENDPOINT, {
        body: JSON.stringify({ action: "status", id: collection.id, status }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Status could not be updated.");
      setMessage(payload.message || "Collection status updated.");
      await loadCollections();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Status could not be updated.");
    }
  };

  const deleteCollection = async (collection: CollectionSummary) => {
    if (!window.confirm(`Delete "${collection.title}"? Products will not be deleted.`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(MANAGE_COLLECTIONS_ENDPOINT, {
        body: JSON.stringify({ action: "delete", confirm: "delete", id: collection.id }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Collection could not be deleted.");
      if (form.id === collection.id) startCreate();
      setMessage(payload.message || "Collection deleted.");
      await loadCollections();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Collection could not be deleted.");
    }
  };

  const restoreCollection = async (collection: CollectionSummary) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(MANAGE_COLLECTIONS_ENDPOINT, {
        body: JSON.stringify({ action: "restore", id: collection.id }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Collection could not be restored.");
      setMessage(payload.message || "Collection restored as draft.");
      await loadCollections();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Collection could not be restored.");
    }
  };

  const moveCollection = async (collection: CollectionSummary, direction: -1 | 1) => {
    const index = orderedCollections.findIndex((item) => item.id === collection.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= orderedCollections.length) return;
    const next = [...orderedCollections];
    [next[index], next[target]] = [next[target], next[index]];
    const normalized = next.map((item, itemIndex) => ({ ...item, sort_order: itemIndex + 1 }));
    setCollections(normalized);
    try {
      const response = await fetch(MANAGE_COLLECTIONS_ENDPOINT, {
        body: JSON.stringify({ action: "reorder", order: normalized.map((item) => item.id) }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Order could not be saved.");
      setMessage(payload.message || "Collection order saved.");
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Order could not be saved.");
      await loadCollections();
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const label = target === "desktop_image_url" ? "Desktop image" : "Mobile image";
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError(`${label} must be JPG, PNG, or WEBP.`);
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setError(`${label} must be greater than 0 bytes and no larger than 5MB.`);
      return;
    }
    setUploading(target);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch(UPLOAD_MEDIA_ENDPOINT, { body, headers: adminAuthHeaders(), method: "POST" });
      const payload = (await response.json()) as { image_url?: string; message?: string; success?: boolean };
      if (!response.ok || payload.success === false || !payload.image_url) throw new Error(payload.message || "Image upload failed.");
      updateForm({ [target]: payload.image_url });
      setMessage(`${label} uploaded and linked.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const addProduct = (product: ProductOption) => {
    if (selectedIds.has(product.id)) return;
    updateForm({ product_ids: [...form.product_ids, product.id] });
  };

  const removeProduct = (productId: string) => updateForm({ product_ids: form.product_ids.filter((id) => id !== productId) });

  const moveProduct = (productId: string, direction: -1 | 1) => {
    const index = form.product_ids.indexOf(productId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= form.product_ids.length) return;
    const next = [...form.product_ids];
    [next[index], next[target]] = [next[target], next[index]];
    updateForm({ product_ids: next });
  };

  const renderImageField = (target: UploadTarget, label: string, helper: string) => {
    const value = form[target];
    const preview = bnbApiAssetUrl(value, "");
    return (
      <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <label className="text-sm font-bold text-slate-900" htmlFor={`${target}-file`}>{label}</label>
            <div className="mt-1 text-xs leading-5 text-slate-500">{helper}</div>
          </div>
          {value ? <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600" onClick={() => updateForm({ [target]: "" })} type="button">Remove</button> : null}
        </div>
        <label className="mt-3 flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center transition hover:border-[#5E7F85] hover:bg-[#5E7F85]/5" htmlFor={`${target}-file`}>
          <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading !== null} id={`${target}-file`} onChange={(event) => uploadImage(event, target)} type="file" />
          {preview ? <img alt={`${label} preview`} className="h-full min-h-[160px] w-full object-cover" src={preview} /> : (
            <div className="px-4 py-8">
              <div className="text-sm font-black text-slate-900">{uploading === target ? "Uploading..." : "Click to upload artwork"}</div>
              <div className="mt-1 text-xs font-semibold text-[#5E7F85]">JPG, PNG, or WEBP. Max 5MB.</div>
            </div>
          )}
        </label>
        {value ? <details className="mt-3 text-xs text-slate-500"><summary className="cursor-pointer font-semibold">Uploaded URL</summary><input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500" readOnly value={value} /></details> : null}
      </div>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#5E7F85]">Catalog Editorial</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Collections</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Build ordered editorial product groups for Editor&apos;s Picks and future collection pages. Collections are not sellable bundles and do not create SKUs, prices, or stock.</p>
            </div>
            <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#4f747a]" onClick={startCreate} type="button">Create Collection</button>
          </div>
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-4">
            <div className="rounded-2xl bg-stone-50 p-4"><b>{collections.length}</b><span className="ml-2 text-slate-500">total records</span></div>
            <div className="rounded-2xl bg-stone-50 p-4"><b>{collections.filter((item) => item.status === "active").length}</b><span className="ml-2 text-slate-500">active</span></div>
            <div className="rounded-2xl bg-stone-50 p-4"><b>{collections.filter((item) => item.status === "draft").length}</b><span className="ml-2 text-slate-500">draft</span></div>
            <div className="rounded-2xl bg-stone-50 p-4"><b>{products.length}</b><span className="ml-2 text-slate-500">selectable products</span></div>
          </div>
        </section>

        {message ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Collection Records</h2>
                <p className="mt-1 text-sm text-slate-500">Deleted records are included so they can be restored safely.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "active", "inactive", "draft", "deleted"] as StatusFilter[]).map((status) => (
                  <button className={`rounded-full px-3 py-2 text-xs font-bold transition ${statusFilter === status ? "bg-[#5E7F85] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#5E7F85]/40"}`} key={status} onClick={() => setStatusFilter(status)} type="button">
                    {status === "all" ? "All" : status[0].toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {isLoading ? <div className="p-6 text-sm font-semibold text-slate-500">Loading collections...</div> : visibleCollections.length === 0 ? (
              <div className="p-6"><h3 className="text-lg font-bold text-slate-950">No collections found</h3><p className="mt-2 text-sm text-slate-500">Create a collection to start grouping products for curated storefront pages.</p></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleCollections.map((collection, index) => (
                  <article className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" key={collection.id}>
                    <button className="min-w-0 text-left" onClick={() => editCollection(collection)} type="button">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xs font-black text-[#5E7F85]">COL</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-black text-slate-950">{collection.title}</h3><Badge tone={statusTone(collection.status)}>{collection.status}</Badge></div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">/{collection.slug || "missing-slug"}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500"><span>{collection.eyebrow_label || "No eyebrow label"}</span><span>{collection.product_count} products</span><span>Sort {collection.sort_order}</span><span>Updated {formatDate(collection.updated_at)}</span></div>
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" disabled={index === 0} onClick={() => moveCollection(collection, -1)} type="button">Up</button>
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" disabled={index === visibleCollections.length - 1} onClick={() => moveCollection(collection, 1)} type="button">Down</button>
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" onClick={() => editCollection(collection)} type="button">Edit</button>
                      {collection.status === "deleted" ? <button className="rounded-xl bg-[#5E7F85] px-3 py-2 text-xs font-bold text-white" onClick={() => restoreCollection(collection)} type="button">Restore</button> : <>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" onClick={() => updateCollectionStatus(collection, collection.status === "active" ? "inactive" : "active")} type="button">{collection.status === "active" ? "Deactivate" : "Activate"}</button>
                        <button className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => deleteCollection(collection)} type="button">Delete</button>
                      </>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); void saveCollection(); }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">{form.id ? "Edit Collection" : "Create Collection"}</h2>
                <p className="mt-1 text-sm text-slate-500">Save metadata and ordered product IDs together.</p>
              </div>
              {form.id ? <Badge tone="brand">ID {form.id}</Badge> : <Badge tone="warn">New</Badge>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="text-sm font-bold text-slate-900">Title</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" maxLength={191} onChange={(event) => updateTitle(event.target.value)} value={form.title} /><FieldError error={fieldErrors.title} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-900">Slug</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" maxLength={191} onChange={(event) => { setSlugEdited(true); updateForm({ slug: slugify(event.target.value) }); }} value={form.slug} /><FieldError error={fieldErrors.slug} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-900">Eyebrow Label</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" maxLength={120} onChange={(event) => updateForm({ eyebrow_label: event.target.value })} value={form.eyebrow_label} /><FieldError error={fieldErrors.eyebrow_label} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-sm font-bold text-slate-900">Status</span><select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" onChange={(event) => updateForm({ status: event.target.value as EditableStatus })} value={form.status}><option value="draft">Draft</option><option value="inactive">Inactive</option><option value="active">Active</option></select></label>
                <label className="block"><span className="text-sm font-bold text-slate-900">Sort Order</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" min={0} onChange={(event) => updateForm({ sort_order: Number(event.target.value) || 0 })} type="number" value={form.sort_order} /><FieldError error={fieldErrors.sort_order} /></label>
              </div>
            </div>
            <label className="block"><span className="text-sm font-bold text-slate-900">Description</span><textarea className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" maxLength={5000} onChange={(event) => updateForm({ description: event.target.value })} value={form.description} /></label>
            <div className="grid gap-4 lg:grid-cols-2">{renderImageField("desktop_image_url", "Desktop Image", "Main collection artwork. Uploads through the existing authenticated media endpoint.")}{renderImageField("mobile_image_url", "Mobile Image", "Optional. Leave blank to let the storefront use the desktop artwork as fallback.")}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="text-sm font-bold text-slate-900">SEO Title</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" maxLength={191} onChange={(event) => updateForm({ seo_title: event.target.value })} value={form.seo_title} /><FieldError error={fieldErrors.seo_title} /></label>
              <label className="block"><span className="text-sm font-bold text-slate-900">SEO Description</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" maxLength={255} onChange={(event) => updateForm({ seo_description: event.target.value })} value={form.seo_description} /><FieldError error={fieldErrors.seo_description} /></label>
            </div>
            <section className="rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-black text-slate-950">Selected Products</h3><p className="mt-1 text-xs text-slate-500">Use Up/Down to control storefront order. Products remain individually sellable.</p><FieldError error={fieldErrors.products} /></div>
              {selectedProducts.length === 0 ? <div className="p-4 text-sm font-semibold text-slate-500">No products selected yet.</div> : (
                <div className="divide-y divide-slate-100">
                  {selectedProducts.map((product, index) => <div className="grid gap-3 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center" key={product.id}>
                    <div className="text-sm font-black text-[#5E7F85]">#{index + 1}</div>
                    <div className="flex min-w-0 items-center gap-3"><Thumbnail alt={product.product_name} url={product.image_url} /><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-950">{product.product_name}</div><div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500"><span>{product.sku || "No SKU"}</span><span>{product.brand_name || "No brand"}</span><span>{product.product_type}</span><span>{money(product.price)}</span></div></div></div>
                    <div className="flex flex-wrap gap-2"><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" disabled={index === 0} onClick={() => moveProduct(product.id, -1)} type="button">Up</button><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" disabled={index === selectedProducts.length - 1} onClick={() => moveProduct(product.id, 1)} type="button">Down</button><button className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => removeProduct(product.id)} type="button">Remove</button></div>
                  </div>)}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 p-4"><label className="text-sm font-black text-slate-950" htmlFor="collection-product-search">Add Products</label><input className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5E7F85] focus:ring-4 focus:ring-[#5E7F85]/10" id="collection-product-search" onChange={(event) => setProductSearch(event.target.value)} placeholder="Search by product name, SKU, brand, or slug" value={productSearch} /></div>
              {isProductsLoading ? <div className="p-4 text-sm font-semibold text-slate-500">Loading products...</div> : filteredProducts.length === 0 ? <div className="p-4 text-sm font-semibold text-slate-500">No matching active products.</div> : (
                <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                  {filteredProducts.map((product) => <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={product.id}>
                    <div className="flex min-w-0 items-center gap-3"><Thumbnail alt={product.product_name} url={product.image_url} /><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-950">{product.product_name}</div><div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500"><span>{product.sku || "No SKU"}</span><span>{product.brand_name || "No brand"}</span><span>{product.product_type}</span><span>{money(product.price)}</span></div></div></div>
                    <button className="rounded-xl bg-[#5E7F85] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#4f747a]" onClick={() => addProduct(product)} type="button">Add</button>
                  </div>)}
                </div>
              )}
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700" onClick={startCreate} type="button">Reset</button><button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#4f747a] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || uploading !== null} type="submit">{isSaving ? "Saving..." : "Save Collection"}</button></div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
