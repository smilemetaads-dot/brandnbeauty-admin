import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StorefrontProductCard } from "@/features/storefront-preview/StorefrontProductCard";
import { getPreviewProductDetail, money } from "@/features/storefront-preview/storefront-preview-data";

export const dynamic = "force-dynamic";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPreviewProductDetail(decodeURIComponent(slug));
  const product = detail?.product;
  return {
    title: product?.metaTitle || (product ? `${product.name} · BrandnBeauty Preview` : "Product unavailable · BrandnBeauty Preview"),
    description: product?.metaDescription || product?.shortDescription || "BrandnBeauty live product detail preview.",
    robots: { follow: false, index: false },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const detail = await getPreviewProductDetail(decodeURIComponent(slug));
  if (!detail) notFound();
  const { product, related } = detail;
  const available = product.available && product.stock > 0;
  const discounted = product.comparePrice !== null && product.comparePrice > product.price;
  const discountPercent = discounted ? Math.round((1 - product.price / product.comparePrice!) * 100) : 0;

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <nav aria-label="Breadcrumb" className="flex min-h-11 flex-wrap items-center gap-2 text-sm">
          <Link href="/storefront-preview/products" className="font-bold text-[#35666b]">Products</Link>
          <span className="text-[#9aa6a1]">/</span>
          {product.category ? <Link href={`/storefront-preview/products?category=${encodeURIComponent(product.category)}`} className="font-semibold text-[#65756e]">{product.category}</Link> : <span className="font-semibold text-[#65756e]">Product detail</span>}
        </nav>

        <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-[28px] border border-[#e1e8e4] bg-[#eef4f1]">
            {product.image ? <Image alt={product.name} className="object-contain p-6 sm:p-10" fill priority sizes="(max-width: 1023px) 92vw, 45vw" src={product.image} unoptimized/> : <div className="flex h-full items-center justify-center text-sm text-[#71817a]">Product image not available</div>}
            <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ${available ? "bg-white text-[#35666b]" : "bg-[#fff1d7] text-[#8a5809]"}`}>{available ? "In stock" : "Out of stock"}</span>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6b7b74]">{product.brand || "Brand not set"}{product.category ? ` · ${product.category}` : ""}</p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-.05em] sm:text-5xl">{product.name}</h1>
            {product.shortDescription ? <p className="mt-4 text-base leading-7 text-[#5d6c66]">{product.shortDescription}</p> : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <strong className="text-3xl font-black text-[#35666b]">{money(product.price)}</strong>
              {discounted ? <><del className="text-base font-semibold text-[#8b9893]">{money(product.comparePrice!)}</del><span className="rounded-full bg-[#e8f3ef] px-2.5 py-1 text-xs font-bold text-[#35666b]">Save {discountPercent}%</span></> : null}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#dfe7e3] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#83908b]">Availability</p><p className="mt-2 text-sm font-bold">{available ? `${product.stock} in stock` : "Currently unavailable"}</p></div>
              <div className="rounded-2xl border border-[#dfe7e3] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#83908b]">SKU</p><p className="mt-2 truncate text-sm font-bold">{product.sku || "Not set"}</p></div>
            </div>

            <div className={`mt-6 rounded-[22px] border p-5 ${available ? "border-[#cfe1da] bg-[#eff7f4]" : "border-[#f0d895] bg-[#fff9e9]"}`}>
              <p className={`text-sm font-bold ${available ? "text-[#285f57]" : "text-[#815408]"}`}>{available ? "Ready for the controlled Phase 73 checkout bridge" : "This item cannot be added while stock is unavailable"}</p>
              <p className="mt-2 text-xs leading-5 text-[#6e766f]">This preview reads live stock but cannot reserve stock, create an order or send tracking events.</p>
              <span aria-disabled="true" className="mt-4 flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#dfe8e4] px-5 text-sm font-bold text-[#71817a]">{available ? "Checkout connects in Phase 73" : "Out of stock"}</span>
            </div>
          </div>
        </div>

        {product.description ? <section className="mt-10 rounded-[26px] border border-[#dfe7e3] bg-white p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#3b6c70]">Product details</p><div className="mt-4 whitespace-pre-line text-sm leading-7 text-[#4f5f58]">{product.description}</div></section> : null}
      </section>

      {related.length ? <section className="border-t border-[#e1e8e4] bg-[#f2f6f4]"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#3b6c70]">Continue discovering</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Related products</h2></div><Link href="/storefront-preview/products" className="min-h-11 py-3 text-sm font-bold text-[#35666b]">View all →</Link></div><div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{related.map((item) => <StorefrontProductCard key={item.id} product={item}/>)}</div></div></section> : null}
    </div>
  );
}

