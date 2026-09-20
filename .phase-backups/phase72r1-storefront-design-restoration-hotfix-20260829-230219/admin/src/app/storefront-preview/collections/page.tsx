import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getStorefrontPreviewSnapshot } from "@/features/storefront-preview/storefront-preview-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections · BrandnBeauty Preview", robots: { follow: false, index: false } };

export default async function CollectionsPage() {
  const snapshot = await getStorefrontPreviewSnapshot();
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#3b6c70]">Curated catalog</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Collections</h1><p className="mt-2 text-sm text-[#6c7a74]">Only active collections from the live MySQL feed appear here.</p>{snapshot.collections.length ? <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{snapshot.collections.map((collection) => <Link key={collection.id} href={collection.href} className="group overflow-hidden rounded-[26px] border border-[#dfe7e3] bg-white"><div className="relative aspect-[4/3] bg-[#eaf2ef]">{collection.desktopImage || collection.mobileImage ? <Image alt="" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" fill loading="lazy" sizes="(max-width: 639px) 92vw, 31vw" src={collection.desktopImage || collection.mobileImage} unoptimized/> : null}</div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#71817a]">{collection.eyebrow || `${collection.productCount} products`}</p><h2 className="mt-2 text-xl font-black tracking-[-.03em]">{collection.title}</h2>{collection.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66766f]">{collection.description}</p> : null}</div></Link>)}</div> : <div className="mt-9 rounded-[24px] border border-dashed border-[#cdd9d4] bg-white px-5 py-20 text-center text-sm text-[#708079]">No active collections are available. The preview never creates sample collections.</div>}</div>;
}
