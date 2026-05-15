"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, ExternalLink, Edit, Trash2, Loader2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { uploadFile, getStoragePath, validateFile } from "@/lib/firebase/storage";
import { publicationSchema, type PublicationFormData } from "@/lib/schemas/publication.schema";
import { getDocument } from "@/lib/firebase/firestore";
import type { Faculty } from "@/lib/types/faculty.types";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Publication, PublicationType } from "@/lib/types/faculty.types";
import { isCurrentSession } from "@/lib/utils/session";

const PUB_TYPE_COLORS: Record<string, string> = {
  "Journal Article": "bg-blue-100 text-blue-800",
  "Conference Paper": "bg-purple-100 text-purple-800",
  "Book": "bg-green-100 text-green-800",
  "Book Chapter": "bg-emerald-100 text-emerald-800",
  "Workshop Paper": "bg-orange-100 text-orange-800",
  "Technical Report": "bg-gray-100 text-gray-800",
  "Patent": "bg-yellow-100 text-yellow-800",
  "Thesis": "bg-red-100 text-red-800",
};

interface Props {
  facultyId: string;
  customId: string;
  canEdit: boolean;
}

export function PublicationsModule({ facultyId, customId, canEdit }: Props) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [doiLoading, setDoiLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PublicationFormData>({
    resolver: zodResolver(publicationSchema),
    defaultValues: { year: new Date().getFullYear(), citationCount: 0 },
  });

  const doiValue = watch("doi");

  useEffect(() => {
    const q = query(collection(db, `faculty/${facultyId}/publications`), orderBy("year", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPublications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Publication).filter(p => !p.blocked));
      setLoading(false);
    });
    return () => unsub();
  }, [facultyId]);

  const fetchDOI = async () => {
    if (!doiValue) return;
    setDoiLoading(true);
    try {
      const resp = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doiValue)}`);
      if (!resp.ok) throw new Error("Not found");
      const data = await resp.json();
      const work = data.message;
      setValue("title", work.title?.[0] ?? "");
      setValue("authors", work.author?.map((a: { given?: string; family?: string }) => `${a.given ?? ""} ${a.family ?? ""}`.trim()).join(", ") ?? "");
      setValue("year", work.published?.["date-parts"]?.[0]?.[0] ?? new Date().getFullYear());
      setValue("venue", work["container-title"]?.[0] ?? "");
      setValue("abstract", work.abstract ?? "");
      toast.success("DOI metadata fetched successfully.");
    } catch {
      toast.error("DOI not found. Please fill in the details manually.");
    } finally {
      setDoiLoading(false);
    }
  };

  const openAdd = () => { setEditId(null); reset({ year: new Date().getFullYear(), citationCount: 0 }); setDrawerOpen(true); };
  const openEdit = (pub: Publication) => {
    setEditId(pub.id!);
    reset({
      title: pub.title, type: pub.type, authors: pub.authors.join(", "),
      year: pub.year, venue: pub.venue, doi: pub.doi, abstract: pub.abstract,
      url: pub.url, citationCount: pub.citationCount, issn: pub.issn, isbn: pub.isbn,
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data: PublicationFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        authors: data.authors.split(",").map((a) => a.trim()),
        facultyId,
        updatedAt: serverTimestamp(),
      };
      if (editId) {
        await updateDoc(doc(db, `faculty/${facultyId}/publications`, editId), payload);
        toast.success("Publication updated.");
      } else {
        await addDoc(collection(db, `faculty/${facultyId}/publications`), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Publication added.");
      }
      setDrawerOpen(false);
    } catch {
      toast.error("Failed to save publication.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await updateDoc(doc(db, `faculty/${facultyId}/publications`, deleteId), { blocked: true, updatedAt: serverTimestamp() });
      toast.success("Publication deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete publication.");
    }
  };

  const columns: Column<Publication>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      cell: (p) => (
        <span className="font-medium text-sm line-clamp-2">
          {p.title.length > 60 ? p.title.slice(0, 60) + "…" : p.title}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (p) => (
        <span className={`status-badge ${PUB_TYPE_COLORS[p.type] ?? "bg-gray-100 text-gray-800"}`}>
          {p.type}
        </span>
      ),
    },
    { key: "year", header: "Year", sortable: true },
    { key: "venue", header: "Venue", cell: (p) => <span className="text-sm text-muted line-clamp-1">{p.venue}</span> },
    {
      key: "doi",
      header: "DOI",
      cell: (p) => p.doi ? (
        <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          DOI <ExternalLink className="w-3 h-3" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    { key: "citationCount", header: "Citations", sortable: true, cell: (p) => <span className="text-sm">{p.citationCount ?? 0}</span> },
    {
      key: "fileName" as keyof Publication,
      header: "File",
      cell: (p) => p.fileUrl ? (
        <a href={p.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-muted hover:text-primary transition-colors" title={p.fileName} onClick={(e) => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : <span className="text-muted text-xs">—</span>,
    },
    ...(canEdit ? [{
      key: "actions" as keyof Publication,
      header: "",
      headerClassName: "w-16",
      cell: (p: Publication) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openEdit(p)} className="p-1.5 rounded text-muted hover:text-primary hover:bg-primary/5 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(p.id!)} className="p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ];

  const statsCumulative = [
    { name: "Journal", value: publications.filter(p => p.type === "Journal Article").length, color: "#4F46E5" },
    { name: "Conference", value: publications.filter(p => p.type === "Conference Paper").length, color: "#10B981" },
    { name: "Other", value: publications.filter(p => !["Journal Article", "Conference Paper"].includes(p.type)).length, color: "#6366F1" },
  ];

  const statsCurrent = [
    { name: "Journal", value: publications.filter(p => p.type === "Journal Article" && isCurrentSession(p.year)).length, color: "#4F46E5" },
    { name: "Conference", value: publications.filter(p => p.type === "Conference Paper" && isCurrentSession(p.year)).length, color: "#10B981" },
    { name: "Other", value: publications.filter(p => !["Journal Article", "Conference Paper"].includes(p.type) && isCurrentSession(p.year)).length, color: "#6366F1" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Publications</h2>
          <p className="text-sm text-muted">Manage and track your research output.</p>
        </div>
        {canEdit && (
          <Button variant="accent" onClick={openAdd} className="gap-2 h-9">
            <Plus className="w-4 h-4" /> Add Publication
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Current Session (2025-26)</h3>
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
              placeholder="Search publications..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
        <DataTable<Publication>
          columns={columns}
          data={publications}
          keyField="id"
          emptyState={{
            title: "No publications added yet",
            description: "Start adding your research papers and conference articles.",
            action: canEdit ? { label: "Add Publication", onClick: openAdd } : undefined
          }}
        />
      </Card>

      {/* Add/Edit Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="drawer flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-lg font-heading font-semibold">{editId ? "Edit" : "Add"} Publication</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-muted hover:text-[rgb(var(--text-primary))]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="pub-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Title" placeholder="Full publication title" required {...register("title")} error={errors.title?.message} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type <span className="text-error">*</span></label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...register("type")}>
                    <option value="">Select type…</option>
                    {["Journal Article","Conference Paper","Book","Book Chapter","Workshop Paper","Technical Report","Patent","Thesis"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.type && <p className="field-error">{errors.type.message}</p>}
                </div>
                <Input label="Authors" placeholder="Author 1, Author 2, Author 3" required hint="Comma-separated" {...register("authors")} error={errors.authors?.message} />
                <Input label="Year of Publication" type="number" required {...register("year", { valueAsNumber: true })} error={errors.year?.message} />
                <Input label="Publication Venue" placeholder="Journal/Conference name" required {...register("venue")} error={errors.venue?.message} />

                <div>
                  <label className="block text-sm font-medium mb-1.5">DOI</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="10.1234/example"
                      {...register("doi")}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={fetchDOI} disabled={!doiValue || doiLoading}>
                      {doiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                    </Button>
                  </div>
                </div>

                <Input label="URL" type="url" placeholder="https://…" {...register("url")} error={errors.url?.message} />
                <Input label="Citation Count" type="number" {...register("citationCount", { valueAsNumber: true })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ISSN" placeholder="1234-5678" {...register("issn")} />
                  <Input label="ISBN" placeholder="978-…" {...register("isbn")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Attachment (Proof)</label>
                  <FileUpload
                    accept="document"
                    category="faculty"
                    moduleId="publications"
                    userId={customId}
                    onUploadComplete={(url, name) => { setValue("fileUrl", url); setValue("fileName", name); }}
                    onRemove={() => { setValue("fileUrl", ""); setValue("fileName", ""); }}
                    existingFileName={watch("fileName")}
                    existingUrl={watch("fileUrl")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Abstract</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md border border-border bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    rows={4}
                    placeholder="Publication abstract…"
                    {...register("abstract")}
                  />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button form="pub-form" type="submit" variant="accent" className="w-full" loading={saving}>
                {editId ? "Update Publication" : "Add Publication"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Publication"
        description="Are you sure you want to delete this publication? This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
