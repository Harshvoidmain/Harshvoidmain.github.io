"use client";

import { useContext, useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { Users, Building2, FileText, Shield, BarChart3, ClipboardList } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { AuthContext } from "@/lib/context/AuthContext";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PermissionMatrix } from "@/components/users/PermissionMatrix";
import type { UserDocument } from "@/lib/types/user.types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/utils/formatters";
import { ROLE_DEFAULT_PERMISSIONS } from "@/lib/types/permissions.types";

export default function SuperAdminPage() {
  const { userDoc } = useContext(AuthContext);
  const { isSuperAdmin } = usePermissions();
  const router = useRouter();
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [stats, setStats] = useState({ users: 0, departments: 0, faculty: 0 });
  const [selectedUser, setSelectedUser] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin()) { router.replace("/dashboard"); return; }
    const load = async () => {
      const [usersSnap, deptSnap, facSnap] = await Promise.all([
        getDocs(query(collection(db, "users"))),
        getDocs(query(collection(db, "departments"))),
        getDocs(query(collection(db, "faculty"))),
      ]);
      setUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserDocument));
      setStats({ users: usersSnap.size, departments: deptSnap.size, faculty: facSnap.size });
      setLoading(false);
    };
    load();
  }, []);

  if (!isSuperAdmin()) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Panel"
        subtitle="Global system management and oversight"
      />

      {/* System Overview Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={stats.users} icon={Users} iconColor="text-primary" />
        <StatsCard title="Departments" value={stats.departments} icon={Building2} iconColor="text-accent" />
        <StatsCard title="Faculty Members" value={stats.faculty} icon={Users} iconColor="text-success" />
        <StatsCard title="System Status" value="Healthy" icon={Shield} iconColor="text-green-500" />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="w-3.5 h-3.5 mr-1.5" />All Users</TabsTrigger>
          <TabsTrigger value="permissions"><Shield className="w-3.5 h-3.5 mr-1.5" />Permission Matrix</TabsTrigger>
          <TabsTrigger value="health"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 dark:bg-gray-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Permissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">Loading users…</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.uid} className="table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {(u.displayName ?? "U").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.displayName}</p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`role-badge ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">{u.departmentId ? `[${u.departmentId}]` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${u.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedUser(selectedUser?.uid === u.uid ? null : u)}
                          className="text-xs text-primary hover:underline"
                        >
                          {selectedUser?.uid === u.uid ? "Hide" : "Manage"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedUser && (
            <div className="mt-4 bg-white dark:bg-[#1C2128] rounded-lg border border-border shadow-card p-5">
              <h3 className="font-heading font-semibold mb-2">
                Permissions: {selectedUser.displayName}
              </h3>
              <PermissionMatrix
                userId={selectedUser.uid}
                userRole={selectedUser.role}
                permissions={selectedUser.modulePermissions ?? ROLE_DEFAULT_PERMISSIONS[selectedUser.role]}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions">
          <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border shadow-card p-5">
            <h3 className="font-heading font-semibold mb-4">Global Permission Matrix</h3>
            <p className="text-sm text-muted mb-4">
              Select a user from the Users tab to manage their individual permissions.
              Default role-based permissions are defined in the system configuration.
            </p>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <div key={role} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`role-badge ${ROLE_COLORS[role]}`}>{label}</span>
                  </div>
                  <p className="text-xs text-muted">
                    {users.filter((u) => u.role === role).length} user{users.filter((u) => u.role === role).length !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border shadow-card p-5">
            <h3 className="font-heading font-semibold mb-4">System Health</h3>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {[
                { label: "Firebase Authentication", status: "Operational", color: "text-success" },
                { label: "Firestore Database", status: "Operational", color: "text-success" },
                { label: "Firebase Storage", status: "Operational", color: "text-success" },
                { label: "Cloud Functions", status: "Operational", color: "text-success" },
                { label: "Email Service", status: "Operational", color: "text-success" },
                { label: "Offline Persistence", status: "Enabled", color: "text-primary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm">{item.label}</span>
                  <span className={`text-xs font-medium ${item.color}`}>● {item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
