import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, GraduationCap, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { qualificationSchema, type QualificationData } from "@/lib/schemas/faculty.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import type { Qualification } from "@/lib/types/faculty.types";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function QualificationsModule({ facultyId, customId, canEdit }: Props) {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<QualificationData>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: { yearOfPassing: new Date().getFullYear() },
  });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/qualifications`), orderBy("yearOfPassing", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setQualifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Qualification).filter(q => !q.blocked));
      setLoading(false);
    });
    return () => unsub();
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
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/qualifications`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Qualification deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const columns: Column<Qualification>[] = [
    { key: "degree", header: "Degree", cell: (q) => <Badge variant="primary">{q.degree}</Badge> },
    { key: "fieldSpecialization", header: "Field / Specialization", sortable: true, cell: (q) => <span className="font-medium text-sm">{q.fieldSpecialization}</span> },
    { key: "institution", header: "Institution" },
    { key: "yearOfPassing", header: "Year", sortable: true },
    { key: "cgpa", header: "CGPA/Grade", cell: (q) => q.cgpa ? <span>{q.cgpa.toFixed(2)}</span> : q.grade ? <span>{q.grade}</span> : <span className="text-muted">—</span> },
    {
      key: "fileName" as keyof Qualification,
      header: "File",
      cell: (q) => q.fileUrl ? (
        <a href={q.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={q.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{ key: "actions" as keyof Qualification, header: "", headerClassName: "w-16", cell: (q: Qualification) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(q.id!); reset(q as unknown as QualificationData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(q.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  const statsCumulative = [
    { name: "Ph.D.", value: qualifications.filter(q => q.degree.includes("Ph.D.")).length, color: "#7C3AED" },
    { name: "Masters", value: qualifications.filter(q => q.degree.startsWith("M.")).length, color: "#3B82F6" },
    { name: "Other", value: qualifications.filter(q => !q.degree.includes("Ph.D.") && !q.degree.startsWith("M.")).length, color: "#9CA3AF" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Academic Qualifications</h2>
          <p className="text-sm text-muted">Manage your educational degrees and professional certifications.</p>
        </div>
        {canEdit && <Button variant="accent" onClick={() => { setEditId(null); reset({ yearOfPassing: new Date().getFullYear() }); setDrawerOpen(true); }} className="gap-2 h-9"><Plus className="w-4 h-4" /> Add Qualification</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Latest Degree</h3>
            {qualifications.length > 0 ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/10 border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold">{qualifications[0].degree} in {qualifications[0].fieldSpecialization}</div>
                  <div className="text-xs text-muted">{qualifications[0].institution}, {qualifications[0].yearOfPassing}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 border-2 border-dashed border-border rounded-xl bg-gray-50/50">
                <p className="text-xs text-muted">No degrees found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Educational Profile</h3>
            <div className="flex flex-col items-center justify-center h-48">
              {qualifications.length > 0 ? (
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
                  <p className="text-xs text-muted">No data found</p>
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
              placeholder="Search qualifications..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        {loading ? <SkeletonTable rows={3} cols={5} /> : (
          <DataTable<Qualification>
            columns={columns}
            data={qualifications}
            keyField="id"
            emptyState={{
              title: "No qualifications added",
              description: "Add your academic degrees and qualifications.",
              action: canEdit ? { label: "Add Qualification", onClick: () => setDrawerOpen(true) } : undefined
            }}
          />
        )}
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Qualification</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-xl hover:text-primary transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="qual-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Degree <span className="text-error">*</span></label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none" {...register("degree")}>
                    {["Ph.D.","M.Tech","M.E.","M.Sc.","M.Phil.","MBA","MCA","B.Tech","B.E.","B.Sc.","B.Com","B.A.","Post Doctoral","Other"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.degree && <p className="field-error text-xs text-red-500 mt-1">{errors.degree.message}</p>}
                </div>
                <Input label="Field / Specialization" placeholder="Computer Science, Machine Learning, etc." required {...register("fieldSpecialization")} error={errors.fieldSpecialization?.message} />
                <Input label="Institution" placeholder="IIT Delhi, NIT Trichy, etc." required {...register("institution")} error={errors.institution?.message} />
                <Input label="Year of Passing" type="number" required {...register("yearOfPassing", { valueAsNumber: true })} error={errors.yearOfPassing?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="CGPA" type="number" step="0.01" placeholder="8.5" {...register("cgpa", { valueAsNumber: true })} error={errors.cgpa?.message} />
                  <Input label="Grade / Division" placeholder="First Class" {...register("grade")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="qualifications"
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
              <Button form="qual-form" type="submit" variant="accent" className="w-full h-11" loading={saving}>{editId ? "Update" : "Add"} Qualification</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Qualification" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
