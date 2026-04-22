import AdminLayout from "@/components/layout/AdminLayout";
import RealBannerCmsPage from "@/features/banners/RealBannerCmsPage";

export default function BannersPage() {
  return (
    <AdminLayout title="Banners">
      <RealBannerCmsPage />
    </AdminLayout>
  );
}
