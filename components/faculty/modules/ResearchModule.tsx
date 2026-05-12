"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { researchProjectSchema, type ResearchProjectFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ResearchProject } from "@/lib/types/faculty.types";
import { formatDate, formatCurrency, STATUS_COLORS } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function ResearchModule({ facultyId, canEdit }: Props) {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResearchProjectFormData>({
    resolver: zodResolver(researchProjectSchema),
  });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/researchProjects`), orderBy("startDate", "desc"));
    return onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResearchProject));
      setLoading(false);
    });
  }, [facultyId]);

  const onSubmit = async (data: ResearchProjectFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        coInvestigators: data.coInvestigators?.split(",").map((s) => s.trim()).filter(Boolean),
        startDate: serverTimestamp(),
        facultyId,
        updatedAt: serverTimestamp(),
      };
      if (editId) {
        await updateDoc(doc(db, `faculty/${facultyId}/researchProjects`, editId), payload);
        toast.success("Research project updated.");
      } else {
        await addDoc(collection(db, `faculty/${facultyId}/researchProjects`), { ...payload, createdAt: serverTimestamp() });
        toast.success("Research project added.");
      }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save research project."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/researchProjects`, deleteId));
    toast.success("Project deleted."); setDeleteId(null);
  };

  const columns: Column<ResearchProject>[] = [
    { key: "title", header: "Project Title", sortable: true, cell: (p) => <span className="font-medium text-sm">{p.title}</span> },
    { key: "role", header: "Role", cell: (p) => <Badge variant="primary">{p.role}</Badge> },
    { key: "fundingAgency", header: "Funding Agency" },
    { key: "sanctionedAmount", header: "Amount", cell: (p) => <span className="text-sm">{p.sanctionedAmount ? formatCurrency(p.sanctionedAmount) : "—"}</span> },
    { key: "status", header: "Status", sortable: true, cell: (p) => <span className={`status-badge ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</span> },
    ...(canEdit ? [{
      key: "actions" as keyof ResearchProject,
      header: "", headerClassName: "w-16",
      cell: (p: ResearchProject) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditId(p.id!); reset({ ...p as unknown as ResearchProjectFormData }); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(p.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset(); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Project</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={5} /> : (
        <DataTable columns={columns} data={projects as unknown as Record<string, unknown>[]} keyField="id"
          emptyState={{ title: "No research projects", description: "Add your research projects here.", action: canEdit ? { label: "Add Project", onClick: () => { reset(); setDrawerOpen(true); } } : undefined }} />
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Research Project</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted hover:text-[rgb(var(--text-primary))]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="research-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Project Title" required {...register("title")} error={errors.title?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Role <span className="text-error">*</span></label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("role")}>
                    <option value="">Select role…</option>
                    <option value="PI">Principal Investigator (PI)</option>
                    <option value="Co-PI">Co-Principal Investigator (Co-PI)</option>
                    <option value="Collaborator">Collaborator</option>
                  </select>
                </div>
                <Input label="Funding Agency" required {...register("fundingAgency")} error={errors.fundingAgency?.message} />
                <Input label="Sanctioned Amount (₹)" type="number" {...register("sanctionedAmount", { valueAsNumber: true })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date" type="date" required {...register("startDate")} error={errors.startDate?.message} />
                  <Input label="End Date" type="date" {...register("endDate")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Status <span className="text-error">*</span></label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("status")}>
                    <option value="">Select status…</option>
                    {["Ongoing","Completed","Submitted","Approved","Rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Input label="Co-Investigators" placeholder="Name 1, Name 2" hint="Comma-separated" {...register("coInvestigators")} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Abstract</label>
                  <textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} {...register("abstract")} />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button form="research-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Project</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Research Project" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
