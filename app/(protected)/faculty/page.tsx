"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useFacultyList } from "@/lib/hooks/useFacultyData";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { DeptIdBadge } from "@/components/departments/DeptIdBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Faculty } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";

export default function FacultyListPage() {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const { faculty, loading } = useFacultyList(deptFilter || undefined);

  const filtered = faculty.filter((f) => {
    const matchSearch =
      !search ||
      f.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      f.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      f.designation?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const columns: Column<Faculty>[] = [
    {
      key: "displayName",
      header: "Faculty",
      sortable: true,
      cell: (f) => (
        <div className="flex items-center gap-3">
          {f.profilePhotoUrl ? (
            <img src={f.profilePhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
              {(f.displayName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{f.displayName}</p>
            <p className="text-xs text-muted">{f.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "employeeId",
      header: "Employee ID",
      cell: (f) => <span className="font-mono text-xs">{f.employeeId}</span>,
    },
    {
      key: "departmentId",
      header: "Department",
      cell: (f) => <DeptIdBadge deptId={f.departmentId} size="sm" />,
    },
    { key: "designation", header: "Designation", sortable: true },
    {
      key: "joiningDate",
      header: "Joined",
      sortable: true,
      cell: (f) => <span className="text-xs text-muted">{formatDate(f.joiningDate)}</span>,
    },
    {
      key: "isActive",
      header: "Status",
      cell: (f) => (
        <Badge variant={f.isActive ? "success" : "default"}>
          {f.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Faculty"
        subtitle="Manage faculty members across all departments"
        count={filtered.length}
        actions={
          canCreate("faculty") && (
            <Button variant="accent" onClick={() => router.push("/faculty/add")}>
              <Plus className="w-4 h-4" /> Add Faculty
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name, ID, or designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Departments</option>
          {["001","002","003","004","005","006","007","008","009","010","011","012"].map((id) => (
            <option key={id} value={id}>[{id}]</option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          keyField="id"
          onRowClick={(row) => router.push(`/faculty/${(row as unknown as Faculty).id}`)}
          emptyState={{
            title: "No faculty members found",
            description: "Add faculty members to see them here.",
            action: canCreate("faculty") ? { label: "Add Faculty", onClick: () => router.push("/faculty/add") } : undefined,
          }}
        />
      )}
    </div>
  );
}
