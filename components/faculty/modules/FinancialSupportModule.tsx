"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { financialSupportSchema, type FinancialSupportFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { FinancialSupport } from "@/lib/types/faculty.types";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function FinancialSupportModule({ facultyId, canEdit }: Props) {
  const [support, setSupport] = useState<FinancialSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FinancialSupportFormData>({
    resolver: zodResolver(financialSupportSchema),
    defaultValues: { year: new Date().getFullYear() },
  });

  useEffect(() => {
    return onSnapshot(query(collection(db, `faculty/${facultyId}/financialSupport`), orderBy("year", "desc")),
      (snap) => { setSupport(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FinancialSupport)); setLoading(false); });
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
    await deleteDoc(doc(db, `faculty/${facultyId}/financialSupport`, deleteId));
    toast.success("Deleted."); setDeleteId(null);
  };

  const totalAmount = support.reduce((sum, s) => sum + (s.amount ?? 0), 0);

  const columns: Column<FinancialSupport>[] = [
    { key: "type", header: "Type", cell: (s) => <Badge variant="secondary">{s.type}</Badge> },
    { key: "fundingAgency", header: "Funding Agency", sortable: true, cell: (s) => <span className="font-medium text-sm">{s.fundingAgency}</span> },
    { key: "amount", header: "Amount", sortable: true, cell: (s) => <span className="font-semibold text-sm">{formatCurrency(s.amount)}</span> },
    { key: "purpose", header: "Purpose" },
    { key: "year", header: "Year", sortable: true },
    ...(canEdit ? [{ key: "actions" as keyof FinancialSupport, header: "", headerClassName: "w-16", cell: (s: FinancialSupport) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(s.id!); reset(s as unknown as FinancialSupportFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(s.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm text-muted">{support.length} record{support.length !== 1 ? "s" : ""}</span>
          {support.length > 0 && <span className="text-sm font-semibold text-[rgb(var(--text-primary))] ml-3">Total: {formatCurrency(totalAmount)}</span>}
        </div>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset({ year: new Date().getFullYear() }); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Record</Button>}
      </div>
      {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={columns} data={support as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No financial support records", description: "Add travel grants, seed money, fellowships, and more.", action: canEdit ? { label: "Add Record", onClick: () => setDrawerOpen(true) } : undefined }} />}

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Financial Support</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="financial-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5">Type <span className="text-error">*</span></label><select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("type")}>{["Travel Grant","Seed Money","Sponsored Project","Scholarship","Fellowship","Conference Support","Equipment Grant"].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <Input label="Funding Agency" required {...register("fundingAgency")} error={errors.fundingAgency?.message} />
                <Input label="Amount (₹)" type="number" required {...register("amount", { valueAsNumber: true })} error={errors.amount?.message} />
                <Input label="Purpose" required {...register("purpose")} error={errors.purpose?.message} />
                <Input label="Year" type="number" required {...register("year", { valueAsNumber: true })} error={errors.year?.message} />
                <div><label className="block text-sm font-medium mb-1.5">Description</label><textarea className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none" rows={3} {...register("description")} /></div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0"><Button form="financial-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Record</Button></div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Record" description="Are you sure?" onConfirm={handleDelete} />
    </div>
  );
}
