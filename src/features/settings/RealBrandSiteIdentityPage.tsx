"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type SiteIdentity = {
  brand_name: string;
  favicon_url: string;
  footer_logo_url: string;
  logo_alt_text: string;
  main_logo_url: string;
};

type UploadTarget = "main_logo_url" | "footer_logo_url" | "favicon_url";

type UploadState = Record<UploadTarget, { error: string; isUploading: boolean; progress: number }>;

const GET_IDENTITY_ENDPOINT = bnbApiUrl("get_site_identity.php");
const UPDATE_IDENTITY_ENDPOINT = bnbApiUrl("update_site_identity.php");
const UPLOAD_MEDIA_ENDPOINT = bnbApiUrl("upload_media.php");

const defaultIdentity: SiteIdentity = {
  brand_name: "BrandnBeauty",
  favicon_url: "",
  footer_logo_url: "",
  logo_alt_text: "BrandnBeauty",
  main_logo_url: "",
};

const uploadLabels: Record<UploadTarget, string> = {
  favicon_url: "Favicon",
  footer_logo_url: "Footer Logo",
  main_logo_url: "Main Logo",
};

function normalizeIdentity(payload: Partial<SiteIdentity> | null | undefined): SiteIdentity {
  const identity = payload || {};

  return {
    brand_name: String(identity.brand_name || defaultIdentity.brand_name).trim() || defaultIdentity.brand_name,
    favicon_url: String(identity.favicon_url || "").trim(),
    footer_logo_url: String(identity.footer_logo_url || "").trim(),
    logo_alt_text: String(identity.logo_alt_text || defaultIdentity.logo_alt_text).trim() || defaultIdentity.logo_alt_text,
    main_logo_url: String(identity.main_logo_url || "").trim(),
  };
}

function validateImageFile(file: File, target: UploadTarget): string {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return target === "favicon_url"
      ? "Use a PNG, JPG, or WEBP favicon image. ICO upload is not enabled in the current media pipeline."
      : "Use a JPG, PNG, or WEBP image.";
  }

  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    return "Image must be greater than 0 bytes and no larger than 5MB.";
  }

  return "";
}

function LogoPreview({ alt, title, url }: { alt: string; title: string; url: string }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500">
        {url ? "Preview unavailable" : `${title} not configured`}
      </div>
    );
  }

  return (
    <div className="flex h-28 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
      <img alt={alt} className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} src={url} />
    </div>
  );
}

function IdentityUploader({
  help,
  identity,
  onFile,
  onRemove,
  target,
  uploadState,
}: {
  help: string;
  identity: SiteIdentity;
  onFile: (file: File, target: UploadTarget) => void;
  onRemove: (target: UploadTarget) => void;
  target: UploadTarget;
  uploadState: UploadState[UploadTarget];
}) {
  const label = uploadLabels[target];
  const value = identity[target];

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-900">{label}</div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{help}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#5E7F85] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4e7278]">
            {uploadState.isUploading ? `Uploading ${uploadState.progress}%` : value ? "Replace" : "Upload"}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploadState.isUploading}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onFile(file, target);
              }}
              type="file"
            />
          </label>
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!value || uploadState.isUploading}
            onClick={() => onRemove(target)}
            type="button"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        <LogoPreview alt={identity.logo_alt_text} title={label} url={value} />
        <div className="rounded-2xl bg-stone-50 p-4">
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Saved URL</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none"
            onChange={() => undefined}
            readOnly
            value={value}
          />
          {uploadState.error ? <p className="mt-2 text-sm font-semibold text-rose-700">{uploadState.error}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function RealBrandSiteIdentityPage() {
  const [identity, setIdentity] = useState<SiteIdentity>(defaultIdentity);
  const [savedIdentity, setSavedIdentity] = useState<SiteIdentity>(defaultIdentity);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({
    favicon_url: { error: "", isUploading: false, progress: 0 },
    footer_logo_url: { error: "", isUploading: false, progress: 0 },
    main_logo_url: { error: "", isUploading: false, progress: 0 },
  });

  const isDirty = useMemo(
    () => JSON.stringify(identity) !== JSON.stringify(savedIdentity),
    [identity, savedIdentity],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadIdentity() {
      try {
        setIsLoading(true);
        const response = await fetch(GET_IDENTITY_ENDPOINT, { cache: "no-store" });
        const payload = (await response.json()) as { identity?: Partial<SiteIdentity>; success?: boolean };
        if (!response.ok || payload.success === false) throw new Error("Brand identity could not be loaded.");
        const nextIdentity = normalizeIdentity(payload.identity);
        if (isMounted) {
          setIdentity(nextIdentity);
          setSavedIdentity(nextIdentity);
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Brand identity could not be loaded.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadIdentity();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  const updateIdentity = (updates: Partial<SiteIdentity>) => {
    setIdentity((current) => ({ ...current, ...updates }));
    setMessage("");
  };

  const uploadFile = (file: File, target: UploadTarget) => {
    const error = validateImageFile(file, target);
    if (error) {
      setUploadState((current) => ({ ...current, [target]: { error, isUploading: false, progress: 0 } }));
      return;
    }

    setUploadState((current) => ({ ...current, [target]: { error: "", isUploading: true, progress: 0 } }));
    setMessage("");

    const body = new FormData();
    body.append("image", file);
    body.append("folder", "site-identity");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_MEDIA_ENDPOINT);
    Object.entries(adminAuthHeaders()).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setUploadState((current) => ({ ...current, [target]: { ...current[target], progress: Math.round((event.loaded / event.total) * 100) } }));
    };
    xhr.onerror = () => {
      setUploadState((current) => ({ ...current, [target]: { error: "Image upload failed.", isUploading: false, progress: 0 } }));
    };
    xhr.onload = () => {
      let payload: { image_url?: string; message?: string; success?: boolean } = {};
      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {
        payload = { message: "Upload returned an invalid response.", success: false };
      }

      if (xhr.status < 200 || xhr.status >= 300 || payload.success === false || !payload.image_url) {
        setUploadState((current) => ({ ...current, [target]: { error: payload.message || "Image upload failed.", isUploading: false, progress: 0 } }));
        return;
      }

      updateIdentity({ [target]: payload.image_url } as Partial<SiteIdentity>);
      setUploadState((current) => ({ ...current, [target]: { error: "", isUploading: false, progress: 100 } }));
    };
    xhr.send(body);
  };

  const saveIdentity = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(UPDATE_IDENTITY_ENDPOINT, {
        body: JSON.stringify({ identity }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { identity?: Partial<SiteIdentity>; message?: string; success?: boolean } | null;
      if (!response.ok || !payload?.success) throw new Error(payload?.message || "Brand identity could not be saved.");
      const nextIdentity = normalizeIdentity(payload.identity);
      setIdentity(nextIdentity);
      setSavedIdentity(nextIdentity);
      setMessage(payload.message || "Brand identity saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Brand identity could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Settings</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Brand & Site Identity</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage the public logo, footer logo fallback, favicon, and logo alt text from one shared storefront source.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isDirty || isSaving}
                onClick={() => {
                  setIdentity(savedIdentity);
                  setMessage("Draft changes reset.");
                }}
                type="button"
              >
                Reset Draft
              </button>
              <button
                className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4e7278] disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!isDirty || isSaving}
                onClick={saveIdentity}
                type="button"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Source: <b className="text-[#5E7F85]">settings.site_identity_json</b></div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Status: <b className="text-slate-900">{isLoading ? "Loading..." : isDirty ? "Unsaved changes" : "Saved"}</b></div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Upload: <b className="text-slate-900">JPG, PNG, WEBP up to 5MB</b></div>
          </div>
        </section>

        {message ? <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">{message}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <IdentityUploader
              help="Recommended: transparent PNG or WEBP, approximately 360 x 96 px. Used in the global header."
              identity={identity}
              onFile={uploadFile}
              onRemove={(target) => updateIdentity({ [target]: "" } as Partial<SiteIdentity>)}
              target="main_logo_url"
              uploadState={uploadState.main_logo_url}
            />
            <IdentityUploader
              help="Optional. When blank, the footer uses the main logo. Recommended: light logo suitable for the footer background."
              identity={identity}
              onFile={uploadFile}
              onRemove={(target) => updateIdentity({ [target]: "" } as Partial<SiteIdentity>)}
              target="footer_logo_url"
              uploadState={uploadState.footer_logo_url}
            />
            <IdentityUploader
              help="Recommended: square PNG or WEBP, 256 x 256 px. ICO upload is not enabled in the current media pipeline."
              identity={identity}
              onFile={uploadFile}
              onRemove={(target) => updateIdentity({ [target]: "" } as Partial<SiteIdentity>)}
              target="favicon_url"
              uploadState={uploadState.favicon_url}
            />
          </div>

          <aside className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Brand Text</h2>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Brand Name
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                  onChange={(event) => updateIdentity({ brand_name: event.target.value })}
                  value={identity.brand_name}
                />
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Logo Alt Text
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15"
                  onChange={(event) => updateIdentity({ logo_alt_text: event.target.value })}
                  value={identity.logo_alt_text}
                />
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="text-sm font-bold text-amber-800">Launch Safety</div>
              <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-amber-800">
                <li>Header uses Main Logo with text fallback.</li>
                <li>Footer uses Footer Logo, then Main Logo, then brand text.</li>
                <li>Favicon uses the saved icon route when configured.</li>
                <li>Removing a URL never deletes the uploaded media file.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}