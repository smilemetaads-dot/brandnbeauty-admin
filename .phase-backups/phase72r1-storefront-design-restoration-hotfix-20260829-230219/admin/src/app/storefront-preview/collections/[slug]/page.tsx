import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StorefrontProductCard } from "@/features/storefront-preview/StorefrontProductCard";
import { getPreviewCollection } from "@/features/storefront-preview/storefront-preview-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getPreviewCollection(decodeURIComponent(slug));
  return { title: `${collection?.seoTitle || collection?.title || "Collection"} · BrandnBeauty Preview`, description: collection?.seoDescription || collection?.description, robots: { follow: false, index: false } };
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getPreviewCollection(decodeURIComponent(slug));
  if (!collection) notFound();
  return <div><section className="relative min-h-[330px] overflow-hidden bg-[#e5efeb]"><>{collection.desktopImage || collection.mobileImage ? <Image alt="" className="object-cover" fill priority sizes="100vw" src={collection.desktopImage || collection.mobileImage} unoptimized/> : null}<div className="absolute inset-0 bg-gradient-to-r from-[#10211d]/75 via-[#10211d]/25 to-transparent"/></><div className="relative z-10 mx-auto flex min-h-[330px] max-w-7xl flex-col justify-end px-4 py-10 text-white sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">{collection.eyebrow || "Collection"}</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.05em] sm:text-5xl">{collection.title}</h1>{collection.description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{collection.description}</p> : null}</div></section><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#65756e]">{collection.products.length} products</p><Link href="/storefront-preview/collections" className="min-h-11 py-3 text-sm font-bold text-[#35666b]">All collections →</Link></div>{collection.products.length ? <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{collection.products.map((product) => <StorefrontProductCard key={product.id} product={product}/>)}</div> : <div className="mt-7 rounded-[24px] border border-dashed border-[#cdd9d4] bg-white px-5 py-20 text-center text-sm text-[#708079]">No active products are linked to this collection.</div>}</section></div>;
}
