"use client";

import { useState, useEffect, useContext } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  UserCheck,
  UserX,
  KeyRound,
  Trash2,
  Edit,
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { updateDocument, deleteDocument, writeAuditLog } from "@/lib/firebase/firestore";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { AuthContext } from "@/lib/context/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserFormData } from "@/lib/schemas/user.schema";
import { ROLE_LABELS, ROLE_COLORS, formatDate, formatRelativeTime } from "@/lib/utils/formatters";
import type { UserDocument } from "@/lib/types/user.types";
import { toast } from "sonner";
import { PermissionMatrix } from "@/components/users/PermissionMatrix";
import { ROLE_DEFAULT_PERMISSIONS } from "@/lib/types/permissions.types";
import { serverTimestamp } from "firebase/firestore";

export default function UsersPage() {
  const { userDoc: currentUser } = useContext(AuthContext);
  const { isSuperAdmin, isAdmin } = usePermissions();
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserDocument | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserDocument | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserDocument));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const columns: Column<UserDocument>[] = [
    {
      key: "displayName",
      header: "Name",
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
            {(u.displayName ?? "U").split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="font-medium text-[rgb(var(--text-primary))] text-sm">{u.displayName}</p>
            <p className="text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      cell: (u) => (
        <span className={`role-badge ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (u) => (
        <Badge variant={u.isActive ? "success" : "default"}>
          {u.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (u) => <span className="text-xs text-muted">{formatDate(u.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-16",
      cell: (u) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setEditUser(u)}
            className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5 transition-colors"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleActive(u)}
            className="p-1.5 rounded text-muted hover:text-[rgb(var(--text-primary))] hover:bg-gray-100 transition-colors"
            title={u.isActive ? "Deactivate" : "Activate"}
          >
            {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleResetPassword(u)}
            className="p-1.5 rounded text-muted hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          {isSuperAdmin() && (
            <button
              onClick={() => setDeleteUser(u)}
              className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleToggleActive = async (u: UserDocument) => {
    try {
      await updateDocument(`users/${u.uid}`, { isActive: !u.isActive });
      toast.success(`User ${u.isActive ? "deactivated" : "activated"} successfully.`);
    } catch {
      toast.error("Failed to update user status.");
    }
  };

  const handleResetPassword = async (u: UserDocument) => {
    try {
      await sendPasswordReset(u.email);
      toast.success(`Password reset email sent to ${u.email}.`);
    } catch {
      toast.error("Failed to send reset email.");
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setActionLoading(true);
    try {
      await deleteDocument(`users/${deleteUser.uid}`);
      await writeAuditLog({
        userId: currentUser?.uid ?? "",
        userEmail: currentUser?.email ?? "",
        userName: currentUser?.displayName ?? "",
        action: "deleted",
        entityType: "user",
        entityId: deleteUser.uid,
      });
      toast.success("User deleted.");
      setDeleteUser(null);
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const onCreateUser = async (data: CreateUserFormData) => {
    setActionLoading(true);
    try {
      const resp = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          modulePermissions: ROLE_DEFAULT_PERMISSIONS[data.role],
          isActive: true,
          passwordResetRequired: true,
          createdBy: currentUser?.uid ?? "",
          createdAt: new Date().toISOString(),
        }),
      });
      if (!resp.ok) throw new Error("Failed");
      toast.success(`Account created. Password setup email sent to ${data.email}.`);
      setShowAddModal(false);
      reset();
    } catch {
      toast.error("Failed to create user.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage all system users, roles, and permissions"
        count={filtered.length}
        actions={
          <Button variant="accent" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> Add User
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          keyField="uid"
          emptyState={{
            title: "No users found",
            description: "Try adjusting your filters or add a new user.",
            action: { label: "Add User", onClick: () => setShowAddModal(true) },
          }}
        />
      )}

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateUser)}>
            <div className="px-6 py-4 space-y-4">
              <Input
                label="Full Name"
                placeholder="Dr. Jane Smith"
                error={errors.displayName?.message}
                required
                {...register("displayName")}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="user@institution.edu"
                error={errors.email?.message}
                required
                {...register("email")}
              />
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">
                  Role <span className="text-error">*</span>
                </label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  {...register("role")}
                >
                  <option value="">Select role…</option>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {errors.role && <p className="field-error">{errors.role.message}</p>}
              </div>
              <Input
                label="Employee / Roll Number"
                placeholder="EMP001"
                {...register("employeeId")}
              />
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    A password setup email will be sent automatically to the provided email address.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setShowAddModal(false); reset(); }}>
                Cancel
              </Button>
              <Button variant="accent" type="submit" loading={actionLoading}>
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Drawer */}
      {editUser && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditUser(null)} />
          <div className="drawer">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-heading font-semibold">Edit User</h2>
              <button onClick={() => setEditUser(null)} className="text-muted hover:text-[rgb(var(--text-primary))]">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">User Info</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                <TabsContent value="info">
                  <div className="space-y-4 mt-4">
                    <Input label="Display Name" defaultValue={editUser.displayName} />
                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">Role</label>
                      <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" defaultValue={editUser.role}>
                        {Object.entries(ROLE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Account Active</p>
                        <p className="text-xs text-muted">Inactive users cannot log in</p>
                      </div>
                      <Switch defaultChecked={editUser.isActive} />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleResetPassword(editUser)}
                    >
                      <KeyRound className="w-4 h-4" /> Send Password Reset Email
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="permissions">
                  <PermissionMatrix
                    userId={editUser.uid}
                    userRole={editUser.role}
                    permissions={editUser.modulePermissions ?? ROLE_DEFAULT_PERMISSIONS[editUser.role]}
                  />
                </TabsContent>
              </Tabs>
            </div>
            <div className="px-6 py-4 border-t border-border">
              <Button variant="accent" className="w-full">Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteUser?.displayName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}
