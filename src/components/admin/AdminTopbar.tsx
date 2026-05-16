export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-sm font-semibold text-[#527B86] lg:hidden">
            BrandnBeauty Admin
          </div>
          <p className="text-sm text-slate-500">
            Catalog, orders, storefront, and operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-slate-800">
              Setup Mode
            </div>
            <div className="text-xs text-slate-500">Phase 1 catalog ready</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#527B86] text-sm font-semibold text-white">
            BN
          </div>
        </div>
      </div>
    </header>
  );
}
