"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { interactionSchema, type InteractionFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Interaction } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function InteractionsModule({ facultyId, canEdit }: Props) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InteractionFormData>({ resolver: zodResolver(interactionSchema) });

  useEffect(() => {
    return onSnapshot(query(collection(db, `faculty/${facultyId}/interactions`), orderBy("date", "desc")),
      (snap) => { setInteractions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Interaction)); setLoading(false); });
  }, [facultyId]);

  const onSubmit = async (data: InteractionFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, updatedAt: serverTimestamp() };
      if (editId) { await updateDoc(doc(db, `faculty/${facultyId}/interactions`, editId), payload); toast.success("Interaction updated."); }
      else { await addDoc(collection(db, `faculty/${facultyId}/interactions`), { ...payload, createdAt: serverTimestamp() }); toast.success("Interaction added."); }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/interactions`, deleteId));
    toast.success("Deleted."); setDeleteId(null);
  };

  const columns: Column<Interaction>[] = [
    { key: "industry", header: "Industry / Organization", sortable: true, cell: (i) => <span className="font-medium text-sm">{i.industry}</span> },
    { key: "type", header: "Type", cell: (i) => <Badge variant="secondary">{i.type}</Badge> },
    { key: "topic", header: "Topic" },
    { key: "date", header: "Date", sortable: true, cell: (i) => <span className="text-xs text-muted">{formatDate(i.date)}</span> },
    ...(canEdit ? [{ key: "actions" as keyof Interaction, header: "", headerClassName: "w-16", cell: (i: Interaction) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(i.id!); reset(i as unknown as InteractionFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(i.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{interactions.length} interaction{interactions.length !== 1 ? "s" : ""}</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset(); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Interaction</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={4} /> : <DataTable columns={columns} data={interactions as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No industry interactions", description: "Add MOUs, collaborations, guest lectures, and more.", action: canEdit ? { label: "Add Interaction", onClick: () => setDrawerOpen(true) } : undefined }} />}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Faculty Interaction</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="interaction-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Industry / Organization" required {...register("industry")} error={errors.industry?.message} />
                <div><label className="block text-sm font-medium mb-1.5">Type <span className="text-error">*</span></label><select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("type")}>{["MOU","Collaboration","Consultancy","Guest Lecture","Industrial Visit","Project Guidance","Research Partnership"].map((t) => <option key={t} value={t}>{t}</option>)}</select>{errors.type && <p className="field-error">{errors.type.message}</p>}</div>
                <Input label="Topic" required {...register("topic")} error={errors.topic?.message} />
                <Input label="Date" type="date" required {...register("date")} error={errors.date?.message} />
                <div><label className="block text-sm font-medium mb-1.5">Description</label><textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none" rows={3} {...register("description")} /></div>
                <Input label="Outcome" placeholder="Key outcome or result" {...register("outcome")} />
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0"><Button form="interaction-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Interaction</Button></div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Interaction" description="Are you sure?" onConfirm={handleDelete} />
    </div>
  );
}
