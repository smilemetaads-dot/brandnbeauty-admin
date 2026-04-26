import AdminLayout from "@/components/layout/AdminLayout";
import RealRolesPermissionsPage from "@/features/roles/RealRolesPermissionsPage";

export default function RolesPage() {
  return (
    <AdminLayout title="Admin Roles & Permissions">
      <RealRolesPermissionsPage />
    </AdminLayout>
  );
}
