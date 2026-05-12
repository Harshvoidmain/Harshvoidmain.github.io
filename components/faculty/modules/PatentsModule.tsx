"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { patentSchema, type PatentFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Patent } from "@/lib/types/faculty.types";
import { formatDate, STATUS_COLORS } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function PatentsModule({ facultyId, canEdit }: Props) {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatentFormData>({ resolver: zodResolver(patentSchema) });

  useEffect(() => {
    return onSnapshot(query(collection(db, `faculty/${facultyId}/patents`), orderBy("dateFiled", "desc")),
      (snap) => { setPatents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Patent)); setLoading(false); });
  }, [facultyId]);

  const onSubmit = async (data: PatentFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, inventors: data.inventors?.split(",").map((s) => s.trim()).filter(Boolean), facultyId, updatedAt: serverTimestamp() };
      if (editId) { await updateDoc(doc(db, `faculty/${facultyId}/patents`, editId), payload); toast.success("Patent updated."); }
      else { await addDoc(collection(db, `faculty/${facultyId}/patents`), { ...payload, createdAt: serverTimestamp() }); toast.success("Patent added."); }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/patents`, deleteId));
    toast.success("Deleted."); setDeleteId(null);
  };

  const columns: Column<Patent>[] = [
    { key: "title", header: "Title", sortable: true, cell: (p) => <span className="font-medium text-sm">{p.title}</span> },
    { key: "applicationNumber", header: "Application No.", cell: (p) => <span className="font-mono text-xs">{p.applicationNumber}</span> },
    { key: "type", header: "Type", cell: (p) => <Badge variant="secondary">{p.type}</Badge> },
    { key: "status", header: "Status", sortable: true, cell: (p) => <span className={`status-badge ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</span> },
    { key: "dateFiled", header: "Date Filed", cell: (p) => <span className="text-xs text-muted">{formatDate(p.dateFiled)}</span> },
    ...(canEdit ? [{ key: "actions" as keyof Patent, header: "", headerClassName: "w-16", cell: (p: Patent) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(p.id!); reset(p as unknown as PatentFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(p.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{patents.length} patent{patents.length !== 1 ? "s" : ""} & copyrights</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset(); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Patent</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={columns} data={patents as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No patents or copyrights", description: "Add your intellectual property.", action: canEdit ? { label: "Add Patent", onClick: () => setDrawerOpen(true) } : undefined }} />}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Patent / Copyright</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="patent-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Title" required {...register("title")} error={errors.title?.message} />
                <Input label="Application Number" required {...register("applicationNumber")} error={errors.applicationNumber?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5">Type</label><select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("type")}><option value="Patent">Patent</option><option value="Copyright">Copyright</option><option value="Design">Design</option></select></div>
                  <div><label className="block text-sm font-medium mb-1.5">Status</label><select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("status")}><option value="Filed">Filed</option><option value="Published">Published</option><option value="Granted">Granted</option><option value="Rejected">Rejected</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Date Filed" type="date" required {...register("dateFiled")} error={errors.dateFiled?.message} />
                  <Input label="Date Granted" type="date" {...register("dateGranted")} />
                </div>
                <Input label="Inventors / Authors" placeholder="Name 1, Name 2" hint="Comma-separated" {...register("inventors")} />
                <div><label className="block text-sm font-medium mb-1.5">Description</label><textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none" rows={3} {...register("description")} /></div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0"><Button form="patent-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Patent</Button></div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Patent" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
