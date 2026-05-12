"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { contributionSchema, type ContributionFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Contribution } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function ContributionsModule({ facultyId, canEdit }: Props) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContributionFormData>({ resolver: zodResolver(contributionSchema) });

  useEffect(() => {
    return onSnapshot(query(collection(db, `faculty/${facultyId}/contributions`), orderBy("startDate", "desc")),
      (snap) => { setContributions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Contribution)); setLoading(false); });
  }, [facultyId]);

  const onSubmit = async (data: ContributionFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, updatedAt: serverTimestamp() };
      if (editId) { await updateDoc(doc(db, `faculty/${facultyId}/contributions`, editId), payload); toast.success("Contribution updated."); }
      else { await addDoc(collection(db, `faculty/${facultyId}/contributions`), { ...payload, createdAt: serverTimestamp() }); toast.success("Contribution added."); }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/contributions`, deleteId));
    toast.success("Deleted."); setDeleteId(null);
  };

  const columns: Column<Contribution>[] = [
    { key: "contributionType", header: "Type", cell: (c) => <Badge variant="secondary">{c.contributionType}</Badge> },
    { key: "organization", header: "Organization", sortable: true, cell: (c) => <span className="font-medium text-sm">{c.organization}</span> },
    { key: "role", header: "Role" },
    { key: "startDate", header: "From", cell: (c) => <span className="text-xs text-muted">{formatDate(c.startDate)}</span> },
    { key: "endDate", header: "To", cell: (c) => c.endDate ? <span className="text-xs text-muted">{formatDate(c.endDate)}</span> : <span className="text-xs text-muted">Present</span> },
    ...(canEdit ? [{ key: "actions" as keyof Contribution, header: "", headerClassName: "w-16", cell: (c: Contribution) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(c.id!); reset(c as unknown as ContributionFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(c.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{contributions.length} contribution{contributions.length !== 1 ? "s" : ""}</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset(); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Contribution</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={columns} data={contributions as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No contributions", description: "Add your contributions to boards, committees, and more.", action: canEdit ? { label: "Add Contribution", onClick: () => setDrawerOpen(true) } : undefined }} />}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Contribution</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="contribution-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5">Contribution Type <span className="text-error">*</span></label><select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("contributionType")}>{["Board Member","Reviewer","Committee Member","Editorial Board","Session Chair","Keynote Speaker","Resource Person","External Examiner"].map((t) => <option key={t} value={t}>{t}</option>)}</select>{errors.contributionType && <p className="field-error">{errors.contributionType.message}</p>}</div>
                <Input label="Organization" required {...register("organization")} error={errors.organization?.message} />
                <Input label="Role Description" required {...register("role")} error={errors.role?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="From Date" type="date" required {...register("startDate")} error={errors.startDate?.message} />
                  <Input label="To Date" type="date" {...register("endDate")} hint="Leave blank if ongoing" />
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Description</label><textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none" rows={3} {...register("description")} /></div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0"><Button form="contribution-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Contribution</Button></div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Contribution" description="Are you sure?" onConfirm={handleDelete} />
    </div>
  );
}
