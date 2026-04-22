import AdminLayout from "@/components/layout/AdminLayout";
import RealSettingsPage from "@/features/settings/RealSettingsPage";

export default function SettingsPage() {
  return (
    <AdminLayout title="Settings">
      <RealSettingsPage />
    </AdminLayout>
  );
}
