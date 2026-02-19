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
import { Plus, Briefcase, Trash, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/auth-provider";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Support {
  id: number;
  faculty_id: string;
  scheme_name: string;
   sponsor: string;
   amount: number;
   date: string;
   purpose: string | null;
   project_ref: string | null;
 }
 
interface SupportFormData {
  academic_year: string;
  branch: string;
  teacher_name: string;
  scheme_name: string;
  activity_type: string;
  activity_type_other: string;
  activity_title_other: string;
  sponsor: string;
  amount: number;
  date: string;
  date_to?: string;
  details: string;
  doc_url: string;
  project_ref: string;
}
 
 export default function FacultyFinancialSupportPage() {
   const [items, setItems] = useState<Support[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [addDialogOpen, setAddDialogOpen] = useState(false);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Support | null>(null);
  const [search, setSearch] = useState("");
  const [sponsorFilter, setSponsorFilter] = useState<string>("all");
  const [formData, setFormData] = useState<SupportFormData>({
    academic_year: "2024-25",
    branch: "Computers",
    teacher_name: "",
    scheme_name: "",
    activity_type: "",
    activity_type_other: "",
    activity_title_other: "",
    sponsor: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    date_to: "",
    details: "",
    doc_url: "",
    project_ref: "",
  });
  const { user } = useAuth();
 
   useEffect(() => {
     fetchItems();
   }, []);
 
   const fetchItems = async () => {
     try {
       setLoading(true);
       const response = await fetch("/api/faculty/financial-support");
       if (!response.ok) {
         throw new Error("Failed to fetch financial support records");
       }
       const data = await response.json();
       if (!data.success) {
         throw new Error(data.message || "Failed to fetch financial support records");
       }
       setItems(data.data || []);
       setError(null);
     } catch (err) {
       setError(err instanceof Error ? err.message : "Failed to load financial support records");
     } finally {
       setLoading(false);
     }
   };
 
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };
 
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      setFormData((p) => ({ ...p, doc_url: data.url }));
      toast.success("Document uploaded");
    } else {
      toast.error(data.error || "Failed to upload document");
    }
  };
 
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        scheme_name: formData.scheme_name,
        sponsor: formData.sponsor,
        amount: formData.amount,
        date: formData.date,
        purpose: JSON.stringify({
          academic_year: formData.academic_year,
          branch: formData.branch,
          teacher_name: formData.teacher_name,
          activity_type: formData.activity_type,
          activity_type_other: formData.activity_type === "others" ? formData.activity_type_other : "",
          activity_title_other: formData.activity_type === "others" ? formData.activity_title_other : "",
          date_to: formData.date_to,
          details: formData.details,
          doc_url: formData.doc_url,
        }),
        project_ref: formData.project_ref || "",
      };
      const response = await fetch("/api/faculty/financial-support", {
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
      extras = selectedItem.purpose ? JSON.parse(selectedItem.purpose) : {};
    } catch {}
    setFormData({
      academic_year: extras.academic_year || "2024-25",
      branch: extras.branch || "Computers",
      teacher_name: extras.teacher_name || "",
      scheme_name: selectedItem.scheme_name,
      activity_type: extras.activity_type || "",
      activity_type_other: extras.activity_type_other || "",
      activity_title_other: extras.activity_title_other || "",
      sponsor: selectedItem.sponsor,
      amount: Number(selectedItem.amount || 0),
      date: selectedItem.date?.split("T")[0] || new Date().toISOString().split("T")[0],
      date_to: extras.date_to || "",
      details: extras.details || "",
      doc_url: extras.doc_url || "",
      project_ref: selectedItem.project_ref || "",
    });
    setEditDialogOpen(true);
  };
 
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setIsSubmitting(true);
      const payload = {
        scheme_name: formData.scheme_name,
        sponsor: formData.sponsor,
        amount: formData.amount,
        date: formData.date,
        purpose: JSON.stringify({
          academic_year: formData.academic_year,
          branch: formData.branch,
          teacher_name: formData.teacher_name,
          activity_type: formData.activity_type,
          activity_type_other: formData.activity_type === "others" ? formData.activity_type_other : "",
          activity_title_other: formData.activity_type === "others" ? formData.activity_title_other : "",
          date_to: formData.date_to,
          details: formData.details,
          doc_url: formData.doc_url,
        }),
        project_ref: formData.project_ref || "",
      };
      const response = await fetch(`/api/faculty/financial-support/${selectedItem.id}`, {
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
      const response = await fetch(`/api/faculty/financial-support/${selectedItem.id}`, {
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

  const filteredItems = useFiltered(items, search, sponsorFilter);

  return (
    <MainLayout>
       <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h1 className="text-2xl font-semibold text-gray-900">Financial Support</h1>
             <p className="mt-1 text-sm text-gray-500">Grants, sponsorships, institutional support</p>
           </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setFormData({
                academic_year: "2024-25",
                branch: "Computers",
                teacher_name: (user?.name ?? user?.username ?? ""),
                scheme_name: "",
                activity_type: "",
                activity_type_other: "",
                activity_title_other: "",
                sponsor: "",
                amount: 0,
                date: new Date().toISOString().split("T")[0],
                date_to: "",
                details: "",
                doc_url: "",
                project_ref: "",
              });
              setAddDialogOpen(true);
            }}
          >
             <Plus className="w-4 h-4" />
             Add Support
           </Button>
         </div>
 
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-900" />
              Your Financial Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <Input
                placeholder="Search by scheme or sponsor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:flex-1"
              />
              <Select
                value={sponsorFilter}
                onValueChange={(v) => setSponsorFilter(v)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by sponsor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sponsors</SelectItem>
                  {[...new Set(items.map((i) => i.sponsor))].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  const rows = filteredItems.map((it) => ({
                    Scheme: it.scheme_name,
                    Sponsor: it.sponsor,
                    Amount: it.amount,
                    Date: new Date(it.date).toLocaleDateString("en-IN"),
                    Purpose: it.purpose || "",
                    ProjectRef: it.project_ref || "",
                  }));
                  const header = Object.keys(rows[0] || {});
                  const csv =
                    [header.join(","), ...rows.map((r) => header.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "financial_support.csv";
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
                    <TableHead>Scheme</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.scheme_name}</TableCell>
                      <TableCell>{it.sponsor}</TableCell>
                      <TableCell>₹{it.amount}</TableCell>
                      <TableCell>{new Date(it.date).toLocaleDateString("en-IN")}</TableCell>
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
        title="Add Financial Support"
        description="Add a financial support record"
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Add Support"
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
            <div className="space-y-2">
              <Label>Faculty Name</Label>
              <p className="text-sm">{formData.teacher_name}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title of the Program</Label>
            <Input id="scheme_name" name="scheme_name" value={formData.scheme_name} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Activity for which Financial Support was provided</Label>
              <Select value={formData.activity_type} onValueChange={(v) => setFormData((p) => ({ ...p, activity_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Type of Activity--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fdp">FDP</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.activity_type === "others" && (
              <div className="space-y-2">
                <Label>Enter Title of Activity</Label>
                <Input name="activity_title_other" value={formData.activity_title_other} onChange={handleInputChange} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date (From)</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label>Date (To)</Label>
              <Input id="date_to" name="date_to" type="date" value={formData.date_to} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea id="details" name="details" rows={3} value={formData.details} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label>Enter Name of the Activity</Label>
            <Input id="sponsor" name="sponsor" value={formData.sponsor} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label>Enter Amount of Support</Label>
            <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label>Submit Supporting Document</Label>
            <Input type="file" onChange={(e) => handleFileUpload(e.target.files?.[0] || null)} />
            {formData.doc_url && (
              <a href={formData.doc_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                View uploaded document
              </a>
            )}
          </div>
        </div>
      </DialogForm>
 
      <DialogForm
        title="Support Details"
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
               <Label>Scheme Name</Label>
               <p className="text-sm">{selectedItem.scheme_name}</p>
             </div>
             <div className="space-y-2">
               <Label>Sponsor</Label>
               <p className="text-sm">{selectedItem.sponsor}</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Amount</Label>
                 <p className="text-sm">₹{selectedItem.amount}</p>
               </div>
               <div className="space-y-2">
                 <Label>Date</Label>
                 <p className="text-sm">{new Date(selectedItem.date).toLocaleDateString("en-IN")}</p>
               </div>
             </div>
            {(() => {
              let extras: any = {};
              try {
                extras = selectedItem.purpose ? JSON.parse(selectedItem.purpose) : {};
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
                  {extras.teacher_name && (
                    <div className="space-y-2">
                      <Label>Name Of The Teacher</Label>
                      <p className="text-sm">{extras.teacher_name}</p>
                    </div>
                  )}
                  {extras.activity_type && (
                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <p className="text-sm">{extras.activity_type}</p>
                    </div>
                  )}
                  {extras.activity_type === "others" && extras.activity_title_other && (
                    <div className="space-y-2">
                      <Label>Title of Activity</Label>
                      <p className="text-sm">{extras.activity_title_other}</p>
                    </div>
                  )}
                  {extras.details && (
                    <div className="space-y-2">
                      <Label>Details</Label>
                      <p className="text-sm">{extras.details}</p>
                    </div>
                  )}
                  {extras.date_to && (
                    <div className="space-y-2">
                      <Label>Date (To)</Label>
                      <p className="text-sm">{new Date(extras.date_to).toLocaleDateString("en-IN")}</p>
                    </div>
                  )}
                  {extras.doc_url && (
                    <div className="space-y-2">
                      <Label>Supporting Document</Label>
                      <a href={extras.doc_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                        View document
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
        title="Edit Financial Support"
        description="Update financial support details"
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
            <div className="space-y-2">
              <Label>Faculty Name</Label>
              <p className="text-sm">{formData.teacher_name}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title of the Program</Label>
            <Input id="edit_scheme_name" name="scheme_name" value={formData.scheme_name} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Activity for which Financial Support was provided</Label>
              <Select value={formData.activity_type} onValueChange={(v) => setFormData((p) => ({ ...p, activity_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="--Select Type of Activity--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fdp">FDP</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.activity_type === "others" && (
              <div className="space-y-2">
                <Label>Enter Title of Activity</Label>
                <Input name="activity_title_other" value={formData.activity_title_other} onChange={handleInputChange} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date (From)</Label>
              <Input id="edit_date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label>Date (To)</Label>
              <Input id="edit_date_to" name="date_to" type="date" value={formData.date_to} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea id="edit_details" name="details" rows={3} value={formData.details} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label>Enter Name of the Activity</Label>
            <Input id="edit_sponsor" name="sponsor" value={formData.sponsor} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label>Enter Amount of Support</Label>
            <Input id="edit_amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label>Submit Supporting Document</Label>
            <Input type="file" onChange={(e) => handleFileUpload(e.target.files?.[0] || null)} />
            {formData.doc_url && (
              <a href={formData.doc_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                View uploaded document
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

function useFiltered(items: Support[], search: string, sponsorFilter: string) {
  const s = search.trim().toLowerCase();
  return items.filter((it) => {
    const matchesSearch =
      s === "" ||
      it.scheme_name.toLowerCase().includes(s) ||
      it.sponsor.toLowerCase().includes(s);
    const matchesSponsor = sponsorFilter === "all" || it.sponsor === sponsorFilter;
    return matchesSearch && matchesSponsor;
  });
}
