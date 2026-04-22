type AdminTopbarProps = {
  title?: string;
};

export default function AdminTopbar({
  title = "Dashboard",
}: AdminTopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
          Admin
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h2>
      </div>

      <button
        type="button"
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Admin
      </button>
    </header>
  );
}
