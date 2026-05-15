"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { ArrowLeft, BookOpen, GraduationCap, Users, FileBarChart } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { DeptIdBadge } from "@/components/departments/DeptIdBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable, SkeletonStats } from "@/components/shared/SkeletonTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Department } from "@/lib/types/department.types";
import type { Faculty } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";

export default function DepartmentDetailPage() {
  const { deptId } = useParams<{ deptId: string }>();
  const router = useRouter();
  const [dept, setDept] = useState<Department | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "departments"), where("departmentId", "==", deptId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDept({ id: snap.docs[0].id, ...snap.docs[0].data() } as Department);
      }

      const fq = query(collection(db, "faculty"), where("departmentId", "==", deptId));
      const fsnap = await getDocs(fq);
      setFaculty(fsnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Faculty));
      setLoading(false);
    };
    load();
  }, [deptId]);

  const facultyColumns: Column<Faculty>[] = [
    {
      key: "displayName",
      header: "Name",
      sortable: true,
      cell: (f) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
            {(f.displayName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <span className="font-medium text-sm">{f.displayName}</span>
        </div>
      ),
    },
    { key: "employeeId", header: "Employee ID", cell: (f) => <span className="font-mono text-xs">{f.employeeId}</span> },
    { key: "designation", header: "Designation", sortable: true },
    {
      key: "joiningDate",
      header: "Joined",
      sortable: true,
      cell: (f) => <span className="text-xs text-muted">{formatDate(f.joiningDate)}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64 rounded" />
        <SkeletonStats />
        <SkeletonTable />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Department not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <DeptIdBadge deptId={dept.departmentId} size="lg" />
          <div>
            <h1 className="text-2xl font-heading font-bold text-[rgb(var(--text-primary))]">
              {dept.name}
            </h1>
            <p className="text-muted text-sm">{dept.code} · {dept.shortName}</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <FileBarChart className="w-4 h-4" /> Generate Report
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Faculty" value={faculty.length} icon={GraduationCap} iconColor="text-primary" />
        <StatsCard title="Students" value={dept.studentCount ?? 0} icon={Users} iconColor="text-accent" />
        <StatsCard title="Publications" value={dept.publicationCount ?? 0} icon={BookOpen} iconColor="text-success" />
        <StatsCard title="Research Projects" value="7" icon={BookOpen} iconColor="text-purple-600" />
      </div>

      <Tabs defaultValue="faculty">
        <TabsList>
          <TabsTrigger value="faculty">Faculty ({faculty.length})</TabsTrigger>
          <TabsTrigger value="publications">Publications</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="faculty">
          <DataTable<Faculty>
            columns={facultyColumns}
            data={faculty}
            keyField="id"
            onRowClick={(f) => router.push(`/faculty/${(f as unknown as Faculty).id}`)}
            emptyState={{ title: "No faculty in this department" }}
          />
        </TabsContent>

        <TabsContent value="publications">
          <div className="text-center py-12 text-muted text-sm">
            Publications for this department will appear here.
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted text-xs uppercase tracking-wide">Department ID</dt>
                <dd className="mt-1 font-mono font-medium">{dept.departmentId}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase tracking-wide">Code</dt>
                <dd className="mt-1 font-semibold">{dept.code}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase tracking-wide">Full Name</dt>
                <dd className="mt-1">{dept.name}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs uppercase tracking-wide">HOD</dt>
                <dd className="mt-1">{dept.hodName ?? "Not assigned"}</dd>
              </div>
            </dl>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
