"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

type FooterStatus = "active" | "inactive";
type FooterLink = {
  href: string;
  label: string;
  sort_order: number;
  status: FooterStatus;
};

type FooterSocialLink = FooterLink & {
  aria_label: string;
};

type FooterGroup = {
  links: FooterLink[];
  sort_order: number;
  status: FooterStatus;
  title: string;
};

type FooterContent = {
  brand: {
    address: string;
    copyright: string;
    description: string;
    email: string;
    name: string;
    phone: string;
  };
  groups: FooterGroup[];
  payment_methods: [];
  social_links: FooterSocialLink[];
};

const GET_FOOTER_ENDPOINT = bnbApiUrl("get_footer.php");
const UPDATE_FOOTER_ENDPOINT = bnbApiUrl("update_footer.php");

const defaultGroups: FooterGroup[] = [
  {
    links: [
      { label: "Categories", href: "/category/skincare", sort_order: 1, status: "active" },
      { label: "Concerns", href: "/concern/acne", sort_order: 2, status: "active" },
      { label: "Brands", href: "", sort_order: 3, status: "inactive" },
      { label: "Collections", href: "", sort_order: 4, status: "inactive" },
      { label: "Products", href: "/products", sort_order: 5, status: "active" },
      { label: "Offers", href: "", sort_order: 6, status: "inactive" },
      { label: "Real Results", href: "/real-results", sort_order: 7, status: "active" },
    ],
    sort_order: 1,
    status: "active",
    title: "Shop",
  },
  {
    links: [
      { label: "Track Order", href: "/thank-you", sort_order: 1, status: "active" },
      { label: "FAQ", href: "/faq", sort_order: 2, status: "active" },
      { label: "Contact Us", href: "/contact", sort_order: 3, status: "active" },
      { label: "Shipping Information", href: "/shipping-policy", sort_order: 4, status: "active" },
      { label: "Returns & Refunds", href: "/refund-policy", sort_order: 5, status: "active" },
    ],
    sort_order: 2,
    status: "active",
    title: "Customer Care",
  },
  {
    links: [
      { label: "About BrandnBeauty", href: "/about", sort_order: 1, status: "active" },
      { label: "Why Choose Us", href: "/why-brandnbeauty", sort_order: 2, status: "active" },
      { label: "Blog", href: "", sort_order: 3, status: "inactive" },
      { label: "Careers", href: "", sort_order: 4, status: "inactive" },
    ],
    sort_order: 3,
    status: "active",
    title: "Company",
  },
  {
    links: [
      { label: "Privacy Policy", href: "/privacy-policy", sort_order: 1, status: "active" },
      { label: "Terms & Conditions", href: "/terms-and-conditions", sort_order: 2, status: "active" },
      { label: "Return & Refund Policy", href: "/refund-policy", sort_order: 3, status: "active" },
      { label: "Shipping Policy", href: "/shipping-policy", sort_order: 4, status: "active" },
    ],
    sort_order: 4,
    status: "active",
    title: "Legal",
  },
];

const fallbackFooterContent: FooterContent = {
  brand: {
    address: "63 Shukrabad, Dhaka-1207, Bangladesh",
    copyright: "Copyright \u00A9 2026 BrandnBeauty. All Rights Reserved.",
    description: "Trusted beauty and skincare, thoughtfully selected for real routines.",
    email: "brandandbeautystore@gmail.com",
    name: "BrandnBeauty",
    phone: "01712176437",
  },
  groups: defaultGroups,
  payment_methods: [],
  social_links: [],
};

const socialPlatforms = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "pinterest", label: "Pinterest" },
] as const;

const safetyItems = [
  "Groups and links marked Visible on Website appear on the storefront only when the URL is usable.",
  "Blank URLs, hidden links and hidden groups remain saved for later but stay hidden publicly.",
  "Use real internal routes or verified external URLs only. Unsafe javascript/data/vbscript links are removed.",
  "Phone and email render as clickable tel/mailto links only when filled.",
] as const;

function isUnsafeFooterHref(href: string): boolean {
  const normalized = href.trim().toLowerCase();

  return normalized === "#"
    || normalized.startsWith("javascript:")
    || normalized.startsWith("data:")
    || normalized.startsWith("vbscript:");
}

