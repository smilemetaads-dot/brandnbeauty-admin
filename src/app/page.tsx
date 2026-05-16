import { AdminShell } from "@/components/admin/AdminShell";

export default function Home() {
  const setupCards = [
    {
      label: "Supabase connected",
      value: "Verified",
      detail: "Health route returned a connected response.",
    },
    {
      label: "Phase 1 tables applied",
      value: "Applied",
      detail: "Core catalog tables are available in Supabase.",
    },
    {
      label: "Seed data applied",
      value: "Applied",
      detail: "Starter settings, categories, concerns, and brands are ready.",
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-[#527B86]">
              Zero Start SOP
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Welcome to BrandnBeauty Admin
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              The admin foundation is ready for catalog, order, storefront,
              customer, supplier, and finance workflows.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {setupCards.map((card) => (
            <article
              key={card.label}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-medium text-slate-500">
                  {card.label}
                </h2>
                <span className="rounded-md bg-[#527B86]/10 px-2 py-1 text-xs font-semibold text-[#527B86]">
                  {card.value}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-[#527B86]/25 bg-white p-5">
          <p className="text-sm font-semibold text-[#527B86]">Next step</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            Build catalog pages
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Start with categories, concerns, brands, and products using the
            Phase 1 schema already applied in Supabase.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
