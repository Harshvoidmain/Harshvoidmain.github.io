"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { uploadFile, getStoragePath, validateFile } from "@/lib/firebase/storage";
import { researchProjectSchema, type ResearchProjectFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ResearchProject } from "@/lib/types/faculty.types";
import { formatDate, formatCurrency, STATUS_COLORS } from "@/lib/utils/formatters";
import { isCurrentSession } from "@/lib/utils/session";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function ResearchModule({ facultyId, customId, canEdit }: Props) {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ResearchProjectFormData>({
    resolver: zodResolver(researchProjectSchema),
  });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/researchProjects`), orderBy("startDate", "desc"));
    return onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResearchProject).filter(p => !p.blocked));
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
    await updateDoc(doc(db, `faculty/${facultyId}/researchProjects`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
    toast.success("Project deleted."); setDeleteId(null);
  };

  const columns: Column<ResearchProject>[] = [
    { key: "title", header: "Project Title", sortable: true, cell: (p) => <span className="font-medium text-sm">{p.title}</span> },
    { key: "role", header: "Role", cell: (p) => <Badge variant="primary">{p.role}</Badge> },
    { key: "fundingAgency", header: "Funding Agency" },
    { key: "sanctionedAmount", header: "Amount", cell: (p) => <span className="text-sm">{p.sanctionedAmount ? formatCurrency(p.sanctionedAmount) : "—"}</span> },
    { key: "status", header: "Status", sortable: true, cell: (p) => <span className={`status-badge ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</span> },
    {
      key: "fileName" as keyof ResearchProject,
      header: "File",
      cell: (p) => p.fileUrl ? (
        <a href={p.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={p.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
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

  const statsCumulative = [
    { name: "Ongoing", value: projects.filter(p => p.status === "Ongoing").length, color: "#4F46E5" },
    { name: "Completed", value: projects.filter(p => p.status === "Completed").length, color: "#10B981" },
    { name: "Other", value: projects.filter(p => !["Ongoing", "Completed"].includes(p.status)).length, color: "#6366F1" },
  ];

  const statsCurrent = [
    { name: "Ongoing", value: projects.filter(p => p.status === "Ongoing" && isCurrentSession(p.startDate)).length, color: "#4F46E5" },
    { name: "Completed", value: projects.filter(p => p.status === "Completed" && isCurrentSession(p.startDate)).length, color: "#10B981" },
    { name: "Other", value: projects.filter(p => !["Ongoing", "Completed"].includes(p.status) && isCurrentSession(p.startDate)).length, color: "#6366F1" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Research Projects</h2>
          <p className="text-sm text-muted">Manage and track your research projects and grants.</p>
        </div>
        {canEdit && <Button variant="accent" onClick={() => { setEditId(null); reset(); setDrawerOpen(true); }} className="gap-2 h-9"><Plus className="w-4 h-4" /> Add Project</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Current Session Status</h3>
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-xl bg-gray-50/50 dark:bg-gray-800/10">
              {statsCurrent.some(s => s.value > 0) ? (
                <div className="flex flex-col items-center">
                  <ModuleDonutChart data={statsCurrent} size={140} />
                  <div className="mt-4 flex gap-4 text-xs font-medium">
                    {statsCurrent.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span>{s.name}: {s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-border mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted">No session data found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Cumulative Progress</h3>
            <div className="flex flex-col items-center justify-center h-48">
              {statsCumulative.some(s => s.value > 0) ? (
                <>
                  <ModuleDonutChart data={statsCumulative} size={140} />
                  <div className="mt-4 flex gap-4 text-xs font-medium">
                    {statsCumulative.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span>{s.name}: {s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-border mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted">No cumulative data found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 dark:bg-gray-800/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        {loading ? <SkeletonTable rows={3} cols={5} /> : (
          <DataTable<ResearchProject>
            columns={columns}
            data={projects}
            keyField="id"
            emptyState={{
              title: "No research projects found",
              description: "Start adding your funded and departmental research projects.",
              action: canEdit ? { label: "Add Project", onClick: () => { setEditId(null); reset(); setDrawerOpen(true); } } : undefined
            }}
          />
        )}
      </Card>

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
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="researchProjects"
                    userId={customId}
                    onUploadComplete={(url, name) => { setValue("fileUrl", url); setValue("fileName", name); }}
                    onRemove={() => { setValue("fileUrl", ""); setValue("fileName", ""); }}
                    existingFileName={watch("fileName")}
                    existingUrl={watch("fileUrl")}
                  />
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
