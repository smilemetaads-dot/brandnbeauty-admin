"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type BadgeTone = "brand" | "good" | "warn" | "bad" | "default";

type FooterLink = {
  href: string;
  label: string;
  sort_order: number;
  status: "active" | "inactive";
};

type FooterSocialLink = FooterLink & {
  aria_label: string;
};

type FooterGroup = {
  links: FooterLink[];
  sort_order: number;
  status: "active" | "inactive";
  title: string;
};

type FooterContent = {
  brand: {
    copyright: string;
    name: string;
  };
  groups: FooterGroup[];
  social_links: FooterSocialLink[];
};

const GET_FOOTER_ENDPOINT = bnbApiUrl("get_footer.php");
const UPDATE_FOOTER_ENDPOINT = bnbApiUrl("update_footer.php");

const fallbackFooterContent: FooterContent = {
  brand: {
    copyright: "Copyright © 2026 BrandnBeauty. All rights reserved.",
    name: "BrandnBeauty",
  },
  groups: [
  {
    links: [
      { label: "Categories", href: "/category/skincare", sort_order: 1, status: "active" },
      { label: "Concerns", href: "/concern/acne", sort_order: 2, status: "active" },
      { label: "Brands", href: "/brand/brandnbeauty", sort_order: 3, status: "active" },
      { label: "Best Sellers", href: "/products", sort_order: 4, status: "active" },
      { label: "Offers", href: "/products", sort_order: 5, status: "active" },
    ],
    sort_order: 1,
    status: "active",
    title: "Explore",
  },
  {
    links: [
      { label: "Order confirmation after checkout", href: "", sort_order: 1, status: "active" },
      { label: "Customer care details are shared with confirmed orders", href: "", sort_order: 2, status: "active" },
    ],
    sort_order: 2,
    status: "active",
    title: "Support",
  },
  {
    links: [
      { label: "Privacy Policy coming later", href: "", sort_order: 1, status: "active" },
      { label: "Terms & Conditions coming later", href: "", sort_order: 2, status: "active" },
      { label: "Refund Policy coming later", href: "", sort_order: 3, status: "active" },
      { label: "Shipping Policy coming later", href: "", sort_order: 4, status: "active" },
    ],
    sort_order: 3,
    status: "active",
    title: "Policies",
  },
  ],
  social_links: [],
};

const trust = [
  "Authenticity Checked",
  "Verified Brand Listings",
  "Ingredient-Led Routines",
  "Support Info Available",
] as const;

const stats = [
  ["Footer Groups", "3", "Explore, support, policies"],
  ["Footer Links", "13", "Saved links"],
  ["Trust Items", "4", "Bottom trust strip"],
  ["Social Icons", "0+", "Only real URLs render"],
] as const;

const detailPanels = [
  {
    description: "Brand name, copyright copy and verified social handles.",
    label: "Brand Block",
    status: "Live footer",
  },
  {
    description: "Neutral support labels are shown until real support routes are configured.",
    label: "Contact & Support",
    status: "Live footer",
  },
  {
    description: "Policy labels are visible without fake links until policy routes exist.",
    label: "Legal Links",
    status: "Live footer",
  },
] as const;

const safetyItems = [
  "Footer links and social icons save through the local PHP/MySQL settings table.",
  "Active groups and active links appear on the storefront; inactive entries stay saved but hidden.",
  "Blank hrefs render as labels only; #, javascript/data/vbscript links and placeholder social URLs are filtered.",
  "Only add real internal routes or verified external URLs that are ready for shoppers.",
  "Do not add unsupported contact, policy, newsletter or automation claims.",
] as const;

