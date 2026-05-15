"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { DeptIdBadge } from "@/components/departments/DeptIdBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Student } from "@/lib/types/student.types";

const STATUS_COLORS: Record<string, string> = {
  Active: "success",
  Graduated: "primary",
  Inactive: "default",
  Dropped: "error",
};

export default function StudentsPage() {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("displayName"));
    return onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Student).filter(s => !s.blocked));
      setLoading(false);
    });
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch = !search || s.displayName?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || s.departmentId === deptFilter;
    const matchBatch = !batchFilter || s.batch === batchFilter;
    return matchSearch && matchDept && matchBatch;
  });

  const batches = [...new Set(students.map((s) => s.batch))].filter(Boolean).sort();

  const columns: Column<Student>[] = [
    { key: "rollNumber", header: "Roll No.", sortable: true, cell: (s) => <span className="font-mono text-xs font-medium">{s.rollNumber}</span> },
    { key: "displayName", header: "Name", sortable: true, cell: (s) => <span className="font-medium text-sm">{s.displayName}</span> },
    { key: "departmentId", header: "Department", cell: (s) => <DeptIdBadge deptId={s.departmentId} size="sm" /> },
    { key: "batch", header: "Batch", sortable: true },
    { key: "year", header: "Year" },
    { key: "cgpa", header: "CGPA", cell: (s) => s.cgpa ? <span>{s.cgpa.toFixed(2)}</span> : <span className="text-muted">—</span> },
    {
      key: "status",
      header: "Status",
      cell: (s) => <Badge variant={(STATUS_COLORS[s.status] ?? "default") as "success" | "primary" | "default" | "error"}>{s.status}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student academic records"
        count={filtered.length}
        actions={canCreate("students") && <Button variant="accent"><Plus className="w-4 h-4" /> Add Student</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" placeholder="Search by name or roll number…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm">
          <option value="">All Departments</option>
          {["001","002","003","004","005","006","007","008","009","010","011","012"].map((id) => <option key={id} value={id}>[{id}]</option>)}
        </select>
        <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm">
          <option value="">All Batches</option>
          {batches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? <SkeletonTable rows={8} cols={7} /> : (
        <DataTable<Student>
          columns={columns}
          data={filtered}
          keyField="id"
          onRowClick={(s) => router.push(`/students/${(s as unknown as Student).id}`)}
          emptyState={{ title: "No students found", description: "Add students or adjust your filters." }}
        />
      )}
    </div>
  );
}
