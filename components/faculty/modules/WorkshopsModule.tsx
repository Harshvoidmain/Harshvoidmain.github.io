import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, doc } from "firebase/firestore";
import { Plus, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { workshopSchema, type WorkshopFormData } from "@/lib/schemas/publication.schema";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { uploadFile, getStoragePath, validateFile } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import type { Workshop } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";
import { isCurrentSession } from "@/lib/utils/session";

interface Props { facultyId: string; customId: string; canEdit: boolean; }

export function WorkshopsModule({ facultyId, customId, canEdit }: Props) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isOrganized, setIsOrganized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: { isOrganized: false, mode: "Offline" },
  });

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/workshops`), orderBy("startDate", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setWorkshops(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workshop).filter(w => !w.blocked));
      setLoading(false);
    });
    return () => unsub();
  }, [facultyId]);

  const onSubmit = async (data: WorkshopFormData) => {
    setSaving(true);
    try {
      let fileUrl = data.fileUrl;
      let fileName = data.fileName;

      if (selectedFile) {
        const validation = validateFile(selectedFile, "document");
        if (!validation.valid) {
          toast.error(validation.error);
          setSaving(false);
          return;
        }
        const path = getStoragePath("faculty", "workshops", customId, selectedFile.name);
        fileUrl = await uploadFile(path, selectedFile);
        fileName = selectedFile.name;
      }

      const payload = { ...data, facultyId, fileUrl, fileName, updatedAt: serverTimestamp() };
      if (editId) {
        await updateDoc(doc(db, `faculty/${facultyId}/workshops`, editId), payload);
        toast.success("Workshop updated.");
      } else {
        await addDoc(collection(db, `faculty/${facultyId}/workshops`), { ...payload, createdAt: serverTimestamp() });
        toast.success("Workshop added.");
      }
      setDrawerOpen(false);
      setSelectedFile(null);
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/workshops`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Workshop deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const attended = workshops.filter((w) => !w.isOrganized);
  const organized = workshops.filter((w) => w.isOrganized);

  const commonCols = (sub: Workshop[]): Column<Workshop>[] => [
    { key: "programName", header: "Program Name", sortable: true, cell: (w) => <span className="font-medium text-sm">{w.programName}</span> },
    { key: "type", header: "Type", cell: (w) => <Badge variant="secondary">{w.type}</Badge> },
    { key: "mode", header: "Mode", cell: (w) => <Badge variant={w.mode === "Online" ? "primary" : "default"}>{w.mode}</Badge> },
    { key: "startDate", header: "Date", sortable: true, cell: (w) => <span className="text-xs text-muted">{formatDate(w.startDate)}</span> },
    { key: "durationDays", header: "Duration", cell: (w) => w.durationDays ? `${w.durationDays} day${w.durationDays > 1 ? "s" : ""}` : "—" },
    {
      key: "fileName" as keyof Workshop,
      header: "File",
      cell: (w) => w.fileUrl ? (
        <a href={w.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={w.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{
      key: "actions" as keyof Workshop, header: "", headerClassName: "w-16",
      cell: (w: Workshop) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditId(w.id!); reset(w as unknown as WorkshopFormData); setIsOrganized(w.isOrganized); setDrawerOpen(true); }} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(w.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ];

  const statsCumulative = [
    { name: "Attended", value: attended.length, color: "#4F46E5" },
    { name: "Organized", value: organized.length, color: "#10B981" },
  ];

  const statsCurrent = [
    { name: "Attended", value: attended.filter(w => isCurrentSession(w.startDate)).length, color: "#4F46E5" },
    { name: "Organized", value: organized.filter(w => isCurrentSession(w.startDate)).length, color: "#10B981" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Workshops & Conferences</h2>
          <p className="text-sm text-muted">Manage events attended or organized including seminars and training.</p>
        </div>
        {canEdit && (
          <Button variant="accent" onClick={() => { setEditId(null); reset({ isOrganized: false, mode: "Offline" }); setIsOrganized(false); setDrawerOpen(true); }} className="gap-2 h-9">
            <Plus className="w-4 h-4" /> Add Program
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Current Session Stats</h3>
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
              placeholder="Search programs..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        <Tabs defaultValue="attended" className="p-0">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="attended">Attended ({attended.length})</TabsTrigger>
            <TabsTrigger value="organized">Organized ({organized.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="attended" className="mt-4">
            {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable<Workshop> columns={commonCols(attended)} data={attended} keyField="id" emptyState={{ title: "No attended programs" }} />}
          </TabsContent>
          <TabsContent value="organized" className="mt-4">
            {loading ? <SkeletonTable rows={3} cols={5} /> : <DataTable<Workshop> columns={[...commonCols(organized), { key: "participantsCount" as keyof Workshop, header: "Participants", cell: (w) => w.participantsCount ?? "—" }]} data={organized} keyField="id" emptyState={{ title: "No organized programs" }} />}
          </TabsContent>
        </Tabs>
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Workshop / Training</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-xl hover:text-primary transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="workshop-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Program Name" required {...register("programName")} error={errors.programName?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Type <span className="text-error">*</span></label>
                    <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none" {...register("type")}>
                      {["FDP","STTP","Workshop","Seminar","Conference","Training"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Mode</label>
                    <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none" {...register("mode")}>
                      {["Online","Offline","Hybrid"].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-gray-50/50 dark:bg-gray-800/10">
                  <input type="checkbox" {...register("isOrganized")} onChange={(e) => { setIsOrganized(e.target.checked); }} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                  <label className="text-sm font-medium">I organized this program</label>
                </div>
                <Input label={isOrganized ? "Sponsoring Agency" : "Organizer"} {...register(isOrganized ? "sponsoringAgency" : "organizer")} />
                {isOrganized && <Input label="Number of Participants" type="number" {...register("participantsCount", { valueAsNumber: true })} />}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date" type="date" required {...register("startDate")} error={errors.startDate?.message} />
                  <Input label="End Date" type="date" {...register("endDate")} />
                </div>
                <Input label="Duration (days)" type="number" {...register("durationDays", { valueAsNumber: true })} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {watch("fileUrl") && !selectedFile && (
                      <p className="text-xs text-muted">Current file: {watch("fileName")}</p>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button form="workshop-form" type="submit" variant="accent" className="w-full h-11" loading={saving}>{editId ? "Update" : "Add"} Program</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Program" description="Are you sure? This cannot be undone." onConfirm={handleDelete} />
    </div>
  );
}
