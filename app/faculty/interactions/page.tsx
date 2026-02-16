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
import { Plus, Users, Trash, Pencil } from "lucide-react";
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

interface Interaction {
  id: number;
  faculty_id: string;
  role:
    | "Reviewer"
    | "Session Chair"
    | "Invited Talks"
    | "Syllabus Setting"
    | "BoS"
    | "USSC Interview Expert"
    | "PhD related activity"
    | "Academic Auditer"
    | "Industry Interaction"
    | "Any other Please Specify"
    | "speaker"
    | "auditor"
    | "judge"
    | "panelist"
    | "other";
  event: string;
  institution: string;
  date: string;
  description: string | null;
}

interface InteractionFormData {
  academic_year: string;
  branch: string;
  faculty_name: string;
  role: Interaction["role"];
  other_interaction: string;
  details: string;
  date: string;
  level: "Local" | "State" | "International" | "National";
  duration: string;
  description: string;
  certificateFile: File | null;
}

export default function FacultyInteractionsPage() {
  const [items, setItems] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Interaction | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [formData, setFormData] = useState<InteractionFormData>({
    academic_year: "2024-25",
    branch: "",
    faculty_name: "",
    role: "Reviewer",
    other_interaction: "",
    details: "",
    date: new Date().toISOString().split("T")[0],
    level: "Local",
    duration: "",
    description: "",
    certificateFile: null,
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/faculty/interactions");
      if (!response.ok) {
        throw new Error("Failed to fetch interactions");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch interactions");
      }
      setItems(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interactions");
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, certificateFile: file }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("academic_year", formData.academic_year);
      fd.append("branch", formData.branch);
      fd.append("faculty_name", formData.faculty_name);
      fd.append("role", formData.role);
      fd.append("other_interaction", formData.other_interaction);
      fd.append("details", formData.details);
      fd.append("date", formData.date);
      fd.append("level", formData.level);
      fd.append("duration", formData.duration);
      fd.append("description", formData.description);
      if (formData.certificateFile) {
        fd.append("certificate", formData.certificateFile);
      }
      const response = await fetch("/api/faculty/interactions", {
        method: "POST",
        body: fd,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add interaction");
      }
      toast.success("Interaction added successfully");
      setAddDialogOpen(false);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add interaction");
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
      branch: selectedItem.institution || "",
      faculty_name: extras.faculty_name || "",
      role: selectedItem.role,
      other_interaction: extras.other_interaction || "",
      details: selectedItem.event,
      date: selectedItem.date?.split("T")[0] || new Date().toISOString().split("T")[0],
      level: extras.level || "Local",
      duration: extras.duration || "",
      description: selectedItem.description || "",
      certificateFile: null,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("academic_year", formData.academic_year);
      fd.append("branch", formData.branch);
      fd.append("faculty_name", formData.faculty_name);
      fd.append("role", formData.role);
      fd.append("other_interaction", formData.other_interaction);
      fd.append("details", formData.details);
      fd.append("date", formData.date);
      fd.append("level", formData.level);
      fd.append("duration", formData.duration);
      fd.append("description", formData.description);
      if (formData.certificateFile) {
        fd.append("certificate", formData.certificateFile);
      }
      const response = await fetch(`/api/faculty/interactions/${selectedItem.id}`, {
        method: "PUT",
        body: fd,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update interaction");
      }
      toast.success("Interaction updated successfully");
      setEditDialogOpen(false);
      setSelectedItem(null);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update interaction");
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
      const response = await fetch(`/api/faculty/interactions/${selectedItem.id}`, {
        method: "DELETE",
      });
      let data: any = {};
      try {
        data = await response.json();
      } catch {}
      if (!response.ok || !(data as any).success) {
        throw new Error((data as any).message || "Failed to delete interaction");
      }
      toast.success("Interaction deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete interaction");
    }
  };

  const filteredItems = useFiltered(items, search, roleFilter);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Faculty Interactions</h1>
            <p className="mt-1 text-sm text-gray-500">Speaker, auditor, judge, and panels</p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setFormData({
                academic_year: "2024-25",
                branch: "",
                faculty_name: (user?.name ?? user?.username ?? ""),
                role: "Reviewer",
                other_interaction: "",
                details: "",
                date: new Date().toISOString().split("T")[0],
                level: "Local",
                duration: "",
                description: "",
                certificateFile: null,
              });
              setAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Interaction
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-700" />
              Your Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <Input
                placeholder="Search by event or institution"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:flex-1"
              />
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="speaker">Speaker</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="judge">Judge</SelectItem>
                  <SelectItem value="panelist">Panelist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  const rows = filteredItems.map((it) => ({
                    Event: it.event,
                    Institution: it.institution,
                    Role: it.role,
                    Date: new Date(it.date).toLocaleDateString("en-IN"),
                  }));
                  const header = Object.keys(rows[0] || {});
                  const csv =
                    [header.join(","), ...rows.map((r) => header.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "interactions.csv";
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
              <p className="text-gray-500">No interactions found. Use the button to add one.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.event}</TableCell>
                      <TableCell>{it.institution}</TableCell>
                      <TableCell className="capitalize">{it.role}</TableCell>
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
        title="Add Interaction"
        description="Add a new interaction record"
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Add Interaction"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academic_year">Academic Year</Label>
              <Select value={formData.academic_year} onValueChange={(v) => handleSelectChange("academic_year", v)}>
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
              <Label htmlFor="branch">Branch</Label>
              <Select value={formData.branch} onValueChange={(v) => handleSelectChange("branch", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="EXTC">EXTC</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Computers">Computers</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Humanities">Humanities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty_name">Faculty Name</Label>
              <p className="text-sm">{formData.faculty_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Nature of interaction</Label>
              <Select value={formData.role} onValueChange={(v) => handleSelectChange("role", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reviewer">Reviewer</SelectItem>
                  <SelectItem value="Session Chair">Session Chair</SelectItem>
                  <SelectItem value="Invited Talks">Invited Talks</SelectItem>
                  <SelectItem value="Syllabus Setting">Syllabus Setting</SelectItem>
                  <SelectItem value="BoS">BoS</SelectItem>
                  <SelectItem value="USSC Interview Expert">USSC Interview Expert</SelectItem>
                  <SelectItem value="PhD related activity">PhD related activity</SelectItem>
                  <SelectItem value="Academic Auditer">Academic Auditer</SelectItem>
                  <SelectItem value="Industry Interaction">Industry Interaction</SelectItem>
                  <SelectItem value="Any other Please Specify">Any other Please Specify</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_interaction">Any other interaction</Label>
              <Input id="other_interaction" name="other_interaction" value={formData.other_interaction} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Details of interaction</Label>
            <Textarea id="details" name="details" rows={3} value={formData.details} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date of interaction</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level of interaction</Label>
              <Select value={formData.level} onValueChange={(v) => handleSelectChange("level", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Local">Local</SelectItem>
                  <SelectItem value="State">State</SelectItem>
                  <SelectItem value="International">International</SelectItem>
                  <SelectItem value="National">National</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" name="duration" value={formData.duration} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Additional notes</Label>
            <Textarea id="description" name="description" rows={3} value={formData.description} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certificate">Submit Certificate</Label>
            <Input id="certificate" name="certificate" type="file" onChange={handleFileChange} />
          </div>
        </div>
      </DialogForm>

      <DialogForm
        title="Interaction Details"
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
              <Label>Details</Label>
              <p className="text-sm">{selectedItem.event}</p>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <p className="text-sm">{selectedItem.institution}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <p className="text-sm">{new Date(selectedItem.date).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <p className="text-sm">{selectedItem.role}</p>
              </div>
            </div>
            {selectedItem.description && (() => {
              let extras: any = {};
              try {
                extras = JSON.parse(selectedItem.description);
              } catch {}
              return (
                <>
                  {extras.academic_year && (
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <p className="text-sm">{extras.academic_year}</p>
                    </div>
                  )}
                  {extras.faculty_name && (
                    <div className="space-y-2">
                      <Label>Name of Faculty</Label>
                      <p className="text-sm">{extras.faculty_name}</p>
                    </div>
                  )}
                  {extras.level && (
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <p className="text-sm">{extras.level}</p>
                    </div>
                  )}
                  {extras.duration && (
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <p className="text-sm">{extras.duration}</p>
                    </div>
                  )}
                  {extras.other_interaction && (
                    <div className="space-y-2">
                      <Label>Other Interaction</Label>
                      <p className="text-sm">{extras.other_interaction}</p>
                    </div>
                  )}
                  {extras.certificate && (
                    <div className="space-y-2">
                      <Label>Certificate</Label>
                      <a href={extras.certificate} target="_blank" className="text-blue-600 underline">
                        View Certificate
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
        title="Edit Interaction"
        description="Update interaction details"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_academic_year">Academic Year</Label>
              <Select value={formData.academic_year} onValueChange={(v) => handleSelectChange("academic_year", v)}>
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
              <Label htmlFor="edit_branch">Branch</Label>
              <Select value={formData.branch} onValueChange={(v) => handleSelectChange("branch", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="EXTC">EXTC</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Computers">Computers</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Humanities">Humanities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_faculty_name">Faculty Name</Label>
              <p className="text-sm">{formData.faculty_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_role">Nature of interaction</Label>
              <Select value={formData.role} onValueChange={(v) => handleSelectChange("role", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reviewer">Reviewer</SelectItem>
                  <SelectItem value="Session Chair">Session Chair</SelectItem>
                  <SelectItem value="Invited Talks">Invited Talks</SelectItem>
                  <SelectItem value="Syllabus Setting">Syllabus Setting</SelectItem>
                  <SelectItem value="BoS">BoS</SelectItem>
                  <SelectItem value="USSC Interview Expert">USSC Interview Expert</SelectItem>
                  <SelectItem value="PhD related activity">PhD related activity</SelectItem>
                  <SelectItem value="Academic Auditer">Academic Auditer</SelectItem>
                  <SelectItem value="Industry Interaction">Industry Interaction</SelectItem>
                  <SelectItem value="Any other Please Specify">Any other Please Specify</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_other_interaction">Any other interaction</Label>
              <Input id="edit_other_interaction" name="other_interaction" value={formData.other_interaction} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_details">Details of interaction</Label>
            <Textarea id="edit_details" name="details" rows={3} value={formData.details} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_date">Date of interaction</Label>
              <Input id="edit_date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_level">Level of interaction</Label>
              <Select value={formData.level} onValueChange={(v) => handleSelectChange("level", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Local">Local</SelectItem>
                  <SelectItem value="State">State</SelectItem>
                  <SelectItem value="International">International</SelectItem>
                  <SelectItem value="National">National</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_duration">Duration</Label>
              <Input id="edit_duration" name="duration" value={formData.duration} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_description">Additional notes</Label>
            <Textarea id="edit_description" name="description" rows={3} value={formData.description} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_certificate">Submit Certificate</Label>
            <Input id="edit_certificate" name="certificate" type="file" onChange={handleFileChange} />
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

function useFiltered(items: Interaction[], search: string, roleFilter: string) {
  const s = search.trim().toLowerCase();
  return items.filter((it) => {
    const matchesSearch =
      s === "" ||
      it.event.toLowerCase().includes(s) ||
      it.institution.toLowerCase().includes(s);
    const matchesRole = roleFilter === "all" || it.role === roleFilter;
    return matchesSearch && matchesRole;
  });
}
