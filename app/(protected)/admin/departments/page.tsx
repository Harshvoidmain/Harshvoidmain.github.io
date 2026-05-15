"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Plus, Edit, MoreHorizontal, Users, BookOpen, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { addDocument, updateDocument } from "@/lib/firebase/firestore";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/SkeletonTable";
import { DeptIdBadge } from "@/components/departments/DeptIdBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getNextDeptId } from "@/lib/utils/departmentId";
import type { Department } from "@/lib/types/department.types";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDept, setNewDept] = useState({ id: "", name: "", code: "", shortName: "" });
  const [nextId, setNextId] = useState("013");

  useEffect(() => {
    const q = query(collection(db, "departments"), orderBy("departmentId"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Department))
        .filter(d => !d.blocked);
      setDepartments(docs);
      // setNextId(getNextDeptId(docs.map((d) => d.departmentId)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!newDept.name || !newDept.code) {
      toast.error("Name and code are required.");
      return;
    }
    setSaving(true);
    try {
      await addDocument("departments", {
        departmentId: newDept.id,
        code: newDept.code.toUpperCase(),
        name: newDept.name,
        shortName: newDept.shortName || newDept.code.toUpperCase(),
        hodUserId: null,
        isActive: true,
      });
      toast.success(`Department [${newDept.id}] created.`);
      setShowAdd(false);
      setNewDept({ id: "", name: "", code: "", shortName: "" });
    } catch {
      toast.error("Failed to create department.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Department Management"
        subtitle="Manage all academic departments"
        count={departments.length}
        actions={
          <Button variant="accent" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        }
      />

      {loading ? (
        <SkeletonCard count={6} />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Add your first department to get started."
          action={{ label: "Add Department", onClick: () => setShowAdd(true) }}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card card-hover cursor-pointer"
              onClick={() => router.push(`/departments/${dept.departmentId}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <DeptIdBadge deptId={dept.departmentId} size="md" />
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-1 rounded text-muted hover:text-[rgb(var(--text-primary))] hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <p className="text-2xl font-heading font-bold text-[rgb(var(--text-primary))] mb-0.5">
                {dept.code}
              </p>
              <p className="text-sm text-muted leading-snug mb-4">{dept.name}</p>

              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {dept.facultyCount ?? 0} Faculty
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {dept.studentCount ?? 0} Students
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {dept.publicationCount ?? 0} Pubs
                </span>
              </div>

              {dept.hodName && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                    {dept.hodName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                  </div>
                  <span className="text-xs text-muted">HOD: {dept.hodName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Dept ID"
                placeholder="10"
                value={newDept.id}
                onChange={(e) => setNewDept((p) => ({ ...p, id: e.target.value }))}
                required
                hint="e.g. 10, 30, 40"
              />
              <Input
                label="Code"
                placeholder="CS"
                value={newDept.code}
                onChange={(e) => setNewDept((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>
            <Input
              label="Department Name"
              placeholder="Computer Science & Engineering"
              value={newDept.name}
              onChange={(e) => setNewDept((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              label="Short Name"
              placeholder="CSE"
              value={newDept.shortName}
              onChange={(e) => setNewDept((p) => ({ ...p, shortName: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleAdd} loading={saving}>Create Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
