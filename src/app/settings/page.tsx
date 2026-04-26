import AdminLayout from "@/components/layout/AdminLayout";
import RealSettingsPage from "@/features/settings/RealSettingsPage";
import { getStoreSettingsFromSupabase } from "@/lib/settings/supabaseSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const storeSettings = await getStoreSettingsFromSupabase();

  return (
    <AdminLayout title="Settings">
      <RealSettingsPage storeSettings={storeSettings} />
    </AdminLayout>
  );
}
