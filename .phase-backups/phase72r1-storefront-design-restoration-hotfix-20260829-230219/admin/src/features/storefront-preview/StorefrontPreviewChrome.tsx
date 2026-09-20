"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { previewHref, type PreviewFooter, type PreviewNavigation } from "./storefront-preview-data";

function Icon({ name }: { name: "bag" | "close" | "home" | "menu" | "search" }) {
  const paths = {
    bag: <><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/></>,
    menu: <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  };
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name]}</svg>;
}

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return <Link href={previewHref(href)} onClick={onClick} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#34443d] hover:bg-[#eef4f1] hover:text-[#35666b]">{label}</Link>;
}

export function StorefrontPreviewChrome({ children, footer, navigation }: { children: React.ReactNode; footer: PreviewFooter; navigation: PreviewNavigation }) {
  const pathname = usePathname();
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const menuOpen = menuOpenedAt === pathname;
  const items = navigation.items.filter((item) => item.status === "active" || item.status === "published");
  const footerColumns = footer.columns.filter((column) => column.status === "active" || column.status === "published");

  return (
    <div className="min-h-screen bg-[#fbfcfb] text-[#17231f]">
      {navigation.announcement.enabled && navigation.announcement.text ? (
        <Link href={previewHref(navigation.announcement.link)} className="flex min-h-9 items-center justify-center bg-[#35666b] px-4 py-2 text-center text-[11px] font-semibold text-white">
          {navigation.announcement.text}
        </Link>
      ) : null}
      <header className={`${navigation.settings.sticky ? "sticky top-0" : ""} z-40 border-b border-[#e3e9e6] bg-white/95 backdrop-blur`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <button aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpenedAt(menuOpen ? null : pathname)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dce5e1] text-[#35666b] lg:hidden">
            <Icon name={menuOpen ? "close" : "menu"}/>
          </button>
          <Link href="/storefront-preview" className="min-w-0 shrink-0">
            <span className="block truncate text-lg font-black tracking-[-.04em] text-[#17231f] sm:text-xl">Brand<span className="text-[#35666b]">n</span>Beauty</span>
            <span className="hidden text-[8px] font-bold uppercase tracking-[.2em] text-[#81908a] sm:block">Mobile storefront preview</span>
          </Link>
          <nav aria-label="Primary navigation" className="ml-5 hidden min-w-0 flex-1 items-center gap-1 lg:flex">
            {items.slice(0, 6).map((item) => <NavLink key={item.id} href={item.link} label={item.label}/>) }
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            {navigation.settings.search ? <Link aria-label="Search products" href="/storefront-preview/products#product-search" className="flex h-11 w-11 items-center justify-center rounded-xl text-[#35666b] hover:bg-[#eef4f1]"><Icon name="search"/></Link> : null}
            {navigation.settings.cart ? <span aria-label="Cart becomes active in Phase 73" title="Cart becomes active in Phase 73" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef4f1] text-[#82918b]"><Icon name="bag"/></span> : null}
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-[#e3e9e6] bg-white px-4 pb-5 pt-3 lg:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl gap-1">
              <NavLink href="/" label="Home" onClick={() => setMenuOpenedAt(null)}/>
              <NavLink href="/products" label="All products" onClick={() => setMenuOpenedAt(null)}/>
              <NavLink href="/collections" label="Collections" onClick={() => setMenuOpenedAt(null)}/>
              {items.slice(0, 8).map((item) => <NavLink key={item.id} href={item.link} label={item.label} onClick={() => setMenuOpenedAt(null)}/>) }
            </nav>
          </div>
        ) : null}
      </header>
      <main className="pb-20 lg:pb-0">{children}</main>
      <footer className="border-t border-[#dfe7e3] bg-[#17231f] pb-20 text-white lg:pb-0">
        {footer.settings.trustStrip && footer.trustItems.some((item) => item.active) ? (
          <div className="border-b border-white/10">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
              {footer.trustItems.filter((item) => item.active).slice(0, 3).map((item) => <div key={item.id}><p className="text-sm font-bold">{item.label}</p><p className="mt-1 text-xs leading-5 text-white/60">{item.note}</p></div>)}
            </div>
          </div>
        ) : null}
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <p className="text-xl font-black">BrandnBeauty</p>
            {footer.brand.description ? <p className="mt-3 text-sm leading-6 text-white/65">{footer.brand.description}</p> : null}
            {footer.settings.contactBlock ? <div className="mt-4 space-y-1 text-sm text-white/70">{footer.brand.phone ? <p>{footer.brand.phone}</p> : null}{footer.brand.email ? <p>{footer.brand.email}</p> : null}{footer.brand.address ? <p>{footer.brand.address}</p> : null}</div> : null}
          </div>
          {footerColumns.slice(0, 3).map((column) => <div key={column.id}><p className="text-sm font-bold">{column.title}</p><div className="mt-3 grid gap-1">{column.links.filter((link) => link.status === "active" || link.status === "published").map((link) => <Link key={link.id} href={previewHref(link.url)} className="min-h-9 py-2 text-sm text-white/65 hover:text-white">{link.label}</Link>)}</div></div>)}
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 px-4 py-5 text-[11px] text-white/50 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <span>{footer.settings.copyright || "BrandnBeauty · Preview environment"}</span>
          <span>No live tracking · No checkout mutation</span>
        </div>
      </footer>
      <nav aria-label="Mobile shortcuts" className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-3 border-t border-[#dce5e1] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <Link href="/storefront-preview" className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#35666b]"><Icon name="home"/>Home</Link>
        <Link href="/storefront-preview/products" className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#35666b]"><Icon name="search"/>Products</Link>
        <span className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#82918b]"><Icon name="bag"/>Cart later</span>
      </nav>
    </div>
  );
}
