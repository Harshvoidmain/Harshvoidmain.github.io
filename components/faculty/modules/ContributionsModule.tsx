import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { contributionSchema, type ContributionFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import type { Contribution } from "@/lib/types/faculty.types";
import { isCurrentSession } from "@/lib/utils/session";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function ContributionsModule({ facultyId, customId, canEdit }: Props) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ContributionFormData>({ resolver: zodResolver(contributionSchema) });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/contributions`), orderBy("startDate", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setContributions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Contribution).filter(c => !c.blocked));
      setLoading(false);
    });
    return () => unsub();
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
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/contributions`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Contribution deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const columns: Column<Contribution>[] = [
    { key: "contributionType", header: "Type", cell: (c) => <Badge variant="secondary">{c.contributionType}</Badge> },
    { key: "organization", header: "Organization", sortable: true, cell: (c) => <span className="font-medium text-sm">{c.organization}</span> },
    { key: "role", header: "Role" },
    { key: "startDate", header: "From", cell: (c) => <span className="text-xs text-muted">{formatDate(c.startDate)}</span> },
    { key: "endDate", header: "To", cell: (c) => c.endDate ? <span className="text-xs text-muted">{formatDate(c.endDate)}</span> : <span className="text-xs text-muted">Present</span> },
    {
      key: "fileName" as keyof Contribution,
      header: "File",
      cell: (c) => c.fileUrl ? (
        <a href={c.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={c.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{ key: "actions" as keyof Contribution, header: "", headerClassName: "w-16", cell: (c: Contribution) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(c.id!); reset(c as unknown as ContributionFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(c.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  const statsCurrent = [
    { name: "Reviewer", value: contributions.filter(c => c.contributionType === "Reviewer" && isCurrentSession(c.startDate)).length, color: "#6366F1" },
    { name: "Session Chair", value: contributions.filter(c => c.contributionType === "Session Chair" && isCurrentSession(c.startDate)).length, color: "#10B981" },
    { name: "Other", value: contributions.filter(c => !["Reviewer", "Session Chair"].includes(c.contributionType) && isCurrentSession(c.startDate)).length, color: "#E5E7EB" },
  ];

  const statsCumulative = [
    { name: "Contributions", value: contributions.length, color: "#10B981" },
    { name: "Placeholder", value: 0, color: "#E5E7EB" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Contributions</h2>
          <p className="text-sm text-muted">Manage your service and contributions to department, institution, and community.</p>
        </div>
        {canEdit && <Button variant="accent" onClick={() => { setEditId(null); reset(); setDrawerOpen(true); }} className="gap-2 h-9"><Plus className="w-4 h-4" /> Add Contribution</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Current Session Status</h3>
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-xl bg-gray-50/50 dark:bg-gray-800/10">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-border mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted">No session data found</p>
              </div>
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
              placeholder="Search contributions..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable<Contribution> columns={columns} data={contributions} keyField="id" emptyState={{ title: "No contributions", description: "Add your contributions to boards, committees, and more.", action: canEdit ? { label: "Add Contribution", onClick: () => setDrawerOpen(true) } : undefined }} />}
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Contribution</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-xl hover:text-primary transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="contribution-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Contribution Type <span className="text-error">*</span></label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none" {...register("contributionType")}>
                    {["Board Member","Reviewer","Committee Member","Editorial Board","Session Chair","Keynote Speaker","Resource Person","External Examiner"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.contributionType && <p className="field-error text-xs text-red-500 mt-1">{errors.contributionType.message}</p>}
                </div>
                <Input label="Organization" required {...register("organization")} error={errors.organization?.message} />
                <Input label="Role Description" required {...register("role")} error={errors.role?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="From Date" type="date" required {...register("startDate")} error={errors.startDate?.message} />
                  <Input label="To Date" type="date" {...register("endDate")} hint="Leave blank if ongoing" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" rows={3} {...register("description")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="contributions"
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
              <Button form="contribution-form" type="submit" variant="accent" className="w-full h-11" loading={saving}>{editId ? "Update" : "Add"} Contribution</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Contribution" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
