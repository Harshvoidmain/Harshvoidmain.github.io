"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { workshopSchema, type WorkshopFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Workshop } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";

interface Props { facultyId: string; canEdit: boolean; }

export function WorkshopsModule({ facultyId, canEdit }: Props) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isOrganized, setIsOrganized] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: { isOrganized: false, mode: "Offline" },
  });

  useEffect(() => {
    return onSnapshot(
      query(collection(db, `faculty/${facultyId}/workshops`), orderBy("startDate", "desc")),
      (snap) => { setWorkshops(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workshop)); setLoading(false); }
    );
  }, [facultyId]);

  const onSubmit = async (data: WorkshopFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, facultyId, updatedAt: serverTimestamp() };
      if (editId) {
        await updateDoc(doc(db, `faculty/${facultyId}/workshops`, editId), payload);
        toast.success("Workshop updated.");
      } else {
        await addDoc(collection(db, `faculty/${facultyId}/workshops`), { ...payload, createdAt: serverTimestamp() });
        toast.success("Workshop added.");
      }
      setDrawerOpen(false);
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, `faculty/${facultyId}/workshops`, deleteId));
    toast.success("Deleted."); setDeleteId(null);
  };

  const attended = workshops.filter((w) => !w.isOrganized);
  const organized = workshops.filter((w) => w.isOrganized);

  const commonCols = (sub: Workshop[]): Column<Workshop>[] => [
    { key: "programName", header: "Program Name", sortable: true, cell: (w) => <span className="font-medium text-sm">{w.programName}</span> },
    { key: "type", header: "Type", cell: (w) => <Badge variant="secondary">{w.type}</Badge> },
    { key: "mode", header: "Mode", cell: (w) => <Badge variant={w.mode === "Online" ? "primary" : "default"}>{w.mode}</Badge> },
    { key: "startDate", header: "Date", sortable: true, cell: (w) => <span className="text-xs text-muted">{formatDate(w.startDate)}</span> },
    { key: "durationDays", header: "Duration", cell: (w) => w.durationDays ? `${w.durationDays} day${w.durationDays > 1 ? "s" : ""}` : "—" },
    ...(canEdit ? [{
      key: "actions" as keyof Workshop, header: "", headerClassName: "w-16",
      cell: (w: Workshop) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditId(w.id!); reset(w as unknown as WorkshopFormData); setIsOrganized(w.isOrganized); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(w.id!)} className="p-1.5 rounded text-muted hover:text-error hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">{workshops.length} program{workshops.length !== 1 ? "s" : ""}</span>
        {canEdit && <Button variant="accent" size="sm" onClick={() => { setEditId(null); reset({ isOrganized: false, mode: "Offline" }); setIsOrganized(false); setDrawerOpen(true); }}><Plus className="w-4 h-4" /> Add Program</Button>}
      </div>

      <Tabs defaultValue="attended">
        <TabsList>
          <TabsTrigger value="attended">Attended ({attended.length})</TabsTrigger>
          <TabsTrigger value="organized">Organized ({organized.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="attended">
          {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={commonCols(attended)} data={attended as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No attended programs" }} />}
        </TabsContent>
        <TabsContent value="organized">
          {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={[...commonCols(organized), { key: "participantsCount", header: "Participants", cell: (w) => w.participantsCount ?? "—" }]} data={organized as unknown as Record<string, unknown>[]} keyField="id" emptyState={{ title: "No organized programs" }} />}
        </TabsContent>
      </Tabs>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Workshop / Training</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="workshop-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Program Name" required {...register("programName")} error={errors.programName?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Type <span className="text-error">*</span></label>
                    <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("type")}>
                      {["FDP","STTP","Workshop","Seminar","Conference","Training"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Mode</label>
                    <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("mode")}>
                      {["Online","Offline","Hybrid"].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <input type="checkbox" {...register("isOrganized")} onChange={(e) => { setIsOrganized(e.target.checked); }} className="accent-primary" />
                  <label className="text-sm">I organized this program</label>
                </div>
                <Input label={isOrganized ? "Sponsoring Agency" : "Organizer"} {...register(isOrganized ? "sponsoringAgency" : "organizer")} />
                {isOrganized && <Input label="Number of Participants" type="number" {...register("participantsCount", { valueAsNumber: true })} />}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date" type="date" required {...register("startDate")} error={errors.startDate?.message} />
                  <Input label="End Date" type="date" {...register("endDate")} />
                </div>
                <Input label="Duration (days)" type="number" {...register("durationDays", { valueAsNumber: true })} />
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button form="workshop-form" type="submit" variant="accent" className="w-full" loading={saving}>{editId ? "Update" : "Add"} Program</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Program" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
