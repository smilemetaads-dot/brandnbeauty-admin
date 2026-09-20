import Image from "next/image";
import Link from "next/link";

import { StorefrontProductCard } from "@/features/storefront-preview/StorefrontProductCard";
import { getStorefrontPreviewSnapshot, money, previewHref } from "@/features/storefront-preview/storefront-preview-data";

export const dynamic = "force-dynamic";

function EmptyBlock({ message }: { message: string }) {
  return <div className="rounded-[24px] border border-dashed border-[#cdd9d4] bg-white px-5 py-12 text-center text-sm text-[#708079]">{message}</div>;
}

export default async function StorefrontPreviewPage() {
  const snapshot = await getStorefrontPreviewSnapshot();
  const hero = snapshot.heroes[0];
  const featuredProducts = snapshot.products.slice(0, snapshot.homepage.sections[0]?.displayLimit || 8);

  return (
    <div>
      <section className="relative overflow-hidden bg-[#eaf2ef]">
        <div className="relative mx-auto min-h-[470px] max-w-7xl sm:min-h-[500px] lg:min-h-[560px]">
          {hero?.desktopImage || hero?.mobileImage ? (
            <>
              <Image alt="" aria-hidden="true" className="hidden object-cover sm:block" fill priority sizes="100vw" src={hero.desktopImage || hero.mobileImage} unoptimized/>
              <Image alt="" aria-hidden="true" className="object-cover sm:hidden" fill priority sizes="100vw" src={hero.mobileImage || hero.desktopImage} unoptimized/>
              <div className="absolute inset-0 bg-gradient-to-r from-[#10211d]/80 via-[#10211d]/45 to-transparent"/>
            </>
          ) : <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#d5e8e2,transparent_42%),linear-gradient(135deg,#edf5f2,#dfece8)]"/>}
          <div className="relative z-10 flex min-h-[470px] max-w-2xl flex-col justify-end px-4 pb-12 pt-24 text-white sm:min-h-[500px] sm:px-6 lg:min-h-[560px] lg:justify-center lg:px-8 lg:pb-16">
            <p className={`text-xs font-bold uppercase tracking-[.2em] ${hero?.desktopImage || hero?.mobileImage ? "text-white/75" : "text-[#35666b]"}`}>Live catalog · mobile preview</p>
            <h1 className={`mt-4 text-4xl font-black leading-[1.05] tracking-[-.05em] sm:text-5xl lg:text-6xl ${hero?.desktopImage || hero?.mobileImage ? "text-white" : "text-[#17231f]"}`}>{hero?.title || snapshot.homepage.pageTitle || "BrandnBeauty storefront"}</h1>
            {(hero?.subtitle || snapshot.homepage.pageSubtitle) ? <p className={`mt-4 max-w-xl text-base leading-7 sm:text-lg ${hero?.desktopImage || hero?.mobileImage ? "text-white/80" : "text-[#586861]"}`}>{hero?.subtitle || snapshot.homepage.pageSubtitle}</p> : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={previewHref(hero?.link || "/products")} className="flex min-h-12 items-center justify-center rounded-2xl bg-[#35666b] px-6 text-sm font-bold text-white shadow-lg shadow-[#173f42]/15">{hero?.ctaText || "Explore products"}</Link>
              <Link href="/storefront-preview/collections" className="flex min-h-12 items-center justify-center rounded-2xl border border-white/40 bg-white/90 px-6 text-sm font-bold text-[#253c37]">Browse collections</Link>
            </div>
          </div>
        </div>
      </section>

      {snapshot.offers.length ? <section className="border-b border-[#e4ebe7] bg-[#fff8e8]"><div className="mx-auto flex max-w-7xl snap-x gap-3 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">{snapshot.offers.slice(0, 4).map((offer) => <div key={offer.id} className="min-w-[260px] snap-start rounded-2xl border border-[#f0dfb8] bg-white px-4 py-3"><p className="text-xs font-bold text-[#925b08]">{offer.name || "Current offer"}</p><p className="mt-1 text-[11px] text-[#766b55]">{offer.summary || (offer.discountValue ? `${money(offer.discountValue)} offer value` : "Published promotion")}</p>{offer.code ? <span className="mt-2 inline-block rounded-lg bg-[#fff3d8] px-2 py-1 font-mono text-[10px] font-bold">{offer.code}</span> : null}</div>)}</div></section> : null}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#3b6c70]">Real MySQL catalog</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Shop products</h2></div><Link href="/storefront-preview/products" className="min-h-11 py-3 text-sm font-bold text-[#35666b]">View all →</Link></div>
        {featuredProducts.length ? <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{featuredProducts.map((product) => <StorefrontProductCard key={product.id} product={product}/>)}</div> : <div className="mt-7"><EmptyBlock message="No active live products are available yet. Add or activate products in the existing Product Catalog."/></div>}
      </section>

      <section className="bg-[#eef4f1]"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#3b6c70]">Curated discovery</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Collections</h2></div><Link href="/storefront-preview/collections" className="min-h-11 py-3 text-sm font-bold text-[#35666b]">View all →</Link></div>{snapshot.collections.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{snapshot.collections.slice(0, 6).map((collection) => <Link key={collection.id} href={collection.href} className="group relative min-h-[280px] overflow-hidden rounded-[26px] bg-[#dceae5] p-6"><>{collection.desktopImage || collection.mobileImage ? <Image alt="" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" fill loading="lazy" sizes="(max-width: 639px) 92vw, 31vw" src={collection.desktopImage || collection.mobileImage} unoptimized/> : null}<div className="absolute inset-0 bg-gradient-to-t from-[#10211d]/80 via-[#10211d]/15 to-transparent"/></><div className="relative z-10 flex h-full min-h-[232px] flex-col justify-end text-white"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">{collection.eyebrow || `${collection.productCount} products`}</p><h3 className="mt-2 text-2xl font-black tracking-[-.03em]">{collection.title}</h3><p className="mt-2 line-clamp-2 text-sm text-white/75">{collection.description}</p></div></Link>)}</div> : <div className="mt-7"><EmptyBlock message="No active live collections are available yet."/></div>}</div></section>

      {snapshot.reviews.length ? <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#3b6c70]">Verified evidence</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Real results</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{snapshot.reviews.slice(0, 6).map((review) => <article key={review.id} className="rounded-[24px] border border-[#e0e8e4] bg-white p-5"><p className="text-[#cb8b21]">{"★".repeat(review.rating)}<span className="text-[#d7dedb]">{"★".repeat(5-review.rating)}</span></p><p className="mt-4 text-sm leading-6 text-[#40504a]">{review.text}</p><div className="mt-5 flex items-center justify-between gap-3"><span className="text-xs font-bold">{review.customer || "Verified customer"}</span>{review.verified ? <span className="rounded-full bg-[#e8f8f0] px-2 py-1 text-[9px] font-bold text-[#168459]">Verified</span> : null}</div></article>)}</div></section> : null}
    </div>
  );
}
