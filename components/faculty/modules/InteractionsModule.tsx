import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { interactionSchema, type InteractionFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import type { Interaction } from "@/lib/types/faculty.types";
import { isCurrentSession } from "@/lib/utils/session";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function InteractionsModule({ facultyId, customId, canEdit }: Props) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<InteractionFormData>({ resolver: zodResolver(interactionSchema) });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/interactions`), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setInteractions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Interaction).filter(i => !i.blocked));
      setLoading(false);
    });
    return () => unsub();
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
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/interactions`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Interaction deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const columns: Column<Interaction>[] = [
    { key: "industry", header: "Industry / Organization", sortable: true, cell: (i) => <span className="font-medium text-sm">{i.industry}</span> },
    { key: "type", header: "Type", cell: (i) => <Badge variant="secondary">{i.type}</Badge> },
    { key: "topic", header: "Topic" },
    { key: "date", header: "Date", sortable: true, cell: (i) => <span className="text-xs text-muted">{formatDate(i.date)}</span> },
    {
      key: "fileName" as keyof Interaction,
      header: "File",
      cell: (i) => i.fileUrl ? (
        <a href={i.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={i.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{ key: "actions" as keyof Interaction, header: "", headerClassName: "w-16", cell: (i: Interaction) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(i.id!); reset(i as unknown as InteractionFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(i.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  const statsCurrent = [
    { name: "MOU", value: interactions.filter(i => i.type === "MOU" && isCurrentSession(i.date)).length, color: "#6366F1" },
    { name: "Consultancy", value: interactions.filter(i => i.type === "Consultancy" && isCurrentSession(i.date)).length, color: "#10B981" },
    { name: "Other", value: interactions.filter(i => !["MOU", "Consultancy"].includes(i.type) && isCurrentSession(i.date)).length, color: "#E5E7EB" },
  ];

  const statsCumulative = [
    { name: "Interactions", value: interactions.length, color: "#0EA5E9" },
    { name: "Placeholder", value: 0, color: "#E5E7EB" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Faculty Interactions</h2>
          <p className="text-sm text-muted">Manage your industry interactions, guest lectures, and research partnerships.</p>
        </div>
        {canEdit && <Button variant="accent" onClick={() => { setEditId(null); reset(); setDrawerOpen(true); }} className="gap-2 h-9"><Plus className="w-4 h-4" /> Add Interaction</Button>}
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
              placeholder="Search interactions..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        {loading ? <SkeletonTable rows={3} cols={4} /> : <DataTable<Interaction> columns={columns} data={interactions} keyField="id" emptyState={{ title: "No industry interactions", description: "Add MOUs, collaborations, guest lectures, and more.", action: canEdit ? { label: "Add Interaction", onClick: () => setDrawerOpen(true) } : undefined }} />}
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Faculty Interaction</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-xl hover:text-primary transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="interaction-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Industry / Organization" required {...register("industry")} error={errors.industry?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type <span className="text-error">*</span></label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none" {...register("type")}>
                    {["MOU","Collaboration","Consultancy","Guest Lecture","Industrial Visit","Project Guidance","Research Partnership"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.type && <p className="field-error text-xs text-red-500 mt-1">{errors.type.message}</p>}
                </div>
                <Input label="Topic" required {...register("topic")} error={errors.topic?.message} />
                <Input label="Date" type="date" required {...register("date")} error={errors.date?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" rows={3} {...register("description")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="interactions"
                    userId={customId}
                    onUploadComplete={(url, name) => { setValue("fileUrl", url); setValue("fileName", name); }}
                    onRemove={() => { setValue("fileUrl", ""); setValue("fileName", ""); }}
                    existingFileName={watch("fileName")}
                    existingUrl={watch("fileUrl")}
                  />
                </div>
                <Input label="Outcome" placeholder="Key outcome or result" {...register("outcome")} />
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button form="interaction-form" type="submit" variant="accent" className="w-full h-11" loading={saving}>{editId ? "Update" : "Add"} Interaction</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Interaction" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
