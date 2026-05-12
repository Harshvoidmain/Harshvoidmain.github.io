"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { qualificationSchema, type QualificationData } from "@/lib/schemas/faculty.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Qualification } from "@/lib/types/faculty.types";

interface Props { facultyId: string; canEdit: boolean; }

export function QualificationsModule({ facultyId, canEdit }: Props) {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<QualificationData>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: { yearOfPassing: new Date().getFullYear() },
  });

  useEffect(() => {
    return onSnapshot(query(collection(db, `faculty/${facultyId}/qualifications`), orderBy("yearOfPassing", "desc")),
      (snap) => { setQualifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Qualification)); setLoading(false); });
  }, [facultyId]);

  const onSubmit = async (data: QualificationData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, updatedAt: serverTimestamp() };
      if (editId) { await updateDoc(doc(db, `faculty/${facultyId}/qualifications`, editId), payload); toast.success("Qualification updated."); }
      else { await addDoc(collection(db, `faculty/${facultyId}/qualifications`), { ...payload, createdAt: serverTimestamp() }); toast.success("Qualification added."); }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/qualifications`, deleteId));
    toast.success("Deleted."); setDeleteId(null);
  };

  const columns: Column<Qualification>[] = [
    { key: "degree", header: "Degree", cell: (q) => <Badge variant="primary">{q.degree}</Badge> },
    { key: "fieldSpecialization", header: "Field / Specialization", sortable: true, cell: (q) => <span className="font-medium text-sm">{q.fieldSpecialization}</span> },
    { key: "institution", header: "Institution" },
    { key: "yearOfPassing", header: "Year", sortable: true },
    { key: "cgpa", header: "CGPA/Grade", cell: (q) => q.cgpa ? <span>{q.cgpa.toFixed(2)}</span> : q.grade ? <span>{q.grade}</span> : <span className="text-muted">—</span> },
    ...(canEdit ? [{ key: "actions" as keyof Qualification, header: "", headerClassName: "w-16", cell: (q: Qualification) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(q.id!); reset(q as unknown as QualificationData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(q.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{qualifications.length} qualification{qualifications.length !== 1 ? "s" : ""}</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset({ yearOfPassing: new Date().getFullYear() }); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Qualification</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={columns} data={qualifications as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No qualifications added", description: "Add your academic degrees and qualifications.", action: canEdit ? { label: "Add Qualification", onClick: () => setDrawerOpen(true) } : undefined }} />}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Qualification</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="qual-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5">Degree <span className="text-error">*</span></label><select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("degree")}>{["Ph.D.","M.Tech","M.E.","M.Sc.","M.Phil.","MBA","MCA","B.Tech","B.E.","B.Sc.","B.Com","B.A.","Post Doctoral","Other"].map((d) => <option key={d} value={d}>{d}</option>)}</select>{errors.degree && <p className="field-error">{errors.degree.message}</p>}</div>
                <Input label="Field / Specialization" placeholder="Computer Science, Machine Learning, etc." required {...register("fieldSpecialization")} error={errors.fieldSpecialization?.message} />
                <Input label="Institution" placeholder="IIT Delhi, NIT Trichy, etc." required {...register("institution")} error={errors.institution?.message} />
                <Input label="Year of Passing" type="number" required {...register("yearOfPassing", { valueAsNumber: true })} error={errors.yearOfPassing?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="CGPA" type="number" step="0.01" placeholder="8.5" {...register("cgpa", { valueAsNumber: true })} error={errors.cgpa?.message} />
                  <Input label="Grade / Division" placeholder="First Class" {...register("grade")} />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0"><Button form="qual-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Qualification</Button></div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Qualification" description="Are you sure?" onConfirm={handleDelete} />
    </div>
  );
}
