import AdminLayout from "@/components/layout/AdminLayout";
import RealCustomerProfilePage from "@/features/customers/RealCustomerProfilePage";

export default function CustomerProfilePage() {
  return (
    <AdminLayout title="Customer Profile">
      <RealCustomerProfilePage />
    </AdminLayout>
  );
}
