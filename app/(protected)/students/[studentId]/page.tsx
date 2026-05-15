"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { DeptIdBadge } from "@/components/departments/DeptIdBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types/student.types";
import { formatDate } from "@/lib/utils/formatters";

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "students", studentId)).then((snap) => {
      if (snap.exists()) setStudent({ id: snap.id, ...snap.data() } as Student);
      setLoading(false);
    });
  }, [studentId]);

  if (loading) return <div className="skeleton h-64 rounded-lg w-full" />;
  if (!student) return (
    <div className="text-center py-16">
      <p className="text-muted">Student not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border shadow-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-heading font-bold shrink-0">
            {student.displayName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-heading font-bold text-[rgb(var(--text-primary))]">{student.displayName}</h1>
              <DeptIdBadge deptId={student.departmentId} size="sm" />
              <Badge variant={student.status === "Active" ? "success" : "default"}>{student.status}</Badge>
            </div>
            <p className="text-muted text-sm mt-1 font-mono">{student.rollNumber}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted">
              <span>Batch: <strong>{student.batch}</strong></span>
              <span>Year: <strong>{student.year}</strong></span>
              {student.cgpa && <span>CGPA: <strong>{student.cgpa.toFixed(2)}</strong></span>}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="academic">
        <TabsList>
          <TabsTrigger value="academic">Academic Records</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="academic">
          <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted text-xs uppercase tracking-wide">Roll Number</dt><dd className="mt-1 font-mono font-medium">{student.rollNumber}</dd></div>
              <div><dt className="text-muted text-xs uppercase tracking-wide">Department</dt><dd className="mt-1"><DeptIdBadge deptId={student.departmentId} size="sm" /></dd></div>
              <div><dt className="text-muted text-xs uppercase tracking-wide">Batch</dt><dd className="mt-1">{student.batch}</dd></div>
              <div><dt className="text-muted text-xs uppercase tracking-wide">Current Year</dt><dd className="mt-1">{student.year}</dd></div>
              <div><dt className="text-muted text-xs uppercase tracking-wide">Email</dt><dd className="mt-1">{student.email ?? "—"}</dd></div>
              <div><dt className="text-muted text-xs uppercase tracking-wide">Phone</dt><dd className="mt-1">{student.phone ?? "—"}</dd></div>
              <div><dt className="text-muted text-xs uppercase tracking-wide">CGPA</dt><dd className="mt-1 font-semibold">{student.cgpa ? student.cgpa.toFixed(2) : "—"}</dd></div>
            </dl>
          </div>
        </TabsContent>
        <TabsContent value="achievements">
          <div className="text-center py-12 text-muted text-sm">Achievement records will appear here.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
