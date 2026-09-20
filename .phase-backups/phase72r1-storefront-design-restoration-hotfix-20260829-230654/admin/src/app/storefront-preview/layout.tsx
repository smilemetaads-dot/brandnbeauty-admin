import type { Metadata } from "next";

import { StorefrontPreviewChrome } from "@/features/storefront-preview/StorefrontPreviewChrome";
import { getStorefrontPreviewSnapshot } from "@/features/storefront-preview/storefront-preview-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BrandnBeauty Storefront Preview",
  description: "Mobile-first preview using BrandnBeauty's live public catalog and CMS feeds.",
  robots: { follow: false, index: false },
};

export default async function StorefrontPreviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const snapshot = await getStorefrontPreviewSnapshot();
  return <StorefrontPreviewChrome footer={snapshot.footer} navigation={snapshot.navigation}>{children}</StorefrontPreviewChrome>;
}
