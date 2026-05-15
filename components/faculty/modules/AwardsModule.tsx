import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Download, Search } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import { FileUpload } from "@/components/shared/FileUpload";
import type { Award } from "@/lib/types/faculty.types";
import { isCurrentSession } from "@/lib/utils/session";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function AwardsModule({ facultyId, customId, canEdit }: Props) {
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
    const q = query(collection(db, `faculty/${facultyId}/awards`), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAwards(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Award).filter(a => !a.blocked));
      setLoading(false);
    });
    return () => unsub();
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
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/awards`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Award deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete award.");
    }
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
          <button onClick={() => setDeleteId(a.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ];

  const statsCurrent = [
    { name: "International", value: awards.filter(a => a.category === "International" && isCurrentSession(a.date)).length, color: "#F59E0B" },
    { name: "National", value: awards.filter(a => a.category === "National" && isCurrentSession(a.date)).length, color: "#10B981" },
    { name: "Other", value: awards.filter(a => !["International", "National"].includes(a.category) && isCurrentSession(a.date)).length, color: "#E5E7EB" },
  ];

  const statsCumulative = [
    { name: "Recognition", value: awards.length, color: "#F59E0B" },
    { name: "Placeholder", value: 0, color: "#E5E7EB" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Awards & Recognition</h2>
          <p className="text-sm text-muted">Manage your academic achievements and PhD awards.</p>
        </div>
        {canEdit && (
          <Button variant="accent" onClick={() => { setEditId(null); reset(); setCertUrl(null); setCertName(null); setDrawerOpen(true); }} className="gap-2 h-9">
            <Plus className="w-4 h-4" /> Add Award
          </Button>
        )}
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
              placeholder="Search awards..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        {loading ? <SkeletonTable rows={3} cols={5} /> : (
          <DataTable<Award>
            columns={columns}
            data={awards}
            keyField="id"
            emptyState={{
              title: "No awards recorded yet",
              description: "Start adding your academic achievements and recognitions.",
              action: canEdit ? { label: "Add Award", onClick: () => { reset(); setDrawerOpen(true); } } : undefined
            }}
          />
        )}
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Award</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-xl hover:text-primary transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="award-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Award Name" required {...register("awardName")} error={errors.awardName?.message} />
                <Input label="Awarding Body" required {...register("awardingBody")} error={errors.awardingBody?.message} />
                <Input label="Category" placeholder="Teaching, Research, Service, etc." required {...register("category")} error={errors.category?.message} />
                <Input label="Date" type="date" required {...register("date")} error={errors.date?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" rows={3} {...register("description")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Certificate</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="awards"
                    userId={customId}
                    onUploadComplete={(url, name) => { setCertUrl(url); setCertName(name); }}
                    onRemove={() => { setCertUrl(null); setCertName(null); }}
                    existingFileName={certName ?? undefined}
                    existingUrl={certUrl ?? undefined}
                  />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button form="award-form" type="submit" variant="accent" className="w-full h-11" loading={saving}>{editId ? "Update" : "Add"} Award</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Award" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
