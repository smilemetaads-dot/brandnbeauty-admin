import { RealAddEditProductPage } from "@/features/products/RealAddEditProductPage";

// Phase 75A.4 R5.3 scalable single/variant product architecture route lock.

export const dynamic = "force-dynamic";

export default function EditProductPage() {
  return <RealAddEditProductPage />;
}
