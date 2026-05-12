"use client";

import { useState, useContext } from "react";
import {
  User, Building2, BookOpen, FlaskConical, Trophy, Wrench, Users, BarChart3,
  Download, FileText, Loader2,
} from "lucide-react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AuthContext } from "@/lib/context/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateFacultyReport } from "@/lib/utils/facultyReport";
import { createPDF, addSectionTitle, addPageNumbers, tableOptions, autoTable } from "@/lib/utils/pdf";
import type { Faculty } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";
import { toast } from "sonner";

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  roles: string[];
}

const REPORT_TYPES: ReportType[] = [
  { id: "faculty-bio", title: "Faculty Biodata Report", description: "Individual faculty member's complete profile and biodata.", icon: User, roles: ["superadmin", "admin", "hod", "faculty"] },
  { id: "faculty-comprehensive", title: "Faculty Comprehensive Report", description: "All modules: publications, research, awards, workshops, and more.", icon: FileText, roles: ["superadmin", "admin", "hod", "faculty"] },
  { id: "department-summary", title: "Department Summary Report", description: "Overview of a department including faculty list and stats.", icon: Building2, roles: ["superadmin", "admin", "hod"] },
  { id: "publications", title: "Publications Report", description: "All publications filterable by year, type, and department.", icon: BookOpen, roles: ["superadmin", "admin", "hod"] },
  { id: "research", title: "Research Projects Report", description: "Active and completed research projects across the institution.", icon: FlaskConical, roles: ["superadmin", "admin", "hod"] },
  { id: "training", title: "Training & Development Report", description: "FDP, STTP, workshops attended and organized by faculty.", icon: Wrench, roles: ["superadmin", "admin", "hod"] },
  { id: "awards", title: "Awards & Recognition Report", description: "All awards received by faculty across departments.", icon: Trophy, roles: ["superadmin", "admin", "hod"] },
  { id: "student-academic", title: "Student Academic Report", description: "Student academic records and performance summary.", icon: Users, roles: ["superadmin", "admin", "hod", "staff"] },
];

export default function ReportsPage() {
  const { userDoc } = useContext(AuthContext);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [deptFilter, setDeptFilter] = useState("");

  const role = userDoc?.role ?? "faculty";
  const visibleReports = REPORT_TYPES.filter((r) => r.roles.includes(role));

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setGenerating(true);
    try {
      if (selectedReport.id === "faculty-comprehensive" || selectedReport.id === "faculty-bio") {
        const q = query(collection(db, "faculty"), orderBy("displayName"));
        const snap = await getDocs(q);
        const faculty = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Faculty);
        if (faculty.length > 0) {
          await generateFacultyReport(faculty[0]);
        } else {
          toast.error("No faculty data available.");
        }
      } else if (selectedReport.id === "department-summary") {
        await generateDeptSummaryReport(yearFilter);
      } else if (selectedReport.id === "publications") {
        await generatePublicationsReport(yearFilter, deptFilter);
      } else {
        toast.info("Report type coming soon.");
      }
      setSelectedReport(null);
    } catch (err) {
      toast.error("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and download institutional reports"
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {visibleReports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card card-hover"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <report.icon className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h3 className="font-heading font-semibold text-[rgb(var(--text-primary))] text-sm mb-1">
              {report.title}
            </h3>
            <p className="text-xs text-muted leading-relaxed mb-4">{report.description}</p>
            <Button
              variant="accent"
              size="sm"
              className="w-full"
              onClick={() => setSelectedReport(report)}
            >
              <Download className="w-4 h-4" /> Generate
            </Button>
          </div>
        ))}
      </div>

      {/* Report Generation Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(o) => !o && setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate: {selectedReport?.title}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">Academic Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm"
              >
                {[2025, 2024, 2023, 2022, 2021].map((y) => (
                  <option key={y} value={y}>{y}–{y + 1}</option>
                ))}
              </select>
            </div>

            {!["faculty-bio", "faculty-comprehensive"].includes(selectedReport?.id ?? "") && (
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm"
                >
                  <option value="">All Departments</option>
                  {["001","002","003","004","005","006","007","008","009","010","011","012"].map((id) => (
                    <option key={id} value={id}>[{id}]</option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Report will be generated as a PDF and downloaded to your device.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
            <Button variant="accent" onClick={handleGenerate} loading={generating}>
              <Download className="w-4 h-4" /> Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function generateDeptSummaryReport(year: string): Promise<void> {
  const doc = createPDF({
    institutionName: "IMS Portal",
    reportTitle: `Department Summary Report — ${year}`,
    generatedBy: "IMS Portal",
  });

  let y = 36;
  y = addSectionTitle(doc, "Department Overview", y);

  const q = query(collection(db, "departments"), orderBy("departmentId"));
  const snap = await getDocs(q);
  const depts = snap.docs.map((d) => d.data());

  autoTable(doc, {
    head: [["Dept ID", "Code", "Name", "Faculty", "Students", "HOD"]],
    body: depts.map((d) => [
      `[${d.departmentId}]`,
      d.code,
      d.name,
      d.facultyCount ?? 0,
      d.studentCount ?? 0,
      d.hodName ?? "—",
    ]),
    ...tableOptions(y),
  });

  addPageNumbers(doc);
  doc.save(`Department_Summary_Report_${year}.pdf`);
}

async function generatePublicationsReport(year: string, deptId: string): Promise<void> {
  const doc = createPDF({
    institutionName: "IMS Portal",
    reportTitle: `Publications Report — ${year}`,
    generatedBy: "IMS Portal",
    departmentLabel: deptId ? `Department [${deptId}]` : "All Departments",
  });

  let y = 36;
  y = addSectionTitle(doc, `Publications — ${year}`, y);

  const facultyQ = query(collection(db, "faculty"), orderBy("displayName"));
  const facultySnap = await getDocs(facultyQ);

  const rows: string[][] = [];
  for (const fDoc of facultySnap.docs) {
    if (deptId && fDoc.data().departmentId !== deptId) continue;
    const pubQ = query(collection(db, `faculty/${fDoc.id}/publications`), orderBy("year", "desc"));
    const pubSnap = await getDocs(pubQ);
    pubSnap.docs.forEach((p) => {
      const pub = p.data();
      if (!year || String(pub.year) === year) {
        rows.push([
          fDoc.data().displayName,
          pub.title.length > 40 ? pub.title.slice(0, 40) + "…" : pub.title,
          pub.type,
          pub.year,
          pub.venue.length > 25 ? pub.venue.slice(0, 25) + "…" : pub.venue,
        ]);
      }
    });
  }

  autoTable(doc, {
    head: [["Faculty", "Title", "Type", "Year", "Venue"]],
    body: rows.length > 0 ? rows : [["No publications found for selected filters", "", "", "", ""]],
    ...tableOptions(y),
  });

  addPageNumbers(doc);
  doc.save(`Publications_Report_${year}.pdf`);
}
