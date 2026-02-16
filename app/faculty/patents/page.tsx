 "use client";
 
 import { useEffect, useState } from "react";
 import MainLayout from "@/app/components/layout/MainLayout";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 import { DialogForm } from "@/app/components/ui/dialog-form";
import { Plus, BookMarked, Trash, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Patent {
  id: number;
  faculty_id: string;
  title: string;
   type: "patent" | "copyright" | "design" | "trademark";
   application_no: string | null;
   status: string | null;
   filing_date: string;
   assignee: string | null;
   description: string | null;
 }
 
interface PatentFormData {
  academic_year: string;
  branch: string;
  title: string;
  type: "patent" | "copyright" | "design" | "trademark";
  application_no?: string;
  status?: string;
  filing_date: string;
  contributors: string;
  participants: string;
  report_url: string;
}
 
 export default function FacultyPatentsPage() {
   const [items, setItems] = useState<Patent[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [addDialogOpen, setAddDialogOpen] = useState(false);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Patent | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formData, setFormData] = useState<PatentFormData>({
    academic_year: "2024-25",
    branch: "Computers",
    title: "",
    type: "patent",
    application_no: "",
    status: "",
    filing_date: new Date().toISOString().split("T")[0],
    contributors: "",
    participants: "",
    report_url: "",
  });
 
   useEffect(() => {
     fetchItems();
   }, []);
 
   const fetchItems = async () => {
     try {
       setLoading(true);
       const response = await fetch("/api/faculty/patents");
       if (!response.ok) {
         throw new Error("Failed to fetch IP records");
       }
       const data = await response.json();
       if (!data.success) {
         throw new Error(data.message || "Failed to fetch IP records");
       }
       setItems(data.data || []);
       setError(null);
     } catch (err) {
       setError(err instanceof Error ? err.message : "Failed to load IP records");
     } finally {
       setLoading(false);
     }
   };
 
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };
 
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      setFormData((p) => ({ ...p, report_url: data.url }));
      toast.success("Report uploaded");
    } else {
      toast.error(data.error || "Failed to upload report");
    }
  };
 
   const handleAddSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       setIsSubmitting(true);
      const payload = {
        title: formData.title,
        type: formData.type,
        application_no: formData.application_no || null,
        status: formData.status || null,
        filing_date: formData.filing_date,
        description: JSON.stringify({
          academic_year: formData.academic_year,
          branch: formData.branch,
          contributors: formData.contributors,
          participants: formData.participants,
          report_url: formData.report_url,
        }),
      };
      const response = await fetch("/api/faculty/patents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
       const data = await response.json();
       if (!response.ok || !data.success) {
         throw new Error(data.message || "Failed to add record");
       }
       toast.success("Record added successfully");
       setAddDialogOpen(false);
       await fetchItems();
     } catch (err) {
       toast.error(err instanceof Error ? err.message : "Failed to add record");
     } finally {
       setIsSubmitting(false);
     }
   };
 
  const handleEdit = () => {
    if (!selectedItem) return;
    let extras: any = {};
    try {
      extras = selectedItem.description ? JSON.parse(selectedItem.description) : {};
    } catch {}
    setFormData({
      academic_year: extras.academic_year || "2024-25",
      branch: extras.branch || "Computers",
      title: selectedItem.title,
      type: selectedItem.type,
      application_no: selectedItem.application_no || "",
      status: selectedItem.status || "",
      filing_date: selectedItem.filing_date?.split("T")[0] || new Date().toISOString().split("T")[0],
      contributors: extras.contributors || "",
      participants: extras.participants || "",
      report_url: extras.report_url || "",
    });
    setEditDialogOpen(true);
  };
 
   const handleEditSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedItem) return;
     try {
       setIsSubmitting(true);
      const payload = {
        title: formData.title,
        type: formData.type,
        application_no: formData.application_no || null,
        status: formData.status || null,
        filing_date: formData.filing_date,
        description: JSON.stringify({
          academic_year: formData.academic_year,
          branch: formData.branch,
          contributors: formData.contributors,
          participants: formData.participants,
          report_url: formData.report_url,
        }),
      };
      const response = await fetch(`/api/faculty/patents/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
       const data = await response.json();
       if (!response.ok || !data.success) {
         throw new Error(data.message || "Failed to update record");
       }
       toast.success("Record updated successfully");
       setEditDialogOpen(false);
       setSelectedItem(null);
       await fetchItems();
     } catch (err) {
       toast.error(err instanceof Error ? err.message : "Failed to update record");
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const handleDeleteClick = () => {
     setDeleteDialogOpen(true);
   };
 
  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`/api/faculty/patents/${selectedItem.id}`, {
        method: "DELETE",
      });
       let data: any = {};
       try {
         data = await response.json();
       } catch {}
       if (!response.ok || !(data as any).success) {
         throw new Error((data as any).message || "Failed to delete record");
       }
       toast.success("Record deleted successfully");
       setDeleteDialogOpen(false);
       setSelectedItem(null);
       await fetchItems();
     } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete record");
    }
  };

  const filteredItems = useFiltered(items, search, typeFilter);

  return (
    <MainLayout>
       <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h1 className="text-2xl font-semibold text-gray-900">Patents & Copyrights</h1>
             <p className="mt-1 text-sm text-gray-500">Intellectual property filings and registrations</p>
           </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setFormData({
                academic_year: "2024-25",
                branch: "Computers",
                title: "",
                type: "patent",
                application_no: "",
                status: "",
                filing_date: new Date().toISOString().split("T")[0],
                contributors: "",
                participants: "",
                report_url: "",
              });
              setAddDialogOpen(true);
            }}
          >
             <Plus className="w-4 h-4" />
             Add IP Record
           </Button>
         </div>
 
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-gray-700" />
              Your IP Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <Input
                placeholder="Search by title or assignee"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:flex-1"
              />
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="patent">Patent</SelectItem>
                  <SelectItem value="copyright">Copyright</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="trademark">Trademark</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  const rows = filteredItems.map((it) => ({
                    Title: it.title,
                    Type: it.type,
                    ApplicationNo: it.application_no || "",
                    Status: it.status || "",
                    FilingDate: new Date(it.filing_date).toLocaleDateString("en-IN"),
                    Assignee: it.assignee || "",
                  }));
                  const header = Object.keys(rows[0] || {});
                  const csv =
                    [header.join(","), ...rows.map((r) => header.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "patents.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </Button>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="bg-red-50 text-red-500 p-4 rounded">
                <p>{error}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-gray-500">No records found. Use the button to add one.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Application No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filing Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.title}</TableCell>
                      <TableCell className="capitalize">{it.type}</TableCell>
                      <TableCell>{it.application_no || ""}</TableCell>
                      <TableCell>{it.status || ""}</TableCell>
                      <TableCell>{new Date(it.filing_date).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(it);
                              setViewDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(it);
                              handleEdit();
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(it);
                              handleDeleteClick();
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
 
      <DialogForm
        title="Patents and Copyrights"
        description="Add a patent or copyright record"
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Add Record"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={formData.academic_year} onValueChange={(v) => setFormData((p) => ({ ...p, academic_year: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Year--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2020-21">2020-21</SelectItem>
                  <SelectItem value="2021-22">2021-22</SelectItem>
                  <SelectItem value="2022-23">2022-23</SelectItem>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input name="branch" value={formData.branch} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title of the Patent/ Copyright</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => handleSelectChange("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patent">Patent</SelectItem>
                  <SelectItem value="copyright">Copyright</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="trademark">Trademark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status of Patent</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="granted">Granted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input id="filing_date" name="filing_date" type="date" value={formData.filing_date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input id="application_no" name="application_no" value={formData.application_no} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Names of Contributors</Label>
            <Textarea id="contributors" name="contributors" rows={2} value={formData.contributors} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label>Name of the participants</Label>
            <Textarea id="participants" name="participants" rows={2} value={formData.participants} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label>Upload Activity report in the appropriate template</Label>
            <Input type="file" onChange={(e) => handleFileUpload(e.target.files?.[0] || null)} />
            {formData.report_url && (
              <a href={formData.report_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                View uploaded report
              </a>
            )}
          </div>
        </div>
      </DialogForm>
 
       <DialogForm
         title="Record Details"
         open={viewDialogOpen}
         onOpenChange={setViewDialogOpen}
         onSubmit={(e) => {
           e.preventDefault();
           setViewDialogOpen(false);
         }}
         submitLabel="Close"
         cancelLabel="Close"
       >
         {selectedItem && (
           <div className="space-y-4">
             <div className="flex justify-end space-x-2">
               <Button type="button" variant="outline" size="sm" className="flex items-center gap-1" onClick={handleEdit}>
                 <Pencil size={14} />
                 Edit
               </Button>
               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                 onClick={handleDeleteClick}
               >
                 <Trash size={14} />
                 Delete
               </Button>
             </div>
             <div className="space-y-2">
               <Label>Title</Label>
               <p className="text-sm">{selectedItem.title}</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Type</Label>
                 <p className="text-sm">{selectedItem.type}</p>
               </div>
               <div className="space-y-2">
                 <Label>Filing Date</Label>
                 <p className="text-sm">{new Date(selectedItem.filing_date).toLocaleDateString("en-IN")}</p>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Application No.</Label>
                 <p className="text-sm">{selectedItem.application_no || "Not specified"}</p>
               </div>
               <div className="space-y-2">
                 <Label>Status</Label>
                 <p className="text-sm">{selectedItem.status || "Not specified"}</p>
               </div>
             </div>
            {(() => {
              let extras: any = {};
              try {
                extras = selectedItem.description ? JSON.parse(selectedItem.description) : {};
              } catch {}
              return (
                <>
                  {extras.academic_year && (
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <p className="text-sm">{extras.academic_year}</p>
                    </div>
                  )}
                  {extras.branch && (
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <p className="text-sm">{extras.branch}</p>
                    </div>
                  )}
                  {extras.contributors && (
                    <div className="space-y-2">
                      <Label>Names of Contributors</Label>
                      <p className="text-sm whitespace-pre-wrap">{extras.contributors}</p>
                    </div>
                  )}
                  {extras.participants && (
                    <div className="space-y-2">
                      <Label>Name of the participants</Label>
                      <p className="text-sm whitespace-pre-wrap">{extras.participants}</p>
                    </div>
                  )}
                  {extras.report_url && (
                    <div className="space-y-2">
                      <Label>Activity Report</Label>
                      <a href={extras.report_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                        View report
                      </a>
                    </div>
                  )}
                </>
              );
            })()}
           </div>
         )}
       </DialogForm>
 
      <DialogForm
        title="Edit Patent/Copyright"
        description="Update patent or copyright details"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={formData.academic_year} onValueChange={(v) => setFormData((p) => ({ ...p, academic_year: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Year--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2020-21">2020-21</SelectItem>
                  <SelectItem value="2021-22">2021-22</SelectItem>
                  <SelectItem value="2022-23">2022-23</SelectItem>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input name="branch" value={formData.branch} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_title">Title of the Patent/ Copyright</Label>
            <Input id="edit_title" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => handleSelectChange("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patent">Patent</SelectItem>
                  <SelectItem value="copyright">Copyright</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="trademark">Trademark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status of Patent</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="granted">Granted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input id="edit_filing_date" name="filing_date" type="date" value={formData.filing_date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input id="edit_application_no" name="application_no" value={formData.application_no} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Names of Contributors</Label>
            <Textarea id="edit_contributors" name="contributors" rows={2} value={formData.contributors} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label>Name of the participants</Label>
            <Textarea id="edit_participants" name="participants" rows={2} value={formData.participants} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label>Upload Activity report in the appropriate template</Label>
            <Input type="file" onChange={(e) => handleFileUpload(e.target.files?.[0] || null)} />
            {formData.report_url && (
              <a href={formData.report_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                View uploaded report
              </a>
            )}
          </div>
        </div>
      </DialogForm>
 
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
             <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function useFiltered(items: Patent[], search: string, typeFilter: string) {
  const s = search.trim().toLowerCase();
  return items.filter((it) => {
    const matchesSearch =
      s === "" ||
      it.title.toLowerCase().includes(s) ||
      (it.assignee || "").toLowerCase().includes(s);
    const matchesType = typeFilter === "all" || it.type === typeFilter;
    return matchesSearch && matchesType;
  });
}