function isUnsafeFooterHref(href: string): boolean {
  const normalized = href.trim().toLowerCase();

  return normalized.startsWith("javascript:")
    || normalized.startsWith("data:")
    || normalized.startsWith("vbscript:");
}

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const className = {
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function DisabledButton({
  children,
  primary = false,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
          : "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
      }
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function normalizeFooterLink(link: unknown): FooterLink | null {
  if (!link || typeof link !== "object") return null;

  const record = link as Partial<FooterLink>;
  const label = typeof record.label === "string" ? record.label.trim() : "";
  const rawHref = typeof record.href === "string" && record.href.trim() ? record.href.trim() : "";
  const href = rawHref === "#" || isUnsafeFooterHref(rawHref) ? "" : rawHref;

  if (!label) return null;

  return {
    href,
    label,
    sort_order: Number(record.sort_order) || 0,
    status: record.status === "inactive" ? "inactive" : "active",
  };
}

function normalizeFooterSocial(link: unknown): FooterSocialLink | null {
  const normalized = normalizeFooterLink(link);
  if (!normalized || !link || typeof link !== "object") return null;

  const record = link as Partial<FooterSocialLink>;

  return {
    ...normalized,
    aria_label: typeof record.aria_label === "string" && record.aria_label.trim()
      ? record.aria_label.trim()
      : normalized.label,
  };
}

function normalizeFooterGroup(group: unknown): FooterGroup | null {
  if (!group || typeof group !== "object") return null;

  const record = group as Partial<FooterGroup>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const links = Array.isArray(record.links)
    ? record.links
        .map(normalizeFooterLink)
        .filter((link): link is FooterLink => Boolean(link))
    : [];

  if (!title || !links.length) return null;

  return {
    links,
    sort_order: Number(record.sort_order) || 0,
    status: record.status === "inactive" ? "inactive" : "active",
    title,
  };
}

function normalizeFooterContent(payload: unknown): FooterContent {
  if (!payload || typeof payload !== "object") {
    return fallbackFooterContent;
  }

  const record = payload as Partial<FooterContent>;
  const brand = record.brand && typeof record.brand === "object" ? record.brand : fallbackFooterContent.brand;
  const groups = Array.isArray(record.groups)
    ? record.groups
        .map(normalizeFooterGroup)
        .filter((group): group is FooterGroup => Boolean(group))
    : [];
  const socialLinks = Array.isArray(record.social_links)
    ? record.social_links
        .map(normalizeFooterSocial)
        .filter((link): link is FooterSocialLink => Boolean(link))
    : [];

  return {
    brand: {
      copyright: typeof brand.copyright === "string" && brand.copyright.trim()
        ? brand.copyright.trim()
        : fallbackFooterContent.brand.copyright,
      name: typeof brand.name === "string" && brand.name.trim()
        ? brand.name.trim()
        : fallbackFooterContent.brand.name,
    },
    groups: groups.length ? groups : fallbackFooterContent.groups,
    social_links: socialLinks.length ? socialLinks : fallbackFooterContent.social_links,
  };
}

function formatLinkLines(links: FooterLink[]) {
  return links
    .map((link) => `${link.label} | ${link.href} | ${link.status}`)
    .join("\n");
}

function parseLinkLines(value: string): FooterLink[] {
  return value.split("\n").reduce<FooterLink[]>((links, line, index) => {
    const [rawLabel, rawHref, rawStatus] = line.split("|").map((part) => part?.trim() ?? "");
    if (!rawLabel) return links;

    links.push({
      href: rawHref === "#" || isUnsafeFooterHref(rawHref) ? "" : rawHref,
      label: rawLabel,
      sort_order: index + 1,
      status: rawStatus === "inactive" ? "inactive" : "active",
    });

    return links;
  }, []);
}

function formatSocialLines(links: FooterSocialLink[]) {
  return links
    .map((link) => `${link.label} | ${link.href} | ${link.aria_label} | ${link.status}`)
    .join("\n");
}

function parseSocialLines(value: string): FooterSocialLink[] {
  return value.split("\n").reduce<FooterSocialLink[]>((links, line, index) => {
    const [rawLabel, rawHref, rawAriaLabel, rawStatus] = line.split("|").map((part) => part?.trim() ?? "");
    if (!rawLabel) return links;

    links.push({
      aria_label: rawAriaLabel || rawLabel,
      href: rawHref === "#" || isUnsafeFooterHref(rawHref) ? "" : rawHref,
      label: rawLabel,
      sort_order: index + 1,
      status: rawStatus === "inactive" ? "inactive" : "active",
    });

    return links;
  }, []);
}

function StatCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-sm font-black text-[#5E7F85]">
          FC
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

export function RealFooterCmsPage() {
  const [footerContent, setFooterContent] = useState<FooterContent>(fallbackFooterContent);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(GET_FOOTER_ENDPOINT, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          footer?: unknown;
          success?: boolean;
        };

        if (!response.ok || payload.success === false || !payload.footer) {
          return fallbackFooterContent;
        }

        return normalizeFooterContent(payload.footer);
      })
      .then(setFooterContent)
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Footer CMS data could not be loaded.", error);
        }
      });

    return () => controller.abort();
  }, []);

  const saveFooter = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(UPDATE_FOOTER_ENDPOINT, {
        body: JSON.stringify({ footer: footerContent }),
        headers: adminAuthHeaders({
          "Content-Type": "application/json",
        }),
        method: "POST",
      });
      const payload = (await response.json()) as {
        footer?: unknown;
        message?: string;
        success?: boolean;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Footer could not be saved.");
      }

      if (payload.footer) {
        setFooterContent(normalizeFooterContent(payload.footer));
      }

      setMessage(payload.message || "Footer saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Footer could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateGroup = (index: number, patch: Partial<FooterGroup>) => {
    setFooterContent((current) => ({
      ...current,
      groups: current.groups.map((group, groupIndex) =>
        groupIndex === index
          ? {
              ...group,
              ...patch,
            }
          : group,
      ),
    }));
  };

  const liveStats = useMemo(
    () =>
      stats.map(([label, value, helper]) =>
        label === "Trust Items"
          ? [label, "Coming later", "Bottom trust strip"]
          : label === "Footer Links"
            ? [label, String(footerContent.groups.reduce((total, group) => total + group.links.length, 0)), "Saved links"]
          : label === "Footer Groups"
            ? [label, String(footerContent.groups.length), "Saved columns"]
          : label === "Social Icons"
            ? [label, String(footerContent.social_links.length), "Saved social links"]
            : [label, value, helper],
      ),
    [footerContent.groups, footerContent.social_links.length],
  );
  const liveDetailPanels = footerContent.groups.slice(0, 3).map((group) => ({
    description: `${group.links.length} links saved in this footer column.`,
    label: group.title,
    status: group.status === "active" ? "Live footer" : "Inactive",
  }));

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {liveStats.map(([label, value, helper]) => (
            <StatCard
              helper={helper}
              key={label}
              label={label}
              value={value}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Storefront Footer
                  </div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Footer CMS
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Control footer brand name, copyright, link groups, link
                    status and social links through local PHP/MySQL settings.
                    Use blank hrefs for non-clickable labels and avoid # links
                    until a real storefront route exists.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DisabledButton>Preview coming later</DisabledButton>
                  <button
                    className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isSaving}
                    onClick={saveFooter}
                    type="button"
                  >
                    {isSaving ? "Saving..." : "Save Footer"}
                  </button>
                </div>
              </div>
              {message ? (
                <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  {message}
                </div>
              ) : null}

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#5E7F85] text-white shadow-sm">
                <div className="grid gap-5 border-b border-white/10 bg-white/10 p-4 md:grid-cols-4">
                  {trust.map((item) => (
                    <div
                      className="rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-semibold"
                      key={item}
                    >
                      OK {item}
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                  <div>
                    <div className="text-2xl font-black">{footerContent.brand.name}</div>
                    <p className="mt-3 text-sm leading-6 text-white/80">
                      Footer links are saved from the local CMS settings and
                      filtered before reaching the storefront.
                    </p>
                    <div className="mt-4 flex gap-2">
                      {footerContent.social_links.map((item) => (
                        <span
                          className="rounded-full bg-white/15 px-3 py-2 text-xs"
                          key={`${item.label}-${item.href}`}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {footerContent.groups.map((group) => (
                    <div key={group.title}>
                      <div className="font-bold">{group.title}</div>
                      <div className="mt-3 space-y-2 text-sm text-white/80">
                        {group.links.slice(0, 4).map((link) => (
                          <div key={`${link.label}-${link.href}`}>{link.label}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {(liveDetailPanels.length ? liveDetailPanels : detailPanels).map((panel) => (
                <div
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  key={panel.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">
                        {panel.label}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {panel.description}
                      </p>
                    </div>
                    <Badge tone="warn">{panel.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Footer Link Groups
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Editable Sections
              </h2>
              <div className="mt-5 space-y-3">
                {footerContent.groups.map((group, index) => (
                  <div className="rounded-2xl bg-stone-50 p-4" key={group.title}>
                    <div className="grid gap-3">
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-[#5E7F85]"
                        onChange={(event) => updateGroup(index, { title: event.target.value })}
                        value={group.title}
                      />
                      <textarea
                        className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#5E7F85]"
                        onChange={(event) => updateGroup(index, { links: parseLinkLines(event.target.value) })}
                        placeholder="Label | /href | active"
                        value={formatLinkLines(group.links)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                          onChange={(event) => updateGroup(index, { sort_order: Number(event.target.value) || 0 })}
                          type="number"
                          value={group.sort_order}
                        />
                        <select
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                          onChange={(event) => updateGroup(index, { status: event.target.value === "inactive" ? "inactive" : "active" })}
                          value={group.status}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#5E7F85]"
                  onClick={() =>
                    setFooterContent((current) => ({
                      ...current,
                      groups: [
                        ...current.groups,
                        {
                          links: [
                            {
                              href: "",
                              label: "New footer label",
                              sort_order: 1,
                              status: "inactive",
                            },
                          ],
                          sort_order: current.groups.length + 1,
                          status: "inactive",
                          title: "New Section",
                        },
                      ],
                    }))
                  }
                  type="button"
                >
                  Add Footer Group
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Brand & Social
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Footer Identity
              </h3>
              <div className="mt-5 space-y-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                  onChange={(event) =>
                    setFooterContent((current) => ({
                      ...current,
                      brand: {
                        ...current.brand,
                        name: event.target.value,
                      },
                    }))
                  }
                  value={footerContent.brand.name}
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]"
                  onChange={(event) =>
                    setFooterContent((current) => ({
                      ...current,
                      brand: {
                        ...current.brand,
                        copyright: event.target.value,
                      },
                    }))
                  }
                  value={footerContent.brand.copyright}
                />
                <textarea
                  className="h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#5E7F85]"
                  onChange={(event) =>
                    setFooterContent((current) => ({
                      ...current,
                      social_links: parseSocialLines(event.target.value),
                    }))
                  }
                  placeholder="f | https://real-account.example | Facebook | active"
                  value={formatSocialLines(footerContent.social_links)}
                />
                <button
                  className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isSaving}
                  onClick={saveFooter}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save Footer"}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">
                Footer Controls
              </div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Controls Coming Later
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  "Drag-and-drop footer ordering",
                  "Newsletter automation",
                  "Footer experiments",
                  "Advanced visibility rules",
                ].map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold"
                    key={item}
                  >
                    <span className="text-slate-700">{item}</span>
                    <Badge tone="default">Off</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">
                Footer CMS Safety Note
              </div>
              <div className="mt-3 space-y-2">
                {safetyItems.map((item) => (
                  <div
                    className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold leading-6 text-amber-800"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
