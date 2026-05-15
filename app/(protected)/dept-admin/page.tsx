"use client";

import { useState, useEffect, useContext } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { Users, GraduationCap, Briefcase, BarChart3, Download } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { AuthContext } from "@/lib/context/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DepartmentStats {
  facultyCount: number;
  studentCount: number;
  staffCount: number;
  contributions: number;
}

export default function DeptAdminDashboard() {
  const { userDoc } = useContext(AuthContext);
  const [stats, setStats] = useState<DepartmentStats>({
    facultyCount: 0,
    studentCount: 0,
    staffCount: 0,
    contributions: 0,
  });
  const [departmentName, setDepartmentName] = useState<string>("");
  const [facultyMembers, setFacultyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const departmentId = userDoc?.departmentId || "";

  useEffect(() => {
    if (!departmentId) return;

    const loadData = async () => {
      try {
        // Fetch department info
        try {
          const deptQuery = query(collection(db, "departments"), where("departmentId", "==", departmentId));
          const deptSnap = await getDocs(deptQuery);
          if (!deptSnap.empty) {
            setDepartmentName(deptSnap.docs[0].data().name || `Department ${departmentId}`);
          }
        } catch (e) {
          setDepartmentName(`Department ${departmentId}`);
        }

        // Fetch faculty count
        const facultyQuery = query(
          collection(db, "faculty"),
          where("departmentId", "==", departmentId),
          where("isActive", "==", true)
        );
        const facultySnap = await getDocs(facultyQuery);
        const facultyList = facultySnap.docs
          .map((d) => ({
            id: d.id,
            displayName: d.data().displayName,
            designation: d.data().designation,
            email: d.data().email,
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName));

        setFacultyMembers(facultyList);

        // Fetch student count (simplified - assuming students collection exists)
        try {
          const studentQuery = query(
            collection(db, "students"),
            where("departmentId", "==", departmentId),
            where("isActive", "==", true)
          );
          const studentSnap = await getDocs(studentQuery);
          const studentCount = studentSnap.size;

          setStats((prev) => ({
            ...prev,
            facultyCount: facultyList.length,
            studentCount: studentCount,
          }));
        } catch (e) {
          // Students collection might not exist yet
          setStats((prev) => ({
            ...prev,
            facultyCount: facultyList.length,
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data.");
        setLoading(false);
      }
    };

    loadData();
  }, [departmentId]);

  const handleGenerateReport = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      // Header
      doc.setFillColor(15, 37, 87);
      doc.rect(0, 0, pageWidth, 32, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Fr. C. Rodrigues Institute of Technology", pageWidth / 2, 13, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Department Report — Faculty Portal", pageWidth / 2, 20, { align: "center" });

      doc.setDrawColor(232, 160, 32);
      doc.setLineWidth(1.2);
      doc.line(0, 32, pageWidth, 32);

      // Title
      doc.setTextColor(15, 37, 87);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Department Overview Report", pageWidth / 2, 43, { align: "center" });

      doc.setTextColor(0, 0, 0);

      // Department info
      let y = 60;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Department ID: ${departmentId}`, margin, y);
      y += 6;
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}`,
        margin,
        y
      );

      // Statistics section
      y += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Department Statistics", margin, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Count"]],
        body: [
          ["Faculty Members", stats.facultyCount.toString()],
          ["Students", stats.studentCount.toString()],
          ["Non-Teaching Staff", stats.staffCount.toString()],
        ],
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 80 },
          1: { cellWidth: 40 },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Faculty members section
      if (facultyMembers.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Faculty Members", margin, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["#", "Name", "Designation", "Email"]],
          body: facultyMembers.map((f, i) => [
            (i + 1).toString(),
            f.displayName,
            f.designation,
            f.email,
          ]),
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: 50 },
          },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `Page ${i} of ${pageCount}  |  Generated by IMS Portal`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
      }

      doc.save(`DEPT_${departmentId}_REPORT_${new Date().getTime()}.pdf`);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report.");
    }
  };

  if (!departmentId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Department Dashboard"
          subtitle="View department information and statistics"
        />
        <EmptyState
          title="Department not configured"
          description="Your user account is not assigned to a department."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Dashboard"
        subtitle={departmentName ? `${departmentName} Overview` : `Department ${departmentId} Overview`}
        actions={
          <Button
            onClick={handleGenerateReport}
            className="gap-2"
            disabled={loading}
          >
            <Download className="w-4 h-4" /> Generate Report
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Faculty Members"
          value={stats.facultyCount}
          icon={GraduationCap}
        />
        <StatsCard
          title="Students"
          value={stats.studentCount}
          icon={Users}
        />
        <StatsCard
          title="Staff"
          value={stats.staffCount}
          icon={Briefcase}
        />
        <StatsCard
          title="Contributions"
          value={stats.contributions}
          icon={BarChart3}
        />
      </div>

      {/* Faculty Members Section */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Faculty Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted">Loading...</p>
            </div>
          ) : facultyMembers.length === 0 ? (
            <EmptyState
              title="No faculty members"
              description="No faculty members found for this department."
            />
          ) : (
            <div className="space-y-2">
              {facultyMembers.map((faculty) => (
                <div
                  key={faculty.id}
                  className="p-4 rounded-lg border border-border hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-[rgb(var(--text-primary))]">
                        {faculty.displayName}
                      </p>
                      <p className="text-sm text-muted">{faculty.designation}</p>
                      <p className="text-xs text-muted mt-1">{faculty.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
