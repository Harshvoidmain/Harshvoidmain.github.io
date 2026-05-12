"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { membershipSchema, type MembershipFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Membership } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function MembershipsModule({ facultyId, canEdit }: Props) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MembershipFormData>({ resolver: zodResolver(membershipSchema), defaultValues: { isActive: true } });

  useEffect(() => {
    return onSnapshot(query(collection(db, `faculty/${facultyId}/memberships`), orderBy("validFrom", "desc")),
      (snap) => { setMemberships(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Membership)); setLoading(false); });
  }, [facultyId]);

  const onSubmit = async (data: MembershipFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, updatedAt: serverTimestamp() };
      if (editId) { await updateDoc(doc(db, `faculty/${facultyId}/memberships`, editId), payload); toast.success("Membership updated."); }
      else { await addDoc(collection(db, `faculty/${facultyId}/memberships`), { ...payload, createdAt: serverTimestamp() }); toast.success("Membership added."); }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/memberships`, deleteId));
    toast.success("Deleted."); setDeleteId(null);
  };

  const columns: Column<Membership>[] = [
    { key: "organizationName", header: "Organization", sortable: true, cell: (m) => <span className="font-medium text-sm">{m.organizationName}</span> },
    { key: "membershipType", header: "Type", cell: (m) => <Badge variant="secondary">{m.membershipType}</Badge> },
    { key: "memberId", header: "Member ID", cell: (m) => m.memberId ? <span className="font-mono text-xs">{m.memberId}</span> : <span className="text-muted">—</span> },
    { key: "validFrom", header: "Valid From", cell: (m) => <span className="text-xs">{formatDate(m.validFrom)}</span> },
    { key: "validUntil", header: "Valid Until", cell: (m) => m.validUntil ? <span className="text-xs">{formatDate(m.validUntil)}</span> : <span className="text-muted text-xs">Lifetime</span> },
    { key: "isActive", header: "Status", cell: (m) => <Badge variant={m.isActive ? "success" : "default"}>{m.isActive ? "Active" : "Expired"}</Badge> },
    ...(canEdit ? [{ key: "actions" as keyof Membership, header: "", headerClassName: "w-16", cell: (m: Membership) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(m.id!); reset(m as unknown as MembershipFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(m.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{memberships.length} membership{memberships.length !== 1 ? "s" : ""}</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset({ isActive: true }); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Membership</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={columns} data={memberships as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No professional memberships", description: "Add your professional society memberships.", action: canEdit ? { label: "Add Membership", onClick: () => setDrawerOpen(true) } : undefined }} />}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Membership</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="membership-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Organization Name" required {...register("organizationName")} error={errors.organizationName?.message} />
                <div><label className="block text-sm font-medium mb-1.5">Membership Type</label><select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("membershipType")}>{["Life Member","Fellow","Associate Member","Member","Senior Member"].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <Input label="Member ID" placeholder="MEM12345" {...register("memberId")} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Valid From" type="date" required {...register("validFrom")} error={errors.validFrom?.message} />
                  <Input label="Valid Until" type="date" {...register("validUntil")} hint="Leave blank for lifetime" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <input type="checkbox" {...register("isActive")} className="accent-primary" defaultChecked />
                  <label className="text-sm">Currently active membership</label>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0"><Button form="membership-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Membership</Button></div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Membership" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
