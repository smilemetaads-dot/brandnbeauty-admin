"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  defaultHomepageCmsData,
  fetchCmsMeta,
  fetchHomepageCms,
  fetchHomepageCollectionOptions,
  type CmsReview,
  type HomepageCmsData,
  type HomepageCollectionOption,
} from "@/features/cms/cms-meta-client";
import { adminAuthHeaders } from "@/lib/admin-auth";

type BadgeTone = "good" | "warn" | "default" | "fixed";
type SectionStatus = "Ready" | "Needs Content" | "Hidden" | "Fixed Design" | "Automatic";

type SectionCard = {
  controlLocation: string;
  description: string;
  editHref?: string;
  editLabel?: string;
  helperText?: string;
  name: string;
  status: SectionStatus;
};

const storefrontHomeUrl = process.env.NEXT_PUBLIC_BNB_STOREFRONT_URL?.trim() || "/";

function Badge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  const className = {
    default: "bg-slate-100 text-slate-700",
    fixed: "bg-slate-900/5 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

function statusTone(status: SectionStatus): BadgeTone {
  if (status === "Ready") return "good";
  if (status === "Fixed Design") return "fixed";
  if (status === "Automatic") return "default";
  return "warn";
}

function SectionDashboardCard({ section }: { section: SectionCard }) {
  return (
    <article className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">{section.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p>
        </div>
        <Badge tone={statusTone(section.status)}>{section.status}</Badge>
      </div>

      <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Managed from</div>
        <div className="mt-1 text-sm font-bold text-slate-700">{section.controlLocation}</div>
        {section.helperText ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{section.helperText}</p> : null}
      </div>

      <div className="mt-auto pt-5">
        {section.editHref ? (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#4f747a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
            href={section.editHref}
          >
            {section.editLabel || "Edit"}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function getHeroStatus(homepageCms: HomepageCmsData): SectionStatus {
  const activeHeroes = homepageCms.hero_banners.filter((hero) => hero.status === "active");
  if (activeHeroes.length === 0) return "Hidden";
  return activeHeroes.some((hero) => !hero.image_url) ? "Needs Content" : "Ready";
}

function isOfferCurrentlyPublic(offer: HomepageCmsData["offer_cards"][number]) {
  const now = Date.now();
  const start = offer.start_at ? new Date(offer.start_at.replace(" ", "T")).getTime() : null;
  const end = offer.end_at ? new Date(offer.end_at.replace(" ", "T")).getTime() : null;

  if (offer.status !== "active" || !offer.image_url) return false;
  if (start && start > now) return false;
  if (end && end < now) return false;
  return true;
}

function getOfferStatus(homepageCms: HomepageCmsData): SectionStatus {
  if (homepageCms.offer_cards.some(isOfferCurrentlyPublic)) return "Ready";
  if (homepageCms.offer_cards.some((offer) => offer.image_url)) return "Hidden";
  return "Needs Content";
}

function getEditorPicksStatus(homepageCms: HomepageCmsData, collections: HomepageCollectionOption[]): SectionStatus {
  const selectedIds = homepageCms.editor_pick_collection_ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (selectedIds.length === 0) return "Needs Content";

  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
  return selectedIds.some((id) => collectionById.get(id)?.status === "active") ? "Ready" : "Hidden";
}

function isEnabledFlag(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return ["1", "true", "yes"].includes(value.trim().toLowerCase());
  return false;
}

function getRealResultsStatus(reviews: CmsReview[]): SectionStatus {
  if (reviews.length === 0) return "Needs Content";

  return reviews.some((review) => String(review.status ?? "").toLowerCase() === "active" && isEnabledFlag(review.featured))
    ? "Ready"
    : "Hidden";
}

export function RealHomepageCmsPage() {
  const [homepageCms, setHomepageCms] = useState<HomepageCmsData>(defaultHomepageCmsData);
  const [collectionOptions, setCollectionOptions] = useState<HomepageCollectionOption[]>([]);
  const [cmsReviews, setCmsReviews] = useState<CmsReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchHomepageCms(controller.signal, {
        headers: adminAuthHeaders(),
        includeInactive: true,
      }),
      fetchHomepageCollectionOptions(controller.signal, adminAuthHeaders()),
      fetchCmsMeta(controller.signal),
    ])
      .then(([homepage, collections, cmsMeta]) => {
        setHomepageCms(homepage);
        setCollectionOptions(collections);
        setCmsReviews(cmsMeta.reviews);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLoadMessage(error instanceof Error ? error.message : "Homepage status could not be refreshed.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);


  const refreshStatus = () => {
    setIsLoading(true);
    setLoadMessage("");
    setRefreshKey((current) => current + 1);
  };
  const sections = useMemo<SectionCard[]>(
    () => [
      {
        controlLocation: "Hero Banner Manager",
        description: "Manage the top homepage carousel content and visibility.",
        editHref: "/homepage-cms/hero",
        editLabel: "Manage Hero Banners",
        helperText: "Homepage hero slides are managed from the focused Hero Banner Manager.",
        name: "Hero Banners",
        status: getHeroStatus(homepageCms),
      },
      {
        controlLocation: "Offers Manager",
        description: "Manage promotional artwork, visibility, schedule and display order.",
        editHref: "/offers",
        editLabel: "Manage Offers",
        helperText: "Homepage offers are managed from the dedicated Offers Manager.",
        name: "Special Offers",
        status: getOfferStatus(homepageCms),
      },
      {
        controlLocation: "Categories Manager",
        description: "Manage the categories shown on the homepage.",
        editHref: "/categories",
        editLabel: "Manage Categories",
        helperText: "The homepage uses active root categories from Categories Manager.",
        name: "Shop by Category",
        status: "Ready",
      },
      {
        controlLocation: "Concerns Manager",
        description: "Manage the concerns shown on the homepage.",
        editHref: "/concerns",
        editLabel: "Manage Concerns",
        helperText: "The homepage uses active concerns from Concerns Manager.",
        name: "Shop by Concern",
        status: "Ready",
      },
      {
        controlLocation: "Brands Manager",
        description: "Manage the brands shown on the homepage.",
        editHref: "/brands",
        editLabel: "Manage Brands",
        helperText: "The homepage uses active brands from Brands Manager.",
        name: "Featured Brands",
        status: "Ready",
      },
      {
        controlLocation: "Products Manager",
        description: "Homepage products are currently selected automatically from active public products.",
        editHref: "/products",
        editLabel: "Manage Products",
        helperText: "Edit product visibility and information from Products Manager.",
        name: "Featured Products",
        status: "Automatic",
      },
      {
        controlLocation: "Editor's Picks Manager",
        description: "Choose the collections shown in the homepage Editor's Picks section.",
        editHref: "/homepage-cms/editor-picks",
        editLabel: "Manage Editor's Picks",
        helperText: "Collections Manager controls collection title, image, products, status and public availability.",
        name: "Editor's Picks",
        status: getEditorPicksStatus(homepageCms, collectionOptions),
      },
      {
        controlLocation: "Reviews & Real Results",
        description: "Manage customer result stories, images, videos and related products.",
        editHref: "/reviews",
        editLabel: "Manage Real Results",
        helperText: "Only active stories marked to show on the homepage appear in this section.",
        name: "Real Results",
        status: getRealResultsStatus(cmsReviews),
      },
      {
        controlLocation: "Frontend controlled",
        description: "Displays the fixed trust and service highlights shown near the bottom of the homepage.",
        helperText: "This section currently uses a fixed approved design and is not editable from the admin panel.",
        name: "Trust Benefits",
        status: "Fixed Design",
      },
    ],
    [cmsReviews, collectionOptions, homepageCms],
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 xl:grid-cols-[1.35fr_0.65fr] xl:items-stretch">
            <div className="rounded-[1.75rem] bg-[#5E7F85] p-6 text-white">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Storefront CMS</div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">Homepage Manager</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/85">
                Manage the content and sections shown on the BrandnBeauty homepage.
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-[1.75rem] border border-slate-200 bg-stone-50 p-5">
              <div>
                <div className="text-sm font-bold text-slate-500">Homepage overview</div>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  {isLoading ? "Refreshing section status" : "Section controls"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This page is read-only. It points staff to the right place for each homepage section.
                </p>
                <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                  Each homepage section is managed from its dedicated area. Use the action button on a section to open the correct manager. Changes made in those managers update the homepage automatically.
                </p>
                {loadMessage ? <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{loadMessage}</div> : null}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#5E7F85] bg-white px-4 py-3 text-sm font-bold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85]"
                  href={storefrontHomeUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open Homepage
                </a>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#4f747a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5E7F85] disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isLoading}
                  onClick={refreshStatus}
                  type="button"
                >
                  {isLoading ? "Refreshing..." : "Refresh Status"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Homepage section dashboard" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <SectionDashboardCard key={section.name} section={section} />
          ))}
        </section>
      </div>
    </AdminShell>
  );
}