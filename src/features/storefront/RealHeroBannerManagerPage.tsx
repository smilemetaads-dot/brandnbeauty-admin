"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  defaultHomepageCmsData,
  fetchHomepageCms,
  UPDATE_HOMEPAGE_CMS_ENDPOINT,
  type HomepageCmsData,
  type HomepageHeroBanner,
} from "@/features/cms/cms-meta-client";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl, bnbApiUrl } from "@/lib/bnb-api";

type HeroVisibility = "active" | "inactive" | "draft";
type UploadTarget = "image_url" | "mobile_image_url";
type BadgeTone = "good" | "warn" | "default" | "bad";

type HeroDraft = HomepageHeroBanner & {
  mobile_image_url?: string | null;
};

type UploadState = {
  error: string;
  isUploading: boolean;
  progress: number;
};

const UPLOAD_MEDIA_ENDPOINT = bnbApiUrl("upload_media.php");
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyHero = (sortOrder: number, id: string): HeroDraft => ({
  cta_text: "",
  id,
  image_url: "",
  link: "",
  mobile_image_url: "",
  sort_order: sortOrder,
  status: "draft",
  subtitle: "",
  title: "",
});

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

function visibilityLabel(status: string) {
  if (status === "active") return "Visible";
  if (status === "draft") return "Draft";
  return "Hidden";
}

function visibilityTone(status: string): BadgeTone {
  if (status === "active") return "good";
  if (status === "draft") return "warn";
  return "default";
}

function normalizeHeroes(homepage: HomepageCmsData): HeroDraft[] {
  return homepage.hero_banners
    .map((hero, index) => ({
      ...hero,
      cta_text: hero.cta_text || "",
      id: String(hero.id || index + 1),
      image_url: hero.image_url || "",
      link: hero.link || "",
      mobile_image_url: hero.mobile_image_url || "",
      sort_order: Number(hero.sort_order) || index + 1,
      status: ["active", "inactive", "draft"].includes(hero.status) ? hero.status : "inactive",
      subtitle: hero.subtitle || "",
      title: hero.title || "",
    }))
    .sort((a, b) => a.sort_order - b.sort_order || Number(a.id) - Number(b.id))
    .map((hero, index) => ({ ...hero, sort_order: index + 1 }));
}

function nextHeroId(heroes: HeroDraft[]) {
  const numericIds = heroes.map((hero) => Number(hero.id)).filter((id) => Number.isFinite(id) && id > 0);
  return String((numericIds.length ? Math.max(...numericIds) : 0) + 1);
}

function cleanHeroForSave(hero: HeroDraft): HeroDraft {
  return {
    ...hero,
    cta_text: hero.cta_text.trim(),
    image_url: hero.image_url?.trim() || "",
    link: hero.link.trim(),
    mobile_image_url: hero.mobile_image_url?.trim() || "",
    subtitle: hero.subtitle.trim(),
    title: hero.title.trim(),
  };
}

