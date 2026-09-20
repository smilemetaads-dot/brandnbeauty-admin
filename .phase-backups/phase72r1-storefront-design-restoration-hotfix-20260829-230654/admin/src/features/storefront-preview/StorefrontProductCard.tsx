import Image from "next/image";
import Link from "next/link";

import { money, type PreviewProduct } from "./storefront-preview-data";

export function StorefrontProductCard({ product }: { product: PreviewProduct }) {
  const href = `/storefront-preview/products/${encodeURIComponent(product.slug)}`;
  const available = product.available && product.stock > 0;
  const discounted = product.comparePrice !== null && product.comparePrice > product.price;

  return (
    <article className="group min-w-0">
      <Link href={href} className="block overflow-hidden rounded-[22px] border border-[#e2e9e5] bg-[#f3f7f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35666b]">
        <div className="relative aspect-[4/5] overflow-hidden">
          {product.image ? (
            <Image
              alt={product.name}
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
              fill
              loading="lazy"
              sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 22vw"
              src={product.image}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-[#82918b]">Product image not available</div>
          )}
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${available ? "bg-white text-[#35666b]" : "bg-[#fff4df] text-[#9b6208]"}`}>
            {available ? "In stock" : "Out of stock"}
          </span>
          {discounted ? <span className="absolute right-3 top-3 rounded-full bg-[#35666b] px-2.5 py-1 text-[10px] font-bold text-white">Offer</span> : null}
        </div>
      </Link>
      <div className="px-1 pb-1 pt-3">
        <p className="truncate text-[10px] font-bold uppercase tracking-[.13em] text-[#7c8a84]">{product.brand || product.category || "BrandnBeauty"}</p>
        <Link href={href} className="mt-1 line-clamp-2 block min-h-10 text-sm font-semibold leading-5 text-[#17231f] hover:text-[#35666b]">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-1.5"><strong className="text-base text-[#17231f]">{money(product.price)}</strong>{discounted ? <del className="truncate text-[10px] text-[#8b9893]">{money(product.comparePrice!)}</del> : null}</span>
          <span className="text-[10px] font-medium text-[#7c8a84]">View details</span>
        </div>
      </div>
    </article>
  );
}
