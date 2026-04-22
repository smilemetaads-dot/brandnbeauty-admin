import type { ReactNode } from "react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function AdminLayout({
  children,
  title = "Dashboard",
}: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar title={title} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
