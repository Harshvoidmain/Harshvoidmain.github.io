"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { awardSchema, type AwardFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/shared/FileUpload";
import type { Award } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function AwardsModule({ facultyId, canEdit }: Props) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [certName, setCertName] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AwardFormData>({
    resolver: zodResolver(awardSchema),
  });

  useEffect(() => {
    return onSnapshot(
      query(collection(db, `faculty/${facultyId}/awards`), orderBy("date", "desc")),
      (snap) => { setAwards(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Award)); setLoading(false); }
    );
  }, [facultyId]);

  const onSubmit = async (data: AwardFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, certificateUrl: certUrl, fileName: certName, updatedAt: serverTimestamp() };
      if (editId) {
        await updateDoc(doc(db, `faculty/${facultyId}/awards`, editId), payload);
        toast.success("Award updated.");
      } else {
        await addDoc(collection(db, `faculty/${facultyId}/awards`), { ...payload, createdAt: serverTimestamp() });
        toast.success("Award added.");
      }
      setDrawerOpen(false); setCertUrl(null); setCertName(null);
    } catch { toast.error("Failed to save award."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/awards`, deleteId));
    toast.success("Award deleted."); setDeleteId(null);
  };

  const columns: Column<Award>[] = [
    { key: "awardName", header: "Award Name", sortable: true, cell: (a) => <span className="font-medium text-sm">{a.awardName}</span> },
    { key: "awardingBody", header: "Awarding Body" },
    { key: "category", header: "Category" },
    { key: "date", header: "Date", sortable: true, cell: (a) => <span className="text-xs text-muted">{formatDate(a.date)}</span> },
    {
      key: "certificateUrl",
      header: "Certificate",
      cell: (a) => a.certificateUrl ? (
        <a href={a.certificateUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Download className="w-3 h-3" /> Download
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{
      key: "actions" as keyof Award, header: "", headerClassName: "w-16",
      cell: (a: Award) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditId(a.id!); reset({ ...a as unknown as AwardFormData }); setCertUrl(a.certificateUrl ?? null); setCertName(a.fileName ?? null); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(a.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{awards.length} award{awards.length !== 1 ? "s" : ""}</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset(); setCertUrl(null); setCertName(null); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Award</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={5} /> : (
        <DataTable columns={columns} data={awards as unknown as Record<string, unknown>[]} keyField="id"
          emptyState={{ title: "No awards recorded", description: "Add your awards and recognitions.", action: canEdit ? { label: "Add Award", onClick: () => { reset(); setDrawerOpen(true); } } : undefined }} />
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Award</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="award-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Award Name" required {...register("awardName")} error={errors.awardName?.message} />
                <Input label="Awarding Body" required {...register("awardingBody")} error={errors.awardingBody?.message} />
                <Input label="Category" placeholder="Teaching, Research, Service, etc." required {...register("category")} error={errors.category?.message} />
                <Input label="Date" type="date" required {...register("date")} error={errors.date?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} {...register("description")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Certificate</label>
                  <FileUpload
                    accept="document"
                    storagePath={`${facultyId}/awards`}
                    onUploadComplete={(url, name) => { setCertUrl(url); setCertName(name); }}
                    onRemove={() => { setCertUrl(null); setCertName(null); }}
                    existingFileName={certName ?? undefined}
                    existingUrl={certUrl ?? undefined}
                  />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button form="award-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Award</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Award" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
