import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { membershipSchema, type MembershipFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import type { Membership } from "@/lib/types/faculty.types";
import { isCurrentSession } from "@/lib/utils/session";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function MembershipsModule({ facultyId, customId, canEdit }: Props) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MembershipFormData>({ resolver: zodResolver(membershipSchema), defaultValues: { isActive: true } });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/memberships`), orderBy("validFrom", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMemberships(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Membership).filter(m => !m.blocked));
      setLoading(false);
    });
    return () => unsub();
  }, [facultyId]);

  const onSubmit = async (data: MembershipFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, updatedAt: serverTimestamp() };
      if (editId) { await updateDoc(doc(db, `faculty/${facultyId}/memberships`, editId), payload); toast.success("Membership updated."); }
      else { await addDoc(collection(db, `faculty/${facultyId}/memberships`), { ...payload, createdAt: serverTimestamp() }); toast.success("Membership added."); }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/memberships`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Membership deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const columns: Column<Membership>[] = [
    { key: "organizationName", header: "Organization", sortable: true, cell: (m) => <span className="font-medium text-sm">{m.organizationName}</span> },
    { key: "membershipType", header: "Type", cell: (m) => <Badge variant="secondary">{m.membershipType}</Badge> },
    { key: "memberId", header: "Member ID", cell: (m) => m.memberId ? <span className="font-mono text-xs">{m.memberId}</span> : <span className="text-muted">—</span> },
    { key: "validFrom", header: "Valid From", cell: (m) => <span className="text-xs">{formatDate(m.validFrom)}</span> },
    { key: "validUntil", header: "Valid Until", cell: (m) => m.validUntil ? <span className="text-xs">{formatDate(m.validUntil)}</span> : <span className="text-muted text-xs">Lifetime</span> },
    { key: "isActive", header: "Status", cell: (m) => <Badge variant={m.isActive ? "success" : "default"}>{m.isActive ? "Active" : "Expired"}</Badge> },
    {
      key: "fileName" as keyof Membership,
      header: "File",
      cell: (m) => m.fileUrl ? (
        <a href={m.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={m.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{ key: "actions" as keyof Membership, header: "", headerClassName: "w-16", cell: (m: Membership) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setEditId(m.id!); reset(m as unknown as MembershipFormData); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(m.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}] : []),
  ];

  const statsCurrent = [
    { name: "Active", value: memberships.filter(m => m.isActive && isCurrentSession(m.validFrom)).length, color: "#6366F1" },
    { name: "Life Member", value: memberships.filter(m => m.membershipType === "Life Member" && isCurrentSession(m.validFrom)).length, color: "#10B981" },
    { name: "Other", value: memberships.filter(m => !m.isActive && isCurrentSession(m.validFrom)).length, color: "#E5E7EB" },
  ];

  const statsCumulative = [
    { name: "Active", value: memberships.filter(m => m.isActive).length, color: "#10B981" },
    { name: "Inactive", value: memberships.filter(m => !m.isActive).length, color: "#9CA3AF" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Professional Memberships</h2>
          <p className="text-sm text-muted">Manage your memberships in professional organizations and bodies.</p>
        </div>
        {canEdit && <Button variant="accent" onClick={() => { setEditId(null); reset({ isActive: true }); setDrawerOpen(true); }} className="gap-2 h-9"><Plus className="w-4 h-4" /> Add Membership</Button>}
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
              placeholder="Search memberships..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable<Membership> columns={columns} data={memberships} keyField="id" emptyState={{ title: "No professional memberships", description: "Add your professional society memberships.", action: canEdit ? { label: "Add Membership", onClick: () => setDrawerOpen(true) } : undefined }} />}
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Membership</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-xl hover:text-primary transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="membership-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Organization Name" required {...register("organizationName")} error={errors.organizationName?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Membership Type</label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none" {...register("membershipType")}>
                    {["Life Member","Fellow","Associate Member","Member","Senior Member"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Input label="Member ID" placeholder="MEM12345" {...register("memberId")} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Valid From" type="date" required {...register("validFrom")} error={errors.validFrom?.message} />
                  <Input label="Valid Until" type="date" {...register("validUntil")} hint="Leave blank for lifetime" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gray-50/50 dark:bg-gray-800/10">
                  <input type="checkbox" {...register("isActive")} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" defaultChecked />
                  <label className="text-sm font-medium">Currently active membership</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="memberships"
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
              <Button form="membership-form" type="submit" variant="accent" className="w-full h-11" loading={saving}>{editId ? "Update" : "Add"} Membership</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Membership" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
