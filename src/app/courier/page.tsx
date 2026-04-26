import AdminLayout from "@/components/layout/AdminLayout";
import RealCourierTrackingPage from "@/features/courier/RealCourierTrackingPage";

export default function CourierTrackingPage() {
  return (
    <AdminLayout title="Courier & Payment Tracking">
      <RealCourierTrackingPage />
    </AdminLayout>
  );
}
