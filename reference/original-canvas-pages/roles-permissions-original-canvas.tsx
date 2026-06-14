// REFERENCE ONLY.
// Original Canvas Roles & Permissions design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding the live Roles & Permissions page.
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, react/jsx-no-undef */
// @ts-nocheck

function RolesPermissionsPage() {
    // LOCKED: Roles & Permissions page frozen for current phase. Revisit only for real user-role assignment and permission save integration.
    const [selectedRoleName, setSelectedRoleName] = useState("Super Admin");
    const [roleAction, setRoleAction] = useState(null);
    const roleStats = [
        ["Admin Users", "7", "Active team access"],
        ["Custom Roles", "4", "Configured groups"],
        ["Sensitive Access", "3", "Finance + settings"],
        ["Pending Review", "2", "Need permission audit"],
    ];
    const roles = [
        { name: "Super Admin", users: 1, scope: "Full system access", status: "Protected" },
        { name: "Order Manager", users: 3, scope: "Orders, courier, customers", status: "Active" },
        { name: "Inventory Manager", users: 2, scope: "Products, stock, suppliers", status: "Active" },
        { name: "Finance Manager", users: 1, scope: "Finance, reports, reconciliation", status: "Review" },
    ];
    const permissions = [
        ["Dashboard", "View", "View", "View", "View"],
        ["Orders", "Full", "Full", "View", "View"],
        ["Products", "Full", "View", "Full", "View"],
        ["Inventory", "Full", "View", "Full", "View"],
        ["Suppliers", "Full", "View", "Full", "View"],
        ["Finance", "Full", "No Access", "View", "Full"],
        ["Reports", "Full", "View", "View", "Full"],
        ["Settings", "Full", "No Access", "No Access", "View"],
    ];
    const selectedRole = roles.find((role) => role.name === selectedRoleName) || roles[0];
    const selectedRoleIndex = roles.findIndex((role) => role.name === selectedRole.name) + 1;
    const sensitiveModules = permissions
        .filter((row) => ["Finance", "Settings"].includes(row[0]) && row[selectedRoleIndex] !== "No Access")
        .map((row) => row[0]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {roleStats.map((item, index) => (
                    <StatCard key={item[0]} item={item} index={index} active={item[0] === "Sensitive Access" || item[0] === "Pending Review"} />
                ))}
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions Control Room</h2>
                        <div className="mt-2 text-sm text-slate-500">Control admin access, module visibility and sensitive actions from one place.</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => setRoleAction("Audit Log")} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold shadow-sm">Audit Log</button>
                        <button onClick={() => setRoleAction("Export Matrix")} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold shadow-sm">Export Matrix</button>
                        <button onClick={() => setRoleAction("Create Role")} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">Create Role</button>
                    </div>
                </div>
                <div className="grid gap-3 border-t border-slate-100 bg-stone-50/70 p-4 text-sm md:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Security focus: <b className="text-rose-700">Finance access</b></div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Last audit: <b className="text-slate-900">Today</b></div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-slate-600">Recommendation: <b className="text-[#5E7F85]">Review 2 roles</b></div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="text-sm font-medium text-slate-500">Role Groups</div>
                        <h2 className="mt-1 text-xl font-bold tracking-tight">Admin Roles</h2>
                        <div className="mt-5 space-y-3">
                            {roles.map((role) => (
                                <div key={role.name} onClick={() => setSelectedRoleName(role.name)} className={`cursor-pointer rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${selectedRoleName === role.name ? "bg-[#5E7F85]/10 ring-2 ring-[#5E7F85]/15" : "bg-stone-50"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-bold text-slate-900">{role.name}</div>
                                            <div className="mt-1 text-xs text-slate-500">{role.scope}</div>
                                        </div>
                                        <Badge tone={role.status === "Protected" ? "brand" : role.status === "Review" ? "warn" : "good"}>{role.status}</Badge>
                                    </div>
                                    <div className="mt-3 text-xs font-semibold text-slate-500">{role.users} user{role.users > 1 ? "s" : ""}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <div className="text-sm font-bold text-amber-800">Permission Note</div>
                        <div className="mt-2 text-sm leading-6 text-amber-700">Keep finance, settings and role management access limited to trusted admins only.</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-6 shadow-sm">
                        <div className="text-sm font-medium text-[#5E7F85]">Selected Role</div>
                        <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">{selectedRole.name}</h2>
                                <div className="mt-2 text-sm text-slate-600">{selectedRole.scope}</div>
                            </div>
                            <Badge tone={selectedRole.status === "Protected" ? "brand" : selectedRole.status === "Review" ? "warn" : "good"}>{selectedRole.status}</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">Users: <b className="text-slate-900">{selectedRole.users}</b></div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">Sensitive access: <b className="text-rose-700">{sensitiveModules.length ? sensitiveModules.join(", ") : "None"}</b></div>
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">Review status: <b className="text-[#5E7F85]">{selectedRole.status === "Review" ? "Required" : "Clear"}</b></div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-sm font-medium text-slate-500">Permission Matrix</div>
                                    <h2 className="mt-1 text-xl font-bold tracking-tight">Module Access Control</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Reset</button>
                                    <button className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Save Changes</button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <TableHead><tr>{["Module", "Super Admin", "Order Manager", "Inventory Manager", "Finance Manager"].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></TableHead>
                                <tbody>
                                    {permissions.map((row) => (
                                        <tr key={row[0]} className={`border-t border-slate-100 transition hover:bg-stone-50 ${["Finance", "Settings"].includes(row[0]) ? "bg-amber-50/30" : ""}`}>
                                            {row.map((cell, index) => (
                                                <td key={`${row[0]}-${index}`} className={`px-5 py-4 ${index === 0 ? "font-bold text-slate-900" : ""}`}>
                                                    {index === 0 ? <span className="flex items-center gap-2">{["Finance", "Settings"].includes(cell) && <span className="text-amber-500">!</span>}{cell}</span> : <Badge tone={cell === "Full" ? "brand" : cell === "View" ? "good" : "bad"}>{cell}</Badge>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {roleAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium text-slate-500">Role Management</div>
                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{roleAction}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Selected role: {selectedRole.name}</p>
                        </div>
                        <button onClick={() => setRoleAction(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">Close</button>
                    </div>
                </div>
            </div>}
        </div>
    );
}
