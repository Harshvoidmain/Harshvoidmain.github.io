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
import { Plus, GraduationCap, Trash, Pencil } from "lucide-react";
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

interface Training {
  id: number;
  faculty_id: string;
  title: string;
  organization: string;
  start_date: string;
  end_date: string | null;
  category: "fdp" | "sttp" | "resource_person" | "organized" | "ugc_panel" | "other";
  description: string | null;
}

interface TrainingFormData {
  academic_year: string;
  teacher_name: string;
  title: string;
  professional_body: string;
  organization: string;
  start_date: string;
  end_date?: string;
  category: "fdp" | "sttp" | "resource_person" | "organized" | "ugc_panel" | "other";
  course_type_other: string;
  duration_days: string;
  description: string;
}

export default function FacultyTrainingsPage() {
  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Training | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formData, setFormData] = useState<TrainingFormData>({
    academic_year: "2024-25",
    teacher_name: "",
    title: "",
    professional_body: "",
    organization: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    category: "fdp",
    course_type_other: "",
    duration_days: "",
    description: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/faculty/trainings");
      if (!response.ok) {
        throw new Error("Failed to fetch training records");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch training records");
      }
      setItems(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load training records");
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title,
        organization: formData.organization,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        category: formData.category,
        description: JSON.stringify({
          academic_year: formData.academic_year,
          teacher_name: formData.teacher_name,
          professional_body: formData.professional_body,
          course_type_other:
            formData.category === "other" ? formData.course_type_other : "",
          duration_days: formData.duration_days,
        }),
      };
      const response = await fetch("/api/faculty/trainings", {
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
      teacher_name: extras.teacher_name || "",
      title: selectedItem.title,
      professional_body: extras.professional_body || "",
      organization: selectedItem.organization,
      start_date: selectedItem.start_date?.split("T")[0] || new Date().toISOString().split("T")[0],
      end_date: selectedItem.end_date ? selectedItem.end_date.split("T")[0] : "",
      category: selectedItem.category,
      course_type_other: extras.course_type_other || "",
      duration_days: extras.duration_days || "",
      description: selectedItem.description || "",
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
        organization: formData.organization,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        category: formData.category,
        description: JSON.stringify({
          academic_year: formData.academic_year,
          teacher_name: formData.teacher_name,
          professional_body: formData.professional_body,
          course_type_other:
            formData.category === "other" ? formData.course_type_other : "",
          duration_days: formData.duration_days,
        }),
      };
      const response = await fetch(`/api/faculty/trainings/${selectedItem.id}`, {
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
      const response = await fetch(`/api/faculty/trainings/${selectedItem.id}`, {
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

  const filteredItems = useFiltered(items, search, categoryFilter);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">FDP/STTP & Panels</h1>
            <p className="mt-1 text-sm text-gray-500">Training programs attended by faculty members.</p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setFormData({
                academic_year: "2024-25",
                teacher_name: (user?.name ?? user?.username ?? ""),
                title: "",
                professional_body: "",
                organization: "",
                start_date: new Date().toISOString().split("T")[0],
                end_date: "",
                category: "fdp",
                course_type_other: "",
                duration_days: "",
                description: "",
              });
              setAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Record
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gray-800" />
              Your FDP/STTP & Panels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <Input
                placeholder="Search by title or organization"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:flex-1"
              />
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fdp">FDP</SelectItem>
                  <SelectItem value="sttp">STTP</SelectItem>
                  <SelectItem value="resource_person">Resource Person</SelectItem>
                  <SelectItem value="organized">Organized</SelectItem>
                  <SelectItem value="ugc_panel">UGC Panel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  const rows = filteredItems.map((it) => ({
                    Title: it.title,
                    Organization: it.organization,
                    Category: it.category,
                    Start: new Date(it.start_date).toLocaleDateString("en-IN"),
                    End: it.end_date ? new Date(it.end_date).toLocaleDateString("en-IN") : "",
                  }));
                  const header = Object.keys(rows[0] || {});
                  const csv =
                    [header.join(","), ...rows.map((r) => header.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "trainings.csv";
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
                    <TableHead>Organization</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.title}</TableCell>
                      <TableCell>{it.organization}</TableCell>
                      <TableCell className="capitalize">{it.category}</TableCell>
                      <TableCell>{new Date(it.start_date).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>
                        {it.end_date ? new Date(it.end_date).toLocaleDateString("en-IN") : ""}
                      </TableCell>
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
        title="Add FDP/STTP"
        description="Add a new FDP/STTP record"
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Add FDP/STTP"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academic_year">Academic Year (July 1st - June 30th)</Label>
              <Select value={formData.academic_year} onValueChange={(v) => setFormData((p) => ({ ...p, academic_year: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
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
              <Label htmlFor="teacher_name">Faculty Name</Label>
              <p className="text-sm">{formData.teacher_name}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title Of Program</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professional_body">Professional Body Or Organization Associated</Label>
            <Input id="professional_body" name="professional_body" value={formData.professional_body} onChange={(e) => setFormData((p) => ({ ...p, professional_body: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organizing Institute And Location</Label>
            <Input id="organization" name="organization" value={formData.organization} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Course Type</Label>
              <Select value={formData.category} onValueChange={(v) => handleSelectChange("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Course Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fdp">FDP</SelectItem>
                  <SelectItem value="sttp">STTP</SelectItem>
                  <SelectItem value="resource_person">Resource Person</SelectItem>
                  <SelectItem value="organized">Organized</SelectItem>
                  <SelectItem value="ugc_panel">UGC Panel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.category === "other" && (
              <div className="space-y-2">
                <Label htmlFor="course_type_other">other</Label>
                <Input id="course_type_other" name="course_type_other" value={formData.course_type_other} onChange={(e) => setFormData((p) => ({ ...p, course_type_other: e.target.value }))} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Starting Date</Label>
              <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Ending Date</Label>
              <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_days">Total Duration (in days)</Label>
            <Input id="duration_days" name="duration_days" type="number" min="0" value={formData.duration_days} onChange={(e) => setFormData((p) => ({ ...p, duration_days: e.target.value }))} required />
          </div>
        </div>
      </DialogForm>

      <DialogForm
        title="FDP/STTP Details"
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
            <div className="space-y-2">
              <Label>Organization</Label>
              <p className="text-sm">{selectedItem.organization}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <p className="text-sm">{new Date(selectedItem.start_date).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <p className="text-sm">{selectedItem.end_date ? new Date(selectedItem.end_date).toLocaleDateString("en-IN") : "Not specified"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <p className="text-sm">{selectedItem.category}</p>
            </div>
            {selectedItem.description && (() => {
              let extras: any = {};
              try {
                extras = JSON.parse(selectedItem.description || "{}");
              } catch {}
              return (
                <>
                  {extras.academic_year && (
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <p className="text-sm">{extras.academic_year}</p>
                    </div>
                  )}
                  {extras.teacher_name && (
                    <div className="space-y-2">
                      <Label>Name of the Teacher</Label>
                      <p className="text-sm">{extras.teacher_name}</p>
                    </div>
                  )}
                  {extras.professional_body && (
                    <div className="space-y-2">
                      <Label>Professional Body/Organization Associated</Label>
                      <p className="text-sm">{extras.professional_body}</p>
                    </div>
                  )}
                  {extras.course_type_other && selectedItem.category === "other" && (
                    <div className="space-y-2">
                      <Label>Course Type (other)</Label>
                      <p className="text-sm">{extras.course_type_other}</p>
                    </div>
                  )}
                  {extras.duration_days && (
                    <div className="space-y-2">
                      <Label>Total Duration (in days)</Label>
                      <p className="text-sm">{extras.duration_days}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </DialogForm>

      <DialogForm
        title="Edit FDP/STTP"
        description="Update FDP/STTP details"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_academic_year">Academic Year (July 1st -June 30th)</Label>
              <Select value={formData.academic_year} onValueChange={(v) => setFormData((p) => ({ ...p, academic_year: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
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
              <Label htmlFor="edit_teacher_name">Faculty Name</Label>
              <p className="text-sm">{formData.teacher_name}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_title">Title_Of_Program</Label>
            <Input id="edit_title" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_professional_body">Professional_Body_Or_Organization_Associated</Label>
            <Input id="edit_professional_body" name="professional_body" value={formData.professional_body} onChange={(e) => setFormData((p) => ({ ...p, professional_body: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_organization">Organizing Institute And Location</Label>  
            <Input id="edit_organization" name="organization" value={formData.organization} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_category">Course Type</Label>
              <Select value={formData.category} onValueChange={(v) => handleSelectChange("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Course Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fdp">FDP</SelectItem>
                  <SelectItem value="sttp">STTP</SelectItem>
                  <SelectItem value="resource_person">Resource Person</SelectItem>
                  <SelectItem value="organized">Organized</SelectItem>
                  <SelectItem value="ugc_panel">UGC Panel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.category === "other" && (
              <div className="space-y-2">
                <Label htmlFor="edit_course_type_other">other</Label>
                <Input id="edit_course_type_other" name="course_type_other" value={formData.course_type_other} onChange={(e) => setFormData((p) => ({ ...p, course_type_other: e.target.value }))} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_start_date">Starting Date</Label>
              <Input id="edit_start_date" name="start_date" type="date" value={formData.start_date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_end_date">Ending Date</Label>
              <Input id="edit_end_date" name="end_date" type="date" value={formData.end_date} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_duration_days">Total Duration (in days)</Label>
            <Input id="edit_duration_days" name="duration_days" type="number" min="0" value={formData.duration_days} onChange={(e) => setFormData((p) => ({ ...p, duration_days: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_description">Description</Label>
            <Textarea id="edit_description" name="description" rows={3} value={formData.description} onChange={handleInputChange} />
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

function useFiltered(items: Training[], search: string, categoryFilter: string) {
  const s = search.trim().toLowerCase();
  return items.filter((it) => {
    const matchesSearch =
      s === "" ||
      it.title.toLowerCase().includes(s) ||
      it.organization.toLowerCase().includes(s);
    const matchesCategory = categoryFilter === "all" || it.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
}
