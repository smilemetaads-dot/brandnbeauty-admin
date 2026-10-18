"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { LiveRolesPermissionsWorkspace } from "@/features/roles-permissions/LiveRolesPermissionsWorkspace";

export default function RolesPage() {
  return (
    <AdminShell>
      <LiveRolesPermissionsWorkspace />
    </AdminShell>
  );
}
