"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  defaultCmsMeta,
  defaultHomepageCmsData,
  fetchCmsMeta,
  fetchHomepageCms,
  fetchHomepageProductOptions,
  UPDATE_HOMEPAGE_CMS_ENDPOINT,
  type CmsMeta,
  type HomepageCmsData,
  type HomepageHeroBanner,
  type HomepageOfferCard,
  type HomepageProductOption,
} from "@/features/cms/cms-meta-client";
import { adminAuthHeaders } from "@/lib/admin-auth";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const stats = [
  {
    helper: "Live CMS surface",
    label: "Homepage module",
    value: "Live save",
  },
  {
    helper: "Canvas structure",
    label: "Merchandising areas",
    value: "8",
  },
  {
    helper: "Featured products",
    label: "Catalog blocks",
    value: "4",
  },
  {
    helper: "Hero, offer and editor saves",
    label: "Publish safety",
    value: "Live save",
  },
];

const sectionBlocks = [
  {
    description: "Hero headline, image, CTA route and display status.",
    label: "Hero section",
    placement: "Top",
    status: "Live",
  },
  {
    description: "Main category shortcuts for skincare, hair care, body care and makeup.",
    label: "Shop by category",
    placement: "Discovery",
    status: "Coming later",
  },
  {
    description: "Product cards for homepage merchandising and manual highlight slots.",
    label: "Featured products",
    placement: "Merchandising",
    status: "Coming later",
  },
  {
    description: "Routine-led block for cleanser, treatment, moisturizer and sunscreen sequence.",
    label: "Routine builder",
    placement: "Education",
    status: "Coming later",
  },
  {
    description: "Campaign row for homepage-visible deals and bundle promotions.",
    label: "Promotional banner",
    placement: "Campaign",
    status: "Coming later",
  },
];

const productRows = [
  ["Barrier Calm Serum", "BrandnBeauty", "Tk 990", "Hero / Featured", "Static preview"],
  ["Acne Balance Facewash", "BrandnBeauty", "Tk 690", "Routine Builder", "Static preview"],
  ["Hydra Gel Moisturizer", "BrandnBeauty", "Tk 850", "Editor Picks", "Static preview"],
  ["Daily Sun Gel", "BrandnBeauty", "Tk 760", "Best Sellers", "Static preview"],
];

const previewProducts = [
  "Barrier Calm Serum",
  "Acne Balance Facewash",
  "Hydra Gel Moisturizer",
  "Daily Sun Gel",
];

const safetyItems = [
  "Homepage hero, offer and editor pick saves now use the local PHP/MySQL CMS endpoint.",
  "If CMS data is missing, the storefront keeps the original static fallback content.",
  "Only active hero banners appear on the storefront; inactive and draft banners stay hidden.",
  "Use real storefront CTA routes such as /products, /category/skincare or /brand/brandnbeauty. Avoid # links.",
  "Recommended hero images are wide JPG/WebP files around 1600 x 700 with important content centered.",
  "Category, concern, brand and product-feed layouts are unchanged.",
];

const defaultHeroDraft: HomepageHeroBanner = {
  cta_text: "Shop Now",
  id: "1",
  image_url: "",
  link: "/products",
  sort_order: 1,
  status: "inactive",
  subtitle: "Update this copy before publishing the banner.",
  title: "New Homepage Hero",
};

const defaultOfferDraft: HomepageOfferCard = {
  discount: "Limited Offer",
  id: "1",
  image_url: "",
  link: "/products?offer=special-offer",
  sort_order: 1,
  status: "active",
  subtitle: "Fresh deals for your everyday routine.",
  title: "Special Offer",
};

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
          : "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function StatCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
          HC
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function SectionStatusRow({
  description,
  label,
  placement,
  status,
}: {
  description: string;
  label: string;
  placement: string;
  status: string;
}) {
  return (
    <div className="grid gap-4 border-t border-slate-100 px-5 py-4 md:grid-cols-[1.2fr_0.8fr_120px] md:items-center">
      <div>
        <div className="font-bold text-slate-900">{label}</div>
        <div className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </div>
      </div>
      <div className="text-sm font-semibold text-slate-600">{placement}</div>
      <Badge tone="warn">{status}</Badge>
    </div>
  );
}

