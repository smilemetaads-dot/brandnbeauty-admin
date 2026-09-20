import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto flex min-h-[58vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span className="rounded-full bg-[#fff1d7] px-3 py-1.5 text-xs font-bold text-[#8a5809]">Unavailable product</span>
      <h1 className="mt-5 text-4xl font-black tracking-[-.05em]">This product is not available</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#687770]">It may be inactive, removed or using an old link. Draft and archived products are never exposed in the storefront preview.</p>
      <Link href="/storefront-preview/products" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#35666b] px-5 text-sm font-bold text-white">Browse available products</Link>
    </div>
  );
}

