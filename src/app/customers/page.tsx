import AdminLayout from "@/components/layout/AdminLayout";
import RealCustomersPage from "@/features/customers/RealCustomersPage";

export default function CustomersPage() {
  return (
    <AdminLayout title="Customers">
      <RealCustomersPage />
    </AdminLayout>
  );
}