function cleanHref(href: string) {
  return isUnsafeFooterHref(href) ? "" : href;
}

function normalizeStatus(status: unknown): FooterStatus {
  return typeof status === "string" && status.toLowerCase() === "inactive" ? "inactive" : "active";
}

function canonicalFooterLinkLabel(label: string): string {
  return label.trim().toLowerCase() === "refund policy" ? "Return & Refund Policy" : label.trim();
}

function normalizeFooterLink(link: unknown): FooterLink | null {
  if (!link || typeof link !== "object") return null;

  const record = link as Partial<FooterLink>;
  const label = canonicalFooterLinkLabel(typeof record.label === "string" ? record.label.trim() : "");
  if (!label) return null;

  return {
    href: cleanHref(typeof record.href === "string" ? record.href.trim() : ""),
    label,
    sort_order: Number(record.sort_order) || 0,
    status: normalizeStatus(record.status),
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

function canonicalFooterGroupTitle(title: string): string {
  const normalized = title.trim().toLowerCase();
  if (normalized === "explore") return "Shop";
  if (normalized === "support") return "Customer Care";
  if (normalized === "policies") return "Legal";
  return title.trim();
}
function normalizeFooterGroup(group: unknown): FooterGroup | null {
  if (!group || typeof group !== "object") return null;

  const record = group as Partial<FooterGroup>;
  const title = canonicalFooterGroupTitle(typeof record.title === "string" ? record.title.trim() : "");
  if (!title) return null;

  const links = Array.isArray(record.links)
    ? record.links
        .map(normalizeFooterLink)
        .filter((link): link is FooterLink => Boolean(link))
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return {
    links,
    sort_order: Number(record.sort_order) || 0,
    status: normalizeStatus(record.status),
    title,
  };
}

function mergeWithDefaultGroups(groups: FooterGroup[]) {
  const merged = [...groups];

  for (const defaultGroup of defaultGroups) {
    const groupIndex = merged.findIndex((group) => group.title.toLowerCase() === defaultGroup.title.toLowerCase());

    if (groupIndex === -1) {
      merged.push(defaultGroup);
      continue;
    }

    const group = merged[groupIndex];
    const links = [...group.links];

    for (const defaultLink of defaultGroup.links) {
      const linkIndex = links.findIndex((link) => link.label.toLowerCase() === defaultLink.label.toLowerCase());

      if (linkIndex === -1) {
        links.push(defaultLink);
        continue;
      }

      const link = links[linkIndex];
      const shouldUseDefaultHref = !link.href.trim() && Boolean(defaultLink.href.trim());

      links[linkIndex] = {
        ...link,
        href: shouldUseDefaultHref ? defaultLink.href : link.href,
        sort_order: link.sort_order || defaultLink.sort_order,
        status: shouldUseDefaultHref && defaultLink.status === "active" ? "active" : link.status,
      };
    }

    merged[groupIndex] = {
      ...group,
      sort_order: defaultGroup.sort_order,
      status: defaultGroup.status,
      links: reorderLinks(Array.from(new Map(links.map((link) => [link.href.trim() || link.label.toLowerCase(), link])).values())),
    };
  }

  return reorderGroups(merged);
}

function normalizeFooterContent(payload: unknown): FooterContent {
  if (!payload || typeof payload !== "object") return fallbackFooterContent;

  const record = payload as Partial<FooterContent>;
  const brand = record.brand && typeof record.brand === "object" ? record.brand : fallbackFooterContent.brand;
  const groups = Array.isArray(record.groups)
    ? record.groups.map(normalizeFooterGroup).filter((group): group is FooterGroup => Boolean(group))
    : [];
  const socialLinks = Array.isArray(record.social_links)
    ? record.social_links.map(normalizeFooterSocial).filter((link): link is FooterSocialLink => Boolean(link))
    : [];

  return {
    brand: {
      address: typeof brand.address === "string" && brand.address.trim() ? brand.address.trim() : fallbackFooterContent.brand.address,
      copyright: typeof brand.copyright === "string" && brand.copyright.trim()
        ? brand.copyright.trim()
        : fallbackFooterContent.brand.copyright,
      description: typeof brand.description === "string" && brand.description.trim()
        ? brand.description.trim()
        : fallbackFooterContent.brand.description,
      email: typeof brand.email === "string" && brand.email.trim() ? brand.email.trim() : fallbackFooterContent.brand.email,
      name: typeof brand.name === "string" && brand.name.trim() ? brand.name.trim() : fallbackFooterContent.brand.name,
      phone: typeof brand.phone === "string" && brand.phone.trim() ? brand.phone.trim() : fallbackFooterContent.brand.phone,
    },
    groups: mergeWithDefaultGroups(groups),
    payment_methods: [],
    social_links: socialLinks.sort((a, b) => a.sort_order - b.sort_order),
  };
}

function reorderGroups(groups: FooterGroup[]): FooterGroup[] {
  return groups
    .map((group, index) => ({ ...group, sort_order: Number(group.sort_order) || index + 1 }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group, index) => ({ ...group, sort_order: index + 1, links: reorderLinks(group.links) }));
}

function reorderLinks(links: FooterLink[]): FooterLink[] {
  return links
    .map((link, index) => ({ ...link, sort_order: Number(link.sort_order) || index + 1 }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((link, index) => ({ ...link, sort_order: index + 1 }));
}

function swapItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
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
        const payload = (await response.json()) as { footer?: unknown; success?: boolean };
        return response.ok && payload.success !== false && payload.footer
          ? normalizeFooterContent(payload.footer)
          : fallbackFooterContent;
      })
      .then(setFooterContent)
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Footer CMS data could not be loaded.", error);
        }
      });

    return () => controller.abort();
  }, []);

  const liveStats = useMemo(() => {
    const groupCount = footerContent.groups.length;
    const enabledGroups = footerContent.groups.filter((group) => group.status === "active").length;
    const linkCount = footerContent.groups.reduce((total, group) => total + group.links.length, 0);
    const enabledLinks = footerContent.groups.reduce(
      (total, group) => total + group.links.filter((link) => link.status === "active" && link.href.trim()).length,
      0,
    );

    return [
      ["Footer Groups", `${enabledGroups}/${groupCount}`, "Visible groups"],
      ["Footer Links", `${enabledLinks}/${linkCount}`, "Visible links with URLs"],
      ["Social Links", String(footerContent.social_links.length), "Configured profiles"],
      ["Bottom Bar", "Centered", "Payment badges hidden"],
    ] as const;
  }, [footerContent.groups, footerContent.social_links.length]);

  const saveFooter = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const preparedFooter = {
        ...footerContent,
        groups: reorderGroups(footerContent.groups),
        payment_methods: [],
      };
      const response = await fetch(UPDATE_FOOTER_ENDPOINT, {
        body: JSON.stringify({ footer: preparedFooter }),
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        method: "POST",
      });
      const payload = (await response.json()) as { footer?: unknown; message?: string; success?: boolean };

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

  const updateBrand = (field: keyof FooterContent["brand"], value: string) => {
    setFooterContent((current) => ({
      ...current,
      brand: { ...current.brand, [field]: value },
    }));
  };

  const updateSocialUrl = (platform: string, label: string, href: string, sortOrder: number) => {
    const safeHref = cleanHref(href.trim());

    setFooterContent((current) => {
      const otherLinks = current.social_links.filter((link) => link.label.toLowerCase() !== platform);
      const nextLinks = safeHref
        ? [
            ...otherLinks,
            { aria_label: label, href: safeHref, label, sort_order: sortOrder, status: "active" as const },
          ]
        : otherLinks;

      return { ...current, social_links: nextLinks.sort((a, b) => a.sort_order - b.sort_order) };
    });
  };

  const getSocialUrl = (platform: string) =>
    footerContent.social_links.find((link) => link.label.toLowerCase() === platform)?.href || "";

  const updateGroup = (groupIndex: number, patch: Partial<FooterGroup>) => {
    setFooterContent((current) => ({
      ...current,
      groups: reorderGroups(current.groups.map((group, index) => (index === groupIndex ? { ...group, ...patch } : group))),
    }));
  };

  const moveGroup = (groupIndex: number, direction: -1 | 1) => {
    setFooterContent((current) => ({ ...current, groups: reorderGroups(swapItems(current.groups, groupIndex, groupIndex + direction)) }));
  };

  const addGroup = () => {
    setFooterContent((current) => ({
      ...current,
      groups: reorderGroups([
        ...current.groups,
        { links: [], sort_order: current.groups.length + 1, status: "inactive", title: "New Footer Group" },
      ]),
    }));
  };

  const removeGroup = (groupIndex: number) => {
    if (!window.confirm("Remove this footer group? This cannot be undone until you save.")) return;
    setFooterContent((current) => ({
      ...current,
      groups: reorderGroups(current.groups.filter((_, index) => index !== groupIndex)),
    }));
  };

  const updateLink = (groupIndex: number, linkIndex: number, patch: Partial<FooterLink>) => {
    setFooterContent((current) => ({
      ...current,
      groups: current.groups.map((group, index) => {
        if (index !== groupIndex) return group;
        const links = group.links.map((link, currentLinkIndex) => {
          if (currentLinkIndex !== linkIndex) return link;
          const nextLink = { ...link, ...patch };
          return patch.href !== undefined ? { ...nextLink, href: cleanHref(patch.href) } : nextLink;
        });
        return { ...group, links: reorderLinks(links) };
      }),
    }));
  };

  const moveLink = (groupIndex: number, linkIndex: number, direction: -1 | 1) => {
    setFooterContent((current) => ({
      ...current,
      groups: current.groups.map((group, index) =>
        index === groupIndex
          ? { ...group, links: reorderLinks(swapItems(group.links, linkIndex, linkIndex + direction)) }
          : group,
      ),
    }));
  };

  const addLink = (groupIndex: number) => {
    const group = footerContent.groups[groupIndex];
    if (group.links.some((link) => !link.label.trim() && !link.href.trim())) {
      setMessage("Finish the blank link in this group before adding another one.");
      return;
    }

    setFooterContent((current) => ({
      ...current,
      groups: current.groups.map((currentGroup, index) =>
        index === groupIndex
          ? {
              ...currentGroup,
              links: reorderLinks([
                ...currentGroup.links,
                { href: "", label: "New Link", sort_order: currentGroup.links.length + 1, status: "inactive" },
              ]),
            }
          : currentGroup,
      ),
    }));
  };

  const removeLink = (groupIndex: number, linkIndex: number) => {
    if (!window.confirm("Remove this footer link? This cannot be undone until you save.")) return;
    setFooterContent((current) => ({
      ...current,
      groups: current.groups.map((group, index) =>
        index === groupIndex
          ? { ...group, links: reorderLinks(group.links.filter((_, currentLinkIndex) => currentLinkIndex !== linkIndex)) }
          : group,
      ),
    }));
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {liveStats.map(([label, value, helper]) => (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm" key={label}>
              <div className="text-sm font-medium text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</div>
              <div className="mt-3 text-xs font-semibold text-slate-500">{helper}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">Storefront Footer</div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Footer CMS</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Manage the live footer with simple fields. Hidden or blank links stay saved here but are hidden from shoppers.
                  </p>
                </div>
                <button
                  className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isSaving}
                  onClick={saveFooter}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save Footer"}
                </button>
              </div>
              {message ? <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">{message}</div> : null}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Footer Navigation Groups</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Columns & Links</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use Visible on Website to publish a column or link. Links with blank URLs never appear publicly.
              </p>

              <div className="mt-5 space-y-5">
                {footerContent.groups.map((group, groupIndex) => (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-stone-50 p-4" key={`${group.title}-${groupIndex}`}>
                    <div className="grid gap-3 lg:grid-cols-[1fr_130px_130px_auto] lg:items-end">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Group title</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-[#5E7F85]"
                          onChange={(event) => updateGroup(groupIndex, { title: event.target.value })}
                          value={group.title}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Visible on Website</span>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                          onChange={(event) => updateGroup(groupIndex, { status: event.target.value === "inactive" ? "inactive" : "active" })}
                          value={group.status}
                        >
                          <option value="active">Visible</option>
                          <option value="inactive">Hidden</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Sort order</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                          onChange={(event) => updateGroup(groupIndex, { sort_order: Number(event.target.value) || groupIndex + 1 })}
                          type="number"
                          value={group.sort_order}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40" disabled={groupIndex === 0} onClick={() => moveGroup(groupIndex, -1)} type="button">Up</button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40" disabled={groupIndex === footerContent.groups.length - 1} onClick={() => moveGroup(groupIndex, 1)} type="button">Down</button>
                        <button className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600" onClick={() => removeGroup(groupIndex)} type="button">Remove</button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {group.links.map((link, linkIndex) => (
                        <div className="rounded-2xl bg-white p-3" key={`${link.label}-${linkIndex}`}>
                          <div className="grid gap-3 lg:grid-cols-[1fr_1.25fr_120px_110px_auto] lg:items-end">
                            <label className="block">
                              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Label</span>
                              <input
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                                onChange={(event) => updateLink(groupIndex, linkIndex, { label: event.target.value })}
                                value={link.label}
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">URL</span>
                              <input
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                                onChange={(event) => updateLink(groupIndex, linkIndex, { href: event.target.value })}
                                placeholder="/products or https://..."
                                value={link.href}
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Visible on Website</span>
                              <select
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                                onChange={(event) => updateLink(groupIndex, linkIndex, { status: event.target.value === "inactive" ? "inactive" : "active" })}
                                value={link.status}
                              >
                                <option value="active">Visible</option>
                                <option value="inactive">Hidden</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Order</span>
                              <input
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#5E7F85]"
                                onChange={(event) => updateLink(groupIndex, linkIndex, { sort_order: Number(event.target.value) || linkIndex + 1 })}
                                type="number"
                                value={link.sort_order}
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40" disabled={linkIndex === 0} onClick={() => moveLink(groupIndex, linkIndex, -1)} type="button">Up</button>
                              <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40" disabled={linkIndex === group.links.length - 1} onClick={() => moveLink(groupIndex, linkIndex, 1)} type="button">Down</button>
                              <button className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600" onClick={() => removeLink(groupIndex, linkIndex)} type="button">Remove</button>
                            </div>
                          </div>
                          {link.status === "active" && !link.href.trim() ? (
                            <div className="mt-2 text-xs font-semibold text-amber-700">This link is enabled but hidden until a URL is added.</div>
                          ) : null}
                        </div>
                      ))}
                      <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#5E7F85]" onClick={() => addLink(groupIndex)} type="button">
                        Add Link
                      </button>
                    </div>
                  </div>
                ))}
                <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#5E7F85]" onClick={addGroup} type="button">
                  Add Group
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Brand Information</div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Footer Identity</h3>
              <div className="mt-5 space-y-3">
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateBrand("name", event.target.value)} placeholder="Brand name" value={footerContent.brand.name} />
                <textarea className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateBrand("description", event.target.value)} placeholder="Short brand description" value={footerContent.brand.description} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateBrand("phone", event.target.value)} placeholder="Phone number" value={footerContent.brand.phone} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateBrand("email", event.target.value)} placeholder="Email address" value={footerContent.brand.email} />
                <textarea className="h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateBrand("address", event.target.value)} placeholder="Optional address" value={footerContent.brand.address} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Social Links</div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Social URLs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Blank fields stay hidden on the storefront.</p>
              <div className="mt-5 space-y-3">
                {socialPlatforms.map((platform, index) => (
                  <label className="block" key={platform.key}>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{platform.label}</span>
                    <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5E7F85]" onChange={(event) => updateSocialUrl(platform.key, platform.label, event.target.value, index + 1)} placeholder={`https://${platform.key}.com/...`} type="url" value={getSocialUrl(platform.key)} />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-slate-500">Bottom Bar</div>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Copyright Line</h3>
              <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Copyright {"\u00A9"} {new Date().getFullYear()} BrandnBeauty. All Rights Reserved.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">Centered on every screen. Payment badges are not shown in the footer.</p>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-sm font-bold text-amber-800">Footer CMS Safety Note</div>
              <div className="mt-3 space-y-2">
                {safetyItems.map((item) => (
                  <div className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold leading-6 text-amber-800" key={item}>{item}</div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