export function RealHomepageCmsPage() {
  const [cmsMeta, setCmsMeta] = useState<CmsMeta>(defaultCmsMeta);
  const [homepageCms, setHomepageCms] = useState<HomepageCmsData>(
    defaultHomepageCmsData,
  );
  const [heroDrafts, setHeroDrafts] = useState<HomepageHeroBanner[]>([
    defaultHeroDraft,
  ]);
  const [selectedHeroId, setSelectedHeroId] = useState(defaultHeroDraft.id);
  const [deletedHeroIds, setDeletedHeroIds] = useState<string[]>([]);
  const [offerDraft, setOfferDraft] =
    useState<HomepageOfferCard>(defaultOfferDraft);
  const [editorPickIds, setEditorPickIds] = useState("");
  const [productOptions, setProductOptions] = useState<HomepageProductOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [cmsMessage, setCmsMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchCmsMeta(controller.signal),
      fetchHomepageCms(controller.signal, {
        headers: adminAuthHeaders(),
        includeInactive: true,
      }),
      fetchHomepageProductOptions(controller.signal),
    ])
      .then(([meta, homepage, products]) => {
        setCmsMeta(meta);
        setHomepageCms(homepage);
        setProductOptions(products);

        if (homepage.hero_banners.length > 0) {
          const nextHeroDrafts = homepage.hero_banners.map((banner, index) => ({
            ...defaultHeroDraft,
            ...banner,
            id: String(banner.id || index + 1),
            image_url: banner.image_url ?? "",
            sort_order: Number.isFinite(Number(banner.sort_order))
              ? Number(banner.sort_order)
              : index + 1,
          }));

          setHeroDrafts(nextHeroDrafts);
          setSelectedHeroId(nextHeroDrafts[0]?.id ?? defaultHeroDraft.id);
        }
        if (homepage.offer_cards[0]) {
          setOfferDraft({
            ...defaultOfferDraft,
            ...homepage.offer_cards[0],
            image_url: homepage.offer_cards[0].image_url ?? "",
          });
        }
        setEditorPickIds(homepage.editor_pick_product_ids);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Homepage CMS metadata could not be loaded.", error);
        }
      });

    return () => controller.abort();
  }, []);

  const selectedHeroDraft =
    heroDrafts.find((hero) => hero.id === selectedHeroId) ??
    heroDrafts[0] ??
    defaultHeroDraft;

  const updateSelectedHeroDraft = (
    updater: (current: HomepageHeroBanner) => HomepageHeroBanner,
  ) => {
    setHeroDrafts((current) =>
      current.map((hero) =>
        hero.id === selectedHeroDraft.id ? updater(hero) : hero,
      ),
    );
  };

  const addHeroDraft = () => {
    const numericIds = heroDrafts
      .map((hero) => Number(hero.id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const nextId = String((numericIds.length ? Math.max(...numericIds) : 0) + 1);
    const nextHero = {
      ...defaultHeroDraft,
      id: nextId,
      sort_order: heroDrafts.length + 1,
      status: "inactive",
      title: `New Homepage Hero ${heroDrafts.length + 1}`,
    };

    setHeroDrafts((current) => [...current, nextHero]);
    setSelectedHeroId(nextId);
  };

  const deleteSelectedHeroDraft = () => {
    if (heroDrafts.length <= 1) {
      updateSelectedHeroDraft((current) => ({ ...current, status: "deleted" }));
      return;
    }

    setDeletedHeroIds((current) =>
      selectedHeroDraft.id && /^\d+$/.test(selectedHeroDraft.id)
        ? Array.from(new Set([...current, selectedHeroDraft.id]))
        : current,
    );
    const nextHeroDrafts = heroDrafts.filter(
      (hero) => hero.id !== selectedHeroDraft.id,
    );

    setHeroDrafts(nextHeroDrafts);
    setSelectedHeroId(nextHeroDrafts[0]?.id ?? defaultHeroDraft.id);
  };

  const moveSelectedHeroDraft = (direction: -1 | 1) => {
    setHeroDrafts((current) => {
      const index = current.findIndex((hero) => hero.id === selectedHeroDraft.id);
      const target = index + direction;

      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];

      return next.map((hero, heroIndex) => ({
        ...hero,
        sort_order: heroIndex + 1,
      }));
    });
  };

  const toggleEditorPick = (productId: string) => {
    const currentIds = editorPickIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const nextIds = currentIds.includes(productId)
      ? currentIds.filter((id) => id !== productId)
      : [...currentIds, productId];

    setEditorPickIds(nextIds.join(","));
  };

  const selectedEditorPickIds = useMemo(
    () =>
      editorPickIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [editorPickIds],
  );

  const unknownEditorPickIds = selectedEditorPickIds.filter(
    (id) => !productOptions.some((product) => product.id === id),
  );

  const saveHomepageCms = async () => {
    setIsSaving(true);
    setCmsMessage("");

    try {
      const response = await fetch(UPDATE_HOMEPAGE_CMS_ENDPOINT, {
        body: JSON.stringify({
          editor_pick_product_ids: editorPickIds,
          deleted_hero_banner_ids: deletedHeroIds,
          hero_banner: heroDrafts[0] ?? defaultHeroDraft,
          hero_banners: heroDrafts,
          offer_card: offerDraft,
        }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        success?: boolean;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Homepage CMS save failed.");
      }

      const freshCms = await fetchHomepageCms(undefined, {
        headers: adminAuthHeaders(),
        includeInactive: true,
      });
      setHomepageCms(freshCms);
      const nextHeroDrafts = freshCms.hero_banners.length ? freshCms.hero_banners : [defaultHeroDraft];
      setHeroDrafts(nextHeroDrafts);
      setSelectedHeroId(nextHeroDrafts[0]?.id ?? defaultHeroDraft.id);
      setDeletedHeroIds([]);
      setCmsMessage(payload.message || "Homepage CMS saved.");
    } catch (error) {
      setCmsMessage(
        error instanceof Error
          ? error.message
          : "Homepage CMS could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const liveStats = useMemo(
    () =>
      stats.map((item) =>
        item.label === "Homepage module"
          ? { ...item, helper: "Loaded from local CMS meta", value: "Connected" }
          : item.label === "Merchandising areas"
            ? { ...item, value: String(cmsMeta.banners.length) }
            : item,
      ),
    [cmsMeta.banners.length],
  );
  const liveSectionBlocks = cmsMeta.banners.map((banner, index) => ({
    description: banner.text,
    label: banner.title,
    placement: index === 0 ? "Hero" : "Campaign",
    status: "Live",
  }));
  const liveProductRows = cmsMeta.banners.map((banner) => [
    banner.title,
    "CMS",
    banner.link,
    "Hero banner",
    "Live",
  ]);
  const liveHomepageSections = homepageCms.hero_banners.map((banner, index) => ({
    description: banner.subtitle,
    label: banner.title,
    placement: index === 0 ? "Hero" : "Campaign",
    status: banner.status === "active" ? "Live" : "Inactive",
  }));
  const homepageProductRows = editorPickIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ["Product ID " + id, "CMS", "Selected", "Editor Picks", "Live"]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
            <div className="rounded-[1.75rem] bg-[#5E7F85] p-6 text-white">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
                Storefront CMS
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Homepage CMS
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/80">
                Control room for the live homepage hero, offers and editor
                picks. Hero banners save to the local PHP/MySQL banners table.
                Discovery blocks, routine sections and full-page publish tools
                remain disabled.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="default">Live metadata</Badge>
                <Badge tone="default">Admin shell preserved</Badge>
                <Badge tone="default">Storefront CMS active</Badge>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-stone-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Publish Status
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Connected to CMS meta
                  </h2>
                </div>
                <Badge tone="good">Live save</Badge>
              </div>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  Active hero banners appear on the storefront in sort order.
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  Inactive, draft and deleted hero banners stay hidden from shoppers.
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isSaving}
                  onClick={saveHomepageCms}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save Homepage"}
                </button>
                  <DisabledButton>Preview panel only</DisabledButton>
              </div>
              {cmsMessage ? (
                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                  {cmsMessage}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {liveStats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Homepage Sections
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Storefront Layout Control
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Hero, offer and editor pick fields save live. Hero order is
                    controlled by Move Up, Move Down and Hero Sort. Full-page
                    section reorder is coming later.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <DisabledButton>Section reorder coming later</DisabledButton>
                  <DisabledButton primary>Full publish coming later</DisabledButton>
                </div>
              </div>
              <div>
                {(liveHomepageSections.length
                  ? liveHomepageSections
                  : liveSectionBlocks.length
                    ? liveSectionBlocks
                    : sectionBlocks
                ).map((item) => (
                  <SectionStatusRow key={item.label} {...item} />
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Product Management
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Homepage Product Slots
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">Catalog</Badge>
                  <DisabledButton>Filter coming later</DisabledButton>
                  <DisabledButton>Export coming later</DisabledButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-stone-50 text-slate-500">
                    <tr>
                      {["Product", "Brand", "Price", "Homepage Slot", "Status"].map(
                        (head) => (
                          <th key={head} className="px-5 py-4 font-medium">
                            {head}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(homepageProductRows.length
                      ? homepageProductRows
                      : liveProductRows.length
                        ? liveProductRows
                        : productRows
                    ).map((row) => (
                      <tr
                        className="border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]"
                        key={row[0]}
                      >
                        {row.map((cell, index) => (
                          <td className="px-5 py-4 text-slate-700" key={cell}>
                        {index === row.length - 1 ? (
                              <Badge tone={cell === "Live" ? "good" : "warn"}>
                                {cell}
                              </Badge>
                            ) : (
                              <span
                                className={
                                  index === 0 ? "font-semibold text-slate-900" : ""
                                }
                              >
                                {cell}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Homepage CMS Editor
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Live Campaign Controls
              </h3>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Hero Slides
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        Add, edit, reorder and hide hero banners from the banners table.
                      </div>
                    </div>
                    <button
                      className="rounded-2xl bg-[#5E7F85] px-4 py-2.5 text-xs font-bold text-white"
                      onClick={addHeroDraft}
                      type="button"
                    >
                      Add Hero
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {heroDrafts.map((hero) => (
                      <button
                        className={`rounded-full px-3 py-2 text-xs font-bold ${
                          hero.id === selectedHeroDraft.id
                            ? "bg-[#5E7F85] text-white"
                            : "bg-white text-slate-600"
                        }`}
                        key={hero.id}
                        onClick={() => setSelectedHeroId(hero.id)}
                        type="button"
                      >
                        {hero.title || `Hero ${hero.sort_order || hero.id}`}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600"
                      onClick={() => moveSelectedHeroDraft(-1)}
                      type="button"
                    >
                      Move Up
                    </button>
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600"
                      onClick={() => moveSelectedHeroDraft(1)}
                      type="button"
                    >
                      Move Down
                    </button>
                    <button
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700"
                      onClick={deleteSelectedHeroDraft}
                      type="button"
                    >
                      Delete Hero
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                    Active heroes show on the storefront in sort order. Inactive
                    and draft heroes are saved but hidden. Delete marks an
                    existing hero as deleted so it no longer appears here.
                  </div>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Hero Title
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                    onChange={(event) =>
                      updateSelectedHeroDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    value={selectedHeroDraft.title}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Hero Subtitle
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                    onChange={(event) =>
                      updateSelectedHeroDraft((current) => ({
                        ...current,
                        subtitle: event.target.value,
                      }))
                    }
                    value={selectedHeroDraft.subtitle}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Hero CTA / Link / Image
                  <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">
                    Use a real route for the CTA. Leave CTA text blank to hide
                    the button. Use a wide centered image to avoid mobile crop
                    issues.
                  </span>
                  <div className="mt-2 grid gap-2">
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        updateSelectedHeroDraft((current) => ({
                          ...current,
                          cta_text: event.target.value,
                        }))
                      }
                      placeholder="CTA text"
                      value={selectedHeroDraft.cta_text}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        updateSelectedHeroDraft((current) => ({
                          ...current,
                          link: event.target.value,
                        }))
                      }
                      placeholder="/products"
                      value={selectedHeroDraft.link}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        updateSelectedHeroDraft((current) => ({
                          ...current,
                          image_url: event.target.value,
                        }))
                      }
                      placeholder="/hero-slide-1.jpg"
                      value={selectedHeroDraft.image_url ?? ""}
                    />
                  </div>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Hero Status
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        updateSelectedHeroDraft((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      value={selectedHeroDraft.status}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Hero Sort
                    <input
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      min={0}
                      onChange={(event) =>
                        updateSelectedHeroDraft((current) => ({
                          ...current,
                          sort_order: Number(event.target.value) || 0,
                        }))
                      }
                      type="number"
                      value={selectedHeroDraft.sort_order}
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Offer Title
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                    onChange={(event) =>
                      setOfferDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    value={offerDraft.title}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Offer Subtitle / Link / Image
                  <div className="mt-2 grid gap-2">
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        setOfferDraft((current) => ({
                          ...current,
                          subtitle: event.target.value,
                        }))
                      }
                      value={offerDraft.subtitle}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        setOfferDraft((current) => ({
                          ...current,
                          link: event.target.value,
                        }))
                      }
                      value={offerDraft.link}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        setOfferDraft((current) => ({
                          ...current,
                          image_url: event.target.value,
                        }))
                      }
                      placeholder="/offer-bogo.jpg"
                      value={offerDraft.image_url ?? ""}
                    />
                  </div>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Offer Status
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      onChange={(event) =>
                        setOfferDraft((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      value={offerDraft.status}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Offer Sort
                    <input
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                      min={0}
                      onChange={(event) =>
                        setOfferDraft((current) => ({
                          ...current,
                          sort_order: Number(event.target.value) || 0,
                        }))
                      }
                      type="number"
                      value={offerDraft.sort_order}
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Editor Picks
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                    onChange={(event) => setEditorPickIds(event.target.value)}
                    placeholder="2,5,9,12"
                    value={editorPickIds}
                  />
                </label>
                <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Product selector
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                    {productOptions.length > 0 ? (
                      productOptions.map((product) => (
                        <label
                          className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                          key={product.id}
                        >
                          <input
                            checked={selectedEditorPickIds.includes(product.id)}
                            onChange={() => toggleEditorPick(product.id)}
                            type="checkbox"
                          />
                          <span>{product.name}</span>
                          <span className="ml-auto text-xs text-slate-400">
                            #{product.id}
                          </span>
                        </label>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-slate-500">
                        Live products will appear here after catalog items are published.
                      </div>
                    )}
                  </div>
                  {unknownEditorPickIds.length > 0 ? (
                    <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                      Unknown saved IDs: {unknownEditorPickIds.join(", ")}
                    </div>
                  ) : null}
                </div>
                <button
                  className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isSaving}
                  onClick={saveHomepageCms}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save CMS"}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Static Storefront Preview
                  </div>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Homepage Skeleton
                  </h3>
                </div>
                <Badge tone="warn">Static preview</Badge>
              </div>
              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-stone-50">
                <div className="bg-[#5E7F85] p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Hero banner
                  </div>
                  <div className="mt-2 text-2xl font-black">
                    Glow routine starts here
                  </div>
                  <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                    Shop Now
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {previewProducts.map((product) => (
                    <div
                      className="rounded-2xl bg-white p-3 shadow-sm"
                      key={product}
                    >
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-stone-100 text-xs font-bold text-slate-400">
                        IMG
                      </div>
                      <div className="mt-2 text-xs font-bold leading-5 text-slate-800">
                        {product}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Homepage Controls
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Remaining Preview Controls
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  "Section reorder",
                  "Featured product picker UI",
                  "Category block mapping",
                  "Banner schedule",
                  "Full homepage publish",
                ].map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold"
                    key={item}
                  >
                    <span className="text-slate-700">{item}</span>
                    <Badge tone="default">Off</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                CMS Safety Note
              </div>
              <div className="mt-3 space-y-2">
                {safetyItems.map((item) => (
                  <div
                    className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
