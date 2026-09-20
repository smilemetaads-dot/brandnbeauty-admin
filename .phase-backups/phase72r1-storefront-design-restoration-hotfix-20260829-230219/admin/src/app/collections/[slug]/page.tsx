import type { Metadata } from "next";
import Link from "next/link";

import { CollectionArtwork } from "@/features/collections/CollectionArtwork";
import { getPublicCollection } from "@/features/collections/public-collection";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 60;

function money(value: number) {
  return `৳${Math.max(0, value).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getPublicCollection(slug);
  if (!collection) return { title: "Collection unavailable | BrandnBeauty", robots: { index: false, follow: false } };
  return {
    description: collection.seoDescription || collection.description || `Shop ${collection.title} at BrandnBeauty.`,
    title: collection.seoTitle || `${collection.title} | BrandnBeauty`,
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = await getPublicCollection(slug);

  if (!collection) {
    return <main className="min-h-screen bg-[#f7f9f7] px-5 py-20 text-[#18251f]"><section className="mx-auto max-w-2xl rounded-[28px] border border-[#dfe7e3] bg-white p-10 text-center shadow-[0_22px_70px_rgba(24,49,41,.06)]"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#547874]">BrandnBeauty collection</p><h1 className="mt-4 text-3xl font-bold tracking-[-.04em]">This collection is not available</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#74817b]">It may be unpublished or temporarily unavailable. No placeholder products have been added.</p><Link className="mt-7 inline-flex rounded-full bg-[#315b61] px-6 py-3 text-sm font-bold text-white" href="/products">Browse all products</Link></section></main>;
  }

  const heroImage = collection.desktopImage || collection.mobileImage;
  return <main className="min-h-screen bg-[#f7f9f7] text-[#18251f]">
    <header className="border-b border-[#e2e9e5] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link className="text-lg font-black tracking-[-.04em]" href="/">BrandnBeauty</Link><Link className="text-sm font-semibold text-[#54706a]" href="/products">All products</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:pt-12">
      <div className={`overflow-hidden rounded-[32px] border border-[#dce6e2] ${heroImage ? "relative min-h-[430px] bg-[#dfeae6]" : "bg-[#eaf1ee]"}`}>
        {heroImage ? <><CollectionArtwork alt={collection.title} className="object-cover" priority sizes="(max-width: 1280px) 100vw, 1280px" src={heroImage}/><div className="absolute inset-0 bg-gradient-to-r from-[#102c2a]/85 via-[#173a36]/55 to-transparent"/></> : null}
        <div className={`${heroImage ? "relative flex min-h-[430px] items-end" : ""} p-8 sm:p-12 lg:p-16`}><div className={`max-w-2xl ${heroImage ? "text-white" : "text-[#19322e]"}`}><p className={`text-xs font-extrabold uppercase tracking-[.2em] ${heroImage ? "text-white/70" : "text-[#517873]"}`}>{collection.eyebrow || "Curated by BrandnBeauty"}</p><h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">{collection.title}</h1>{collection.description ? <p className={`mt-5 max-w-xl text-base leading-7 ${heroImage ? "text-white/78" : "text-[#667a73]"}`}>{collection.description}</p> : null}<p className={`mt-7 text-sm font-bold ${heroImage ? "text-white/80" : "text-[#496b66]"}`}>{collection.products.length} {collection.products.length === 1 ? "product" : "products"}</p></div></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 pb-24"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#547874]">The edit</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Shop the collection</h2></div></div>
      {collection.products.length === 0 ? <div className="mt-8 rounded-[28px] border border-dashed border-[#cfdcd7] bg-white px-6 py-16 text-center"><h3 className="text-xl font-bold">Products are being curated</h3><p className="mt-2 text-sm text-[#74817b]">This collection is live, but no products have been published into it yet.</p><Link className="mt-6 inline-flex rounded-full border border-[#bfd0cb] px-5 py-2.5 text-sm font-bold text-[#315b61]" href="/products">Browse all products</Link></div> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{collection.products.map((product) => <article className="group overflow-hidden rounded-[24px] border border-[#dfe7e3] bg-white shadow-[0_12px_35px_rgba(25,52,44,.045)]" key={product.id}><Link href={product.slug ? `/products/${encodeURIComponent(product.slug)}` : "/products"}><div className="relative aspect-[4/5] overflow-hidden bg-[#edf2ef]">{product.image ? <CollectionArtwork alt={product.name} className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" src={product.image}/> : <div className="flex h-full items-center justify-center px-6 text-center text-xs font-bold uppercase tracking-[.14em] text-[#8a9993]">Image coming soon</div>}</div><div className="p-5"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#77908a]">{product.brand || "BrandnBeauty"}</p><h3 className="mt-2 min-h-12 text-base font-bold leading-6 text-[#263a33]">{product.name}</h3><div className="mt-5 flex items-center justify-between"><span className="text-lg font-black">{money(product.price)}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{product.stock > 0 ? "In stock" : "Out of stock"}</span></div></div></Link></article>)}</div>}
    </section>
  </main>;
}
