import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { financialSupportSchema, type FinancialSupportFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import type { FinancialSupport } from "@/lib/types/faculty.types";
import { formatCurrency } from "@/lib/utils/formatters";
import { isCurrentSession } from "@/lib/utils/session";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function FinancialSupportModule({ facultyId, customId, canEdit }: Props) {
  const [support, setSupport] = useState<FinancialSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FinancialSupportFormData>({
    resolver: zodResolver(financialSupportSchema),
    defaultValues: { year: new Date().getFullYear() },
  });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/financialSupport`), orderBy("year", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSupport(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FinancialSupport).filter(s => !s.blocked));
      setLoading(false);
    });
    return () => unsub();
  }, [facultyId]);

  const onSubmit = async (data: FinancialSupportFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, updatedAt: serverTimestamp() };
      if (editId) { await updateDoc(doc(db, `faculty/${facultyId}/financialSupport`, editId), payload); toast.success("Updated."); }
      else { await addDoc(collection(db, `faculty/${facultyId}/financialSupport`), { ...payload, createdAt: serverTimestamp() }); toast.success("Added."); }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/financialSupport`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const totalAmount = support.reduce((sum, s) => sum + (s.amount ?? 0), 0);

  const columns: Column<FinancialSupport>[] = [
    { key: "type", header: "Type", cell: (s) => <Badge variant="secondary">{s.type}</Badge> },
    { key: "fundingAgency", header: "Funding Agency", sortable: true, cell: (s) => <span className="font-medium text-sm">{s.fundingAgency}</span> },
    { key: "amount", header: "Amount", sortable: true, cell: (s) => <span className="font-semibold text-sm">{formatCurrency(s.amount)}</span> },
    { key: "purpose", header: "Purpose" },
    { key: "year", header: "Year", sortable: true },
    {
      key: "fileName" as keyof FinancialSupport,
      header: "File",
      cell: (s) => s.fileUrl ? (
        <a href={s.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={s.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{ key: "actions" as keyof FinancialSupport, header: "", headerClassName: "w-16", cell: (s: FinancialSupport) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(s.id!); reset(s as unknown as FinancialSupportFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(s.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  const statsCumulative = [
    { name: "Total Support", value: support.length, color: "#E11D48" },
    { name: "Placeholder", value: 0, color: "#E5E7EB" },
  ];

  const currentSupport = support.filter(s => isCurrentSession(s.year));
  const statsCurrent = [
    { name: "Current Session", value: currentSupport.length, color: "#E11D48" },
    { name: "Placeholder", value: 0, color: "#E5E7EB" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Financial Support</h2>
          <p className="text-sm text-muted">Manage financial support received for professional development, grants, and more.</p>
        </div>
        {canEdit && <Button variant="accent" onClick={() => { setEditId(null); reset({ year: new Date().getFullYear() }); setDrawerOpen(true); }} className="gap-2 h-9"><Plus className="w-4 h-4" /> Add Record</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Current Session Stats</h3>
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-xl bg-gray-50/50 dark:bg-gray-800/10">
              {currentSupport.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ModuleDonutChart data={statsCurrent} size={140} />
                  <div className="mt-4 flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#E11D48]" />
                      <span>Current Records: {currentSupport.length}</span>
                    </div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Cumulative Impact</h3>
              <div className="text-sm font-bold text-primary">{formatCurrency(totalAmount)}</div>
            </div>
            <div className="flex flex-col items-center justify-center h-48">
              {support.length > 0 ? (
                <>
                  <ModuleDonutChart data={statsCumulative} size={140} />
                  <div className="mt-4 flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#E11D48]" />
                      <span>Total Records: {support.length}</span>
                    </div>
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
              placeholder="Search financial records..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        {loading ? <SkeletonTable rows={3} cols={5} /> : (
          <DataTable<FinancialSupport>
            columns={columns}
            data={support}
            keyField="id"
            emptyState={{
              title: "No financial support records",
              description: "Add travel grants, seed money, fellowships, and more.",
              action: canEdit ? { label: "Add Record", onClick: () => setDrawerOpen(true) } : undefined
            }}
          />
        )}
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Financial Support</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-xl hover:text-primary transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="financial-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type <span className="text-error">*</span></label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none" {...register("type")}>
                    {["Travel Grant","Seed Money","Sponsored Project","Scholarship","Fellowship","Conference Support","Equipment Grant"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Input label="Funding Agency" required {...register("fundingAgency")} error={errors.fundingAgency?.message} />
                <Input label="Amount (₹)" type="number" required {...register("amount", { valueAsNumber: true })} error={errors.amount?.message} />
                <Input label="Purpose" required {...register("purpose")} error={errors.purpose?.message} />
                <Input label="Year" type="number" required {...register("year", { valueAsNumber: true })} error={errors.year?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" rows={3} {...register("description")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="financialSupport"
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
              <Button form="financial-form" type="submit" variant="accent" className="w-full h-11" loading={saving}>{editId ? "Update" : "Add"} Record</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Record" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
