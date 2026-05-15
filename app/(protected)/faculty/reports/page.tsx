"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FlaskConical, 
  Calendar, 
  Users, 
  GraduationCap, 
  IndianRupee, 
  FileText, 
  Award, 
  Trophy, 
  Activity,
  FileDown,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { useContext, useState } from "react";
import { AuthContext } from "@/lib/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { generateFacultyReport } from "@/lib/utils/facultyReport";
import type { Faculty } from "@/lib/types/faculty.types";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const MODULES = [
  { id: "publications", label: "Publications", icon: BookOpen, color: "blue" },
  { id: "research", label: "Research Projects", icon: FlaskConical, color: "emerald" },
  { id: "workshops", label: "Workshops & Conferences", icon: Calendar, color: "orange" },
  { id: "interactions", label: "Faculty Interactions", icon: Users, color: "sky" },
  { id: "awards", label: "Awards & Recognition", icon: Trophy, color: "amber" },
  { id: "patents", label: "Patents / Copyrights", icon: FileText, color: "red" },
  { id: "memberships", label: "Professional Memberships", icon: Award, color: "indigo" },
  { id: "contributions", label: "Contributions", icon: Activity, color: "teal" },
  { id: "financial", label: "Financial Support", icon: IndianRupee, color: "rose" },
  { id: "qualifications", label: "Qualifications", icon: GraduationCap, color: "purple" },
];

export default function ReportGenerationPage() {
  const { userDoc } = useContext(AuthContext);
  const [generating, setGenerating] = useState<string | null>(null);
  const [session, setSession] = useState("ALL");

  const handleGenerateReport = async (moduleId: string) => {
    if (!userDoc?.uid) return;
    setGenerating(moduleId);
    try {
      const facultyRef = doc(db, "faculty", userDoc.uid);
      const facultySnap = await getDoc(facultyRef);
      
      if (!facultySnap.exists()) {
        toast.error("Faculty profile not found.");
        return;
      }

      const facultyData = { id: facultySnap.id, ...facultySnap.data() } as Faculty;
      await generateFacultyReport(facultyData, session, moduleId);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report.");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateFullReport = async () => {
    await handleGenerateReport("ALL");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Report Generation"
          subtitle="Generate and download detailed academic reports for accreditation and appraisal."
        />
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Label htmlFor="session-select" className="text-xs font-bold text-muted uppercase">Session:</Label>
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger id="session-select" className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Cumulative</SelectItem>
                <SelectItem value="2025-26">2025-26</SelectItem>
                <SelectItem value="2024-25">2024-25</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateFullReport} disabled={!!generating} variant="accent" size="sm" className="gap-2 h-8">
            <Download className="w-3.5 h-3.5" /> Full Academic Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <Card key={module.id} className="overflow-hidden hover:shadow-md transition-shadow group">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${module.color}-50 dark:bg-${module.color}-900/20 flex items-center justify-center text-${module.color}-600`}>
                  <module.icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight">{module.label}</CardTitle>
                  <CardDescription className="text-[10px]">Academic data report</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4 h-9 text-xs gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                onClick={() => handleGenerateReport(module.id)}
                disabled={!!generating}
              >
                {generating === module.id ? "Generating..." : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    Download {module.label} Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