export function RealHeroBannerManagerPage() {
  const [homepageCms, setHomepageCms] = useState<HomepageCmsData>(defaultHomepageCmsData);
  const [heroes, setHeroes] = useState<HeroDraft[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState("");
  const [deletedHeroIds, setDeletedHeroIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<HeroDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadState, setUploadState] = useState<Record<UploadTarget, UploadState>>({
    image_url: { error: "", isUploading: false, progress: 0 },
    mobile_image_url: { error: "", isUploading: false, progress: 0 },
  });

  const selectedHero = useMemo(
    () => heroes.find((hero) => hero.id === selectedHeroId) || heroes[0] || emptyHero(1, "1"),
    [heroes, selectedHeroId],
  );

  const loadHeroes = (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");

    fetchHomepageCms(signal, { headers: adminAuthHeaders(), includeInactive: true })
      .then((homepage) => {
        const nextHeroes = normalizeHeroes(homepage);
        setHomepageCms(homepage);
        setHeroes(nextHeroes);
        setSelectedHeroId((current) => current || nextHeroes[0]?.id || "");
        setDeletedHeroIds([]);
        setIsDirty(false);
      })
      .catch((loadError) => {
        if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Hero banners could not be loaded.");
      })
      .finally(() => {
        if (!signal?.aborted) setIsLoading(false);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    loadHeroes(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateSelectedHero = (patch: Partial<HeroDraft>) => {
    setHeroes((current) => current.map((hero) => (hero.id === selectedHero.id ? { ...hero, ...patch } : hero)));
    setIsDirty(true);
    setMessage("");
    setError("");
  };

  const addHero = () => {
    const next = emptyHero(heroes.length + 1, nextHeroId(heroes));
    setHeroes((current) => [...current, next]);
    setSelectedHeroId(next.id);
    setIsDirty(true);
    setMessage("");
  };

  const moveHero = (heroId: string, direction: -1 | 1) => {
    setHeroes((current) => {
      const index = current.findIndex((hero) => hero.id === heroId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((hero, heroIndex) => ({ ...hero, sort_order: heroIndex + 1 }));
    });
    setIsDirty(true);
    setMessage("");
  };

  const toggleVisibility = (hero: HeroDraft) => {
    setHeroes((current) => current.map((item) => (item.id === hero.id ? { ...item, status: hero.status === "active" ? "inactive" : "active" } : item)));
    setIsDirty(true);
    setMessage("");
  };

  const confirmDeleteHero = () => {
    if (!deleteTarget) return;
    if (/^\d+$/.test(deleteTarget.id)) {
      setDeletedHeroIds((current) => Array.from(new Set([...current, deleteTarget.id])));
    }
    const remaining = heroes.filter((hero) => hero.id !== deleteTarget.id).map((hero, index) => ({ ...hero, sort_order: index + 1 }));
    setHeroes(remaining);
    setSelectedHeroId(remaining[0]?.id || "");
    setDeleteTarget(null);
    setIsDirty(true);
    setMessage("");
  };

  const validateHero = (hero: HeroDraft) => {
    if (hero.cta_text.trim() && !hero.link.trim()) return "Add a Button Link or remove the Button Text.";
    if (hero.link.trim() && !hero.link.trim().startsWith("/")) return "Button Link should be a website page such as /products.";
    return "";
  };

  const saveHero = async (statusOverride?: HeroVisibility) => {
    const nextHeroes = heroes.map((hero) => (hero.id === selectedHero.id && statusOverride ? { ...hero, status: statusOverride } : hero));
    const validationError = validateHero(nextHeroes.find((hero) => hero.id === selectedHero.id) || selectedHero);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(UPDATE_HOMEPAGE_CMS_ENDPOINT, {
        body: JSON.stringify({
          deleted_hero_banner_ids: deletedHeroIds,
          editor_pick_collection_ids: homepageCms.editor_pick_collection_ids,
          editor_pick_product_ids: homepageCms.editor_pick_product_ids,
          hero_banners: nextHeroes.map(cleanHeroForSave),
        }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Save failed.");

      setMessage("Hero banner saved successfully.");
      setIsDirty(false);
      const fresh = await fetchHomepageCms(undefined, { headers: adminAuthHeaders(), includeInactive: true });
      const refreshedHeroes = normalizeHeroes(fresh);
      setHomepageCms(fresh);
      setHeroes(refreshedHeroes);
      setSelectedHeroId((current) => refreshedHeroes.find((hero) => hero.id === current)?.id || refreshedHeroes[0]?.id || "");
      setDeletedHeroIds([]);
    } catch {
      setError("We couldn't save the hero banner. Please review the fields and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImageFile = async (file: File, target: UploadTarget) => {
    const label = target === "image_url" ? "Desktop Image" : "Mobile Image";
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setUploadState((current) => ({ ...current, [target]: { error: `${label} must be a JPG, PNG, or WEBP image.`, isUploading: false, progress: 0 } }));
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setUploadState((current) => ({ ...current, [target]: { error: `${label} must be greater than 0 bytes and no larger than 5MB.`, isUploading: false, progress: 0 } }));
      return;
    }

    setUploadState((current) => ({ ...current, [target]: { error: "", isUploading: true, progress: 0 } }));

    try {
      const uploadedUrl = await new Promise<string>((resolve, reject) => {
        const body = new FormData();
        body.append("image", file);
        body.append("folder", "homepage");
        const xhr = new XMLHttpRequest();
        xhr.open("POST", UPLOAD_MEDIA_ENDPOINT);
        Object.entries(adminAuthHeaders()).forEach(([key, value]) => xhr.setRequestHeader(key, value));
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          setUploadState((current) => ({ ...current, [target]: { ...current[target], progress: Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))) } }));
        };
        xhr.onerror = () => reject(new Error("Image upload failed."));
        xhr.onload = () => {
          let payload: { image_url?: string; message?: string; success?: boolean } = {};
          try { payload = JSON.parse(xhr.responseText || "{}"); } catch { reject(new Error("Image upload returned an invalid response.")); return; }
          if (xhr.status < 200 || xhr.status >= 300 || payload.success === false || !payload.image_url) {
            reject(new Error(payload.message || "Image upload failed."));
            return;
          }
          resolve(payload.image_url);
        };
        xhr.send(body);
      });

      updateSelectedHero({ [target]: uploadedUrl });
      setUploadState((current) => ({ ...current, [target]: { error: "", isUploading: false, progress: 100 } }));
    } catch (uploadError) {
      setUploadState((current) => ({ ...current, [target]: { error: uploadError instanceof Error ? uploadError.message : "Image upload failed.", isUploading: false, progress: 0 } }));
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, target: UploadTarget) => {
    const file = event.target.files?.[0];
    if (file) await uploadImageFile(file, target);
    event.target.value = "";
  };

  const renderImageControl = (target: UploadTarget, title: string, helper: string, recommendation: string) => {
    const value = selectedHero[target] || "";
    const previewUrl = bnbApiAssetUrl(value, "") || "";
    const state = uploadState[target];

    return (
      <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4">
        <div className="text-sm font-black text-slate-950">{title}</div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
        <div className="mt-3 rounded-2xl bg-white px-3 py-3 text-xs leading-5 text-slate-600">
          <div><span className="font-bold text-slate-900">Recommended:</span> {recommendation}</div>
          <div><span className="font-bold text-slate-900">Supported formats:</span> JPG, PNG, WebP</div>
          <div><span className="font-bold text-slate-900">Maximum file size:</span> 5MB</div>
        </div>
        <label className="relative mt-3 flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-[#5E7F85] hover:bg-[#5E7F85]/5">
          <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={state.isUploading || isSaving} onChange={(event) => uploadImage(event, target)} type="file" />
          {previewUrl ? <img alt={`${title} preview`} className="absolute inset-0 h-full w-full object-cover" src={previewUrl} /> : null}
          {previewUrl ? <div className="absolute inset-0 bg-black/20" /> : null}
          <div className={`relative z-10 rounded-2xl px-4 py-3 ${previewUrl ? "bg-white/90 shadow-sm" : ""}`}>
            {state.isUploading ? (
              <><div className="text-sm font-black text-[#5E7F85]">Uploading {state.progress}%</div><div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${state.progress}%` }} /></div></>
            ) : value ? (
              <><div className="text-sm font-black text-slate-950">Image uploaded</div><div className="mt-1 text-xs font-semibold text-[#5E7F85]">Click to replace image</div></>
            ) : (
              <><div className="text-sm font-black text-slate-900">Choose image</div><div className="mt-1 text-xs font-semibold text-slate-500">Click to browse</div></>
            )}
          </div>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {value ? <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" onClick={() => updateSelectedHero({ [target]: "" })} type="button">Remove Image</button> : null}
          {value ? <details className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-500"><summary className="cursor-pointer text-slate-600">Advanced Details</summary><input className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" readOnly value={value} /></details> : null}
        </div>
        {state.error ? <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{state.error}</div> : null}
      </div>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#5E7F85]">Homepage Manager</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Hero Banners</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage the main banners shown at the top of the BrandnBeauty homepage.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/homepage-cms">Back to Homepage Manager</a>
              <a className="rounded-2xl border border-[#5E7F85] bg-white px-4 py-3 text-sm font-bold text-[#5E7F85] hover:bg-[#5E7F85] hover:text-white" href={process.env.NEXT_PUBLIC_BNB_STOREFRONT_URL?.trim() || "/"} rel="noopener noreferrer" target="_blank">Open Homepage</a>
              <button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white hover:bg-[#4f747a]" onClick={addHero} type="button">Add New Hero</button>
            </div>
          </div>
          {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950">Hero Banner List</h2>
              <button className="text-sm font-bold text-[#5E7F85]" disabled={isLoading} onClick={() => loadHeroes()} type="button">Refresh</button>
            </div>
            {heroes.length === 0 && !isLoading ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="text-lg font-black text-slate-950">No hero banners have been added yet.</div>
                <button className="mt-5 rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white" onClick={addHero} type="button">Add First Hero</button>
              </div>
            ) : null}
            {heroes.map((hero, index) => {
              const thumbnail = bnbApiAssetUrl(hero.image_url, "") || "";
              const selected = hero.id === selectedHero.id;
              return (
                <article className={`rounded-[1.75rem] border bg-white p-4 shadow-sm ${selected ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"}`} key={hero.id}>
                  <div className="flex gap-4">
                    <button className="h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-stone-100 text-xs font-bold text-slate-400" onClick={() => setSelectedHeroId(hero.id)} type="button">
                      {thumbnail ? <img alt="Hero thumbnail" className="h-full w-full object-cover" src={thumbnail} /> : "No image"}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={visibilityTone(hero.status)}>{visibilityLabel(hero.status)}</Badge>
                        <Badge>Order {index + 1}</Badge>
                        <Badge tone={hero.mobile_image_url ? "good" : "default"}>{hero.mobile_image_url ? "Mobile image" : "Desktop image only"}</Badge>
                      </div>
                      <h3 className="mt-3 truncate text-base font-black text-slate-950">{hero.title || "Untitled hero banner"}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="rounded-xl bg-[#5E7F85] px-3 py-2 text-xs font-bold text-white" onClick={() => setSelectedHeroId(hero.id)} type="button">Edit</button>
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" onClick={() => toggleVisibility(hero)} type="button">{hero.status === "active" ? "Hide" : "Show"}</button>
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:text-slate-300" disabled={index === 0} onClick={() => moveHero(hero.id, -1)} type="button">Move Up</button>
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:text-slate-300" disabled={index === heroes.length - 1} onClick={() => moveHero(hero.id, 1)} type="button">Move Down</button>
                        <button className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => setDeleteTarget(hero)} type="button">Delete</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Add / Edit Hero</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">Headline<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateSelectedHero({ title: event.target.value })} value={selectedHero.title} /></label>
                <label className="block text-sm font-bold text-slate-700">Supporting Text<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateSelectedHero({ subtitle: event.target.value })} value={selectedHero.subtitle} /></label>
                <label className="block text-sm font-bold text-slate-700">Button Text<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateSelectedHero({ cta_text: event.target.value })} value={selectedHero.cta_text} /></label>
                <label className="block text-sm font-bold text-slate-700">Button Link<span className="mt-1 block text-xs font-medium text-slate-500">Enter a website page such as /products or /collections/brightening.</span><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateSelectedHero({ link: event.target.value })} value={selectedHero.link} /></label>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">Show on Homepage<span className="mt-1 block text-xs font-medium text-slate-500">Visible shows on homepage. Hidden is saved but not shown. Draft is work in progress.</span><select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateSelectedHero({ status: event.target.value as HeroVisibility })} value={selectedHero.status}><option value="active">Visible</option><option value="inactive">Hidden</option><option value="draft">Draft</option></select></label>
                <label className="block text-sm font-bold text-slate-700">Display Order<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" min={1} onChange={(event) => updateSelectedHero({ sort_order: Math.max(1, Number(event.target.value) || 1) })} type="number" value={selectedHero.sort_order} /></label>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {renderImageControl("image_url", "Desktop Image", "Wide desktop banner.", "1600 × 405 px")}
              {renderImageControl("mobile_image_url", "Mobile Image", "16:9 mobile banner. Optional; leave blank to use the desktop image on mobile.", "1080 × 607 px")}
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-black text-slate-950">Banner Preview</h2><p className="mt-1 text-sm text-slate-500">Preview shows the banner content and layout approximately. Open the homepage for the final live view.</p></div><Badge tone={visibilityTone(selectedHero.status)}>{visibilityLabel(selectedHero.status)}</Badge></div>
              <div className="relative mt-5 min-h-56 overflow-hidden rounded-[1.5rem] bg-[#edf3f5] p-6 text-slate-950">
                {selectedHero.image_url ? <img alt="Hero preview" className="absolute inset-0 h-full w-full object-cover" src={bnbApiAssetUrl(selectedHero.image_url, "") || ""} /> : null}
                <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/50 to-transparent" />
                <div className="relative z-10 max-w-lg"><div className="text-3xl font-black tracking-tight">{selectedHero.title || "Hero headline"}</div><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{selectedHero.subtitle || "Supporting text appears here."}</p>{selectedHero.cta_text ? <div className="mt-5 inline-flex rounded-full bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white">{selectedHero.cta_text}</div> : null}</div>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
              <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => loadHeroes()} type="button">Cancel</button>
              <button className="rounded-2xl border border-[#5E7F85] bg-white px-5 py-3 text-sm font-bold text-[#5E7F85] hover:bg-[#5E7F85] hover:text-white" disabled={isSaving} onClick={() => void saveHero("draft")} type="button">Save as Draft</button>
              <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white hover:bg-[#4f747a] disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isSaving} onClick={() => void saveHero()} type="button">{isSaving ? "Saving..." : "Save Hero"}</button>
            </section>
          </div>
        </section>

        {deleteTarget ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl"><h2 className="text-xl font-black text-slate-950">Delete this hero banner?</h2><p className="mt-3 text-sm leading-6 text-slate-500">This banner will be removed from the homepage manager. This action may not be reversible.</p><div className="mt-6 flex justify-end gap-3"><button className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700" onClick={() => setDeleteTarget(null)} type="button">Cancel</button><button className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white" onClick={confirmDeleteHero} type="button">Delete Hero</button></div></div></div> : null}
      </div>
    </AdminShell>
  );
}