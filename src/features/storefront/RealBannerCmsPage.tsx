"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  defaultHomepageCmsData,
  fetchHomepageCms,
  type HomepageCmsData,
  type HomepageHeroBanner,
  type HomepageOfferCard,
} from "@/features/cms/cms-meta-client";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiAssetUrl } from "@/lib/bnb-api";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

const storefrontHomeUrl =
  process.env.NEXT_PUBLIC_BNB_STOREFRONT_URL?.trim() ||
  "https://brandnbeauty.com";

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
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function assetUrl(value: string | null | undefined) {
  return bnbApiAssetUrl(value, null) || "";
}

function heroTone(status: string): BadgeTone {
  if (status === "active") return "good";
  if (status === "draft") return "warn";
  if (status === "deleted") return "bad";
  return "default";
}

function offerState(offer: HomepageOfferCard) {
  if (offer.status !== "active") {
    return { label: offer.status || "inactive", tone: "default" as BadgeTone };
  }

  const now = Date.now();
  const startValue = offer.start_at || offer.starts_at || null;
  const endValue = offer.end_at || offer.ends_at || null;
  const start = startValue
    ? new Date(startValue.replace(" ", "T")).getTime()
    : null;
  const end = endValue
    ? new Date(endValue.replace(" ", "T")).getTime()
    : null;

  if (start && start > now) return { label: "scheduled", tone: "warn" as BadgeTone };
  if (end && end < now) return { label: "expired", tone: "bad" as BadgeTone };
  return { label: "active", tone: "good" as BadgeTone };
}

function Artwork({
  image,
  title,
}: {
  image: string | null | undefined;
  title: string;
}) {
  const src = assetUrl(image);

  return (
    <div className="relative flex aspect-[16/7] min-h-28 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
      {src ? (
        <img
          alt={title || "Banner artwork"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          src={src}
        />
      ) : null}
      <span className="px-4 text-center">
        {src ? "Artwork preview" : "Artwork missing"}
      </span>
    </div>
  );
}

function HeroRow({ hero }: { hero: HomepageHeroBanner }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <Artwork image={hero.image_url} title={hero.title} />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-black text-slate-950">
            {hero.title || `Hero #${hero.id}`}
          </div>
          <div className="mt-1 truncate text-xs font-semibold text-slate-500">
            {hero.link || "/products"}
          </div>
        </div>
        <Badge tone={heroTone(hero.status)}>{hero.status || "inactive"}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
        <span>Order {hero.sort_order || 0}</span>
        <span>•</span>
        <span>{hero.image_url ? "Desktop artwork ready" : "Desktop artwork missing"}</span>
      </div>
    </article>
  );
}

function OfferRow({ offer }: { offer: HomepageOfferCard }) {
  const state = offerState(offer);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <Artwork image={offer.image_url} title={offer.title} />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-black text-slate-950">
            {offer.title || `Offer #${offer.id}`}
          </div>
          <div className="mt-1 truncate text-xs font-semibold text-slate-500">
            {offer.link || "/products"}
          </div>
        </div>
        <Badge tone={state.tone}>{state.label}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
        <span>Order {offer.sort_order || 0}</span>
        <span>•</span>
        <span>{offer.image_url ? "Artwork ready" : "Artwork missing"}</span>
      </div>
    </article>
  );
}

export function RealBannerCmsPage() {
  const [homepageCms, setHomepageCms] =
    useState<HomepageCmsData>(defaultHomepageCmsData);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setMessage("");

    fetchHomepageCms(controller.signal, {
      headers: adminAuthHeaders(),
      includeInactive: true,
    })
      .then(setHomepageCms)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Banner data could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const stats = useMemo(() => {
    const heroes = homepageCms.hero_banners.filter(
      (item) => item.status !== "deleted",
    );
    const offers = homepageCms.offer_cards.filter(
      (item) => item.status !== "deleted",
    );
    const activeHeroes = heroes.filter((item) => item.status === "active");
    const publicOffers = offers.filter(
      (item) => offerState(item).label === "active",
    );
    const missingArtwork =
      heroes.filter((item) => !item.image_url).length +
      offers.filter((item) => !item.image_url).length;

    return {
      activeHeroes: activeHeroes.length,
      heroes: heroes.length,
      missingArtwork,
      offers: offers.length,
      publicOffers: publicOffers.length,
    };
  }, [homepageCms]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 xl:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[1.75rem] bg-[#5E7F85] p-6 text-white">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                Storefront media control
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Banner CMS
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/85">
                Live overview of homepage hero banners and special-offer artwork.
                Editing stays in the dedicated production managers so there is
                one source of truth for save, upload, schedule and publish.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="good">Live data</Badge>
                <Badge tone="good">Production managers connected</Badge>
                <Badge tone="brand">No duplicate write path</Badge>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-stone-50 p-5">
              <div className="text-sm font-bold text-slate-500">Quick actions</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-black text-white"
                  href="/homepage-cms/hero"
                >
                  Manage Hero Banners
                </a>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-black text-white"
                  href="/offers"
                >
                  Manage Offers
                </a>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                  href="/homepage-cms"
                >
                  Homepage Manager
                </a>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                  href={storefrontHomeUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open Storefront
                </a>
              </div>
              <button
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#5E7F85] bg-white px-4 py-3 text-sm font-black text-[#5E7F85] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
                onClick={() => setRefreshKey((value) => value + 1)}
                type="button"
              >
                {loading ? "Refreshing..." : "Refresh CMS Status"}
              </button>
            </div>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800">
            {message}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Hero banners", stats.heroes],
            ["Active heroes", stats.activeHeroes],
            ["Offer cards", stats.offers],
            ["Public offers", stats.publicOffers],
            ["Missing artwork", stats.missingArtwork],
          ].map(([label, value]) => (
            <div
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              key={label}
            >
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </div>
              <div className="mt-3 text-2xl font-black text-slate-950">
                {loading ? "..." : value}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Homepage hero
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Hero banner status
                </h2>
              </div>
              <a
                className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-black text-[#5E7F85]"
                href="/homepage-cms/hero"
              >
                Edit heroes
              </a>
            </div>

            <div className="mt-5 grid gap-4">
              {homepageCms.hero_banners.length ? (
                homepageCms.hero_banners
                  .filter((item) => item.status !== "deleted")
                  .sort(
                    (first, second) =>
                      first.sort_order - second.sort_order ||
                      Number(first.id) - Number(second.id),
                  )
                  .map((hero) => <HeroRow hero={hero} key={hero.id} />)
              ) : (
                <div className="rounded-2xl bg-stone-50 p-6 text-sm font-semibold text-slate-500">
                  No hero banners are currently returned by the homepage CMS.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  Special offers
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Offer artwork status
                </h2>
              </div>
              <a
                className="rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-black text-[#5E7F85]"
                href="/offers"
              >
                Edit offers
              </a>
            </div>

            <div className="mt-5 grid gap-4">
              {homepageCms.offer_cards.length ? (
                homepageCms.offer_cards
                  .filter((item) => item.status !== "deleted")
                  .sort(
                    (first, second) =>
                      first.sort_order - second.sort_order ||
                      Number(first.id) - Number(second.id),
                  )
                  .map((offer) => <OfferRow key={offer.id} offer={offer} />)
              ) : (
                <div className="rounded-2xl bg-stone-50 p-6 text-sm font-semibold text-slate-500">
                  No special offers are currently returned by the homepage CMS.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#5E7F85]/20 bg-[#5E7F85]/5 p-6 shadow-sm">
          <div className="text-sm font-black text-[#5E7F85]">
            Production source of truth
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              [
                "Hero save & publish",
                "Hero Banner Manager → update_homepage_cms.php",
              ],
              ["Hero/offer uploads", "Production media upload endpoint"],
              ["Offer create/edit/schedule", "Special Offers Manager"],
              ["Storefront rendering", "get_homepage_cms.php + live asset resolver"],
            ].map(([label, value]) => (
              <div className="rounded-2xl bg-white px-4 py-4" key={label}>
                <div className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                  {label}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-700">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
