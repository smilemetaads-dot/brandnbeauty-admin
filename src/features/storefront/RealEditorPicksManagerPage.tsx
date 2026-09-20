"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  defaultHomepageCmsData,
  fetchHomepageCms,
  fetchHomepageCollectionOptions,
  UPDATE_HOMEPAGE_CMS_ENDPOINT,
  type HomepageCmsData,
  type HomepageCollectionOption,
} from "@/features/cms/cms-meta-client";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl } from "@/lib/bnb-api";

type BadgeTone = "good" | "warn" | "default" | "bad";
type ReadinessState = "Ready" | "Needs Content" | "Hidden";

type CollectionOption = HomepageCollectionOption & {
  desktop_image_url?: string | null;
  image_url?: string | null;
  mobile_image_url?: string | null;
};

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  const className = {
    bad: "bg-rose-50 text-rose-700 ring-rose-100",
    default: "bg-slate-100 text-slate-600 ring-slate-200",
    good: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warn: "bg-amber-50 text-amber-700 ring-amber-100",
  }[tone];

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${className}`}>{children}</span>;
}

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "draft") return "Draft";
  if (status === "inactive") return "Hidden";
  return "Unavailable";
}

function statusTone(status: string): BadgeTone {
  if (status === "active") return "good";
  if (status === "draft") return "warn";
  if (status === "inactive") return "default";
  return "bad";
}

function parseSelectedIds(value: string) {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .filter((id, index, ids) => ids.indexOf(id) === index);
}

function getCollectionImage(collection: CollectionOption) {
  return collection.desktop_image_url || collection.image_url || collection.mobile_image_url || "";
}

function getReadiness(selectedCollections: CollectionOption[], selectedIds: string[]): ReadinessState {
  if (selectedIds.length === 0) return "Needs Content";
  return selectedCollections.some((collection) => collection.status === "active") ? "Ready" : "Hidden";
}

function readinessTone(status: ReadinessState): BadgeTone {
  if (status === "Ready") return "good";
  if (status === "Hidden") return "default";
  return "warn";
}

function CollectionCard({
  action,
  actionDisabled = false,
  actionLabel,
  collection,
}: {
  action: () => void;
  actionDisabled?: boolean;
  actionLabel: string;
  collection: CollectionOption;
}) {
  const imageUrl = bnbApiAssetUrl(getCollectionImage(collection), "") || "";

  return (
    <article className="flex gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
        {imageUrl ? <img alt="" className="h-full w-full object-cover" src={imageUrl} /> : <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Image</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(collection.status)}>{statusLabel(collection.status)}</Badge>
          <Badge>{collection.product_count} products</Badge>
        </div>
        <h3 className="mt-2 truncate text-sm font-black text-slate-950">{collection.title}</h3>
        {collection.status !== "active" ? <p className="mt-2 text-xs font-semibold leading-5 text-amber-700">This collection is selected safely, but it will not appear publicly until it is active.</p> : null}
        <button
          className="mt-3 rounded-xl bg-[#5E7F85] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#4f747a] disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={actionDisabled}
          onClick={action}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

export function RealEditorPicksManagerPage() {
  const [homepageCms, setHomepageCms] = useState<HomepageCmsData>(defaultHomepageCmsData);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const collectionById = useMemo(() => new Map(collections.map((collection) => [collection.id, collection])), [collections]);
  const selectedCollections = useMemo(
    () => selectedIds.map((id) => collectionById.get(id)).filter((collection): collection is CollectionOption => Boolean(collection)),
    [collectionById, selectedIds],
  );
  const availableCollections = useMemo(
    () => collections.filter((collection) => !selectedIds.includes(collection.id)),
    [collections, selectedIds],
  );
  const readiness = getReadiness(selectedCollections, selectedIds);

  const loadData = (signal?: AbortSignal, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError("");

    Promise.all([
      fetchHomepageCms(signal, { headers: adminAuthHeaders(), includeInactive: true }),
      fetchHomepageCollectionOptions(signal, adminAuthHeaders()),
    ])
      .then(([homepage, nextCollections]) => {
        setHomepageCms(homepage);
        setCollections(nextCollections as CollectionOption[]);
        setSelectedIds(parseSelectedIds(homepage.editor_pick_collection_ids));
        setIsDirty(false);
      })
      .catch((loadError) => {
        if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Editor's Picks could not be loaded.");
      })
      .finally(() => {
        if (!signal?.aborted) setIsLoading(false);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadData(controller.signal, false));
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

  const markChanged = (nextIds: string[]) => {
    setSelectedIds(nextIds);
    setIsDirty(true);
    setMessage("");
    setError("");
  };

  const addCollection = (collectionId: string) => {
    if (selectedIds.includes(collectionId)) return;
    markChanged([...selectedIds, collectionId]);
  };

  const removeCollection = (collectionId: string) => {
    markChanged(selectedIds.filter((id) => id !== collectionId));
  };

  const moveCollection = (collectionId: string, direction: -1 | 1) => {
    const index = selectedIds.indexOf(collectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[target]] = [next[target], next[index]];
    markChanged(next);
  };

  const saveSelections = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(UPDATE_HOMEPAGE_CMS_ENDPOINT, {
        body: JSON.stringify({
          editor_pick_collection_ids: selectedIds.join(","),
          editor_pick_product_ids: homepageCms.editor_pick_product_ids,
        }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Save failed.");

      setHomepageCms((current) => ({ ...current, editor_pick_collection_ids: selectedIds.join(",") }));
      setMessage("Editor's Picks updated successfully.");
      setIsDirty(false);
    } catch {
      setError("We couldn't save Editor's Picks. Please review the selected collections and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#5E7F85]">Homepage Manager</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Editor&apos;s Picks</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Choose the collections shown in the homepage Editor&apos;s Picks section. Collection content, images, products and public availability are managed from Collections.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50" href="/homepage-cms">Back to Homepage Manager</a>
              <a className="rounded-2xl border border-[#5E7F85] bg-white px-4 py-3 text-sm font-bold text-[#5E7F85] hover:bg-[#5E7F85] hover:text-white" href="/collections">Manage Collections</a>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Badge tone={readinessTone(readiness)}>{readiness}</Badge>
            <span className="text-sm font-semibold text-slate-500">{selectedIds.length} selected collections</span>
          </div>
          {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-stone-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Available Collections</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Add active editorial collections to the homepage selection.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {isLoading ? <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500">Loading collections...</div> : null}
              {!isLoading && collections.length === 0 ? (
                <div className="rounded-2xl bg-white p-6 text-center">
                  <h3 className="text-base font-black text-slate-950">Create and activate a collection before adding it to Editor&apos;s Picks.</h3>
                  <a className="mt-4 inline-flex rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white" href="/collections">Manage Collections</a>
                </div>
              ) : null}
              {!isLoading && availableCollections.length === 0 && collections.length > 0 ? <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500">All available collections are already selected.</div> : null}
              {availableCollections.map((collection) => (
                <CollectionCard
                  action={() => addCollection(collection.id)}
                  actionDisabled={collection.status !== "active"}
                  actionLabel={collection.status === "active" ? "Add" : "Unavailable"}
                  collection={collection}
                  key={collection.id}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Selected Collections</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Display Order controls the homepage order. Only active collections are visible on Homepage.</p>
              </div>
              <Badge tone={readinessTone(readiness)}>{readiness}</Badge>
            </div>

            <div className="mt-5 space-y-3">
              {!isLoading && selectedIds.length === 0 ? <div className="rounded-2xl bg-stone-50 p-6 text-sm font-semibold text-slate-500">No collections are currently selected for Editor&apos;s Picks.</div> : null}
              {selectedIds.map((collectionId, index) => {
                const collection = collectionById.get(collectionId);
                if (!collection) {
                  return (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800" key={collectionId}>
                      A previously selected collection is no longer available. Remove it before saving.
                      <button className="ml-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-800" onClick={() => removeCollection(collectionId)} type="button">Remove</button>
                    </div>
                  );
                }

                return (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm" key={collection.id}>
                    <div className="flex items-start gap-4">
                      <div className="pt-1 text-sm font-black text-slate-400">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <CollectionCard action={() => removeCollection(collection.id)} actionLabel="Remove" collection={collection} />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:text-slate-300" disabled={index === 0} onClick={() => moveCollection(collection.id, -1)} type="button">Move Up</button>
                          <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:text-slate-300" disabled={index === selectedIds.length - 1} onClick={() => moveCollection(collection.id, 1)} type="button">Move Down</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50" disabled={isSaving} onClick={() => loadData()} type="button">Cancel</button>
              <button className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-bold text-white hover:bg-[#4f747a] disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isSaving} onClick={() => void saveSelections()} type="button">{isSaving ? "Saving..." : "Save Editor's Picks"}</button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}