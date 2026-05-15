"use client";

import {
  BookOpen,
  Briefcase,
  Calendar,
  Users,
  GraduationCap,
  IndianRupee,
  FileCheck,
  Award,
  Trophy,
  ArrowRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useContext, useState } from "react";
import { AuthContext } from "@/lib/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { generateFacultyReport } from "@/lib/utils/facultyReport";
import type { Faculty } from "@/lib/types/faculty.types";

const modules = [
  {
    id: "publications",
    title: "Publications",
    description: "Research papers and articles published in journals or conferences.",
    icon: BookOpen,
    href: "/faculty/profile?tab=publications",
    color: "border-blue-500",
  },
  {
    id: "research",
    title: "Research Projects",
    description: "Ongoing and completed research projects and endowments.",
    icon: Briefcase,
    href: "/faculty/profile?tab=research",
    color: "border-emerald-500",
  },
  {
    id: "workshops",
    title: "Workshops & Conf.",
    description: "Events attended or organized including seminars and workshops.",
    icon: Calendar,
    href: "/faculty/profile?tab=workshops",
    color: "border-orange-500",
  },
  {
    id: "interactions",
    title: "Faculty Interactions",
    description: "Roles as reviewer, session chair, invited talks, or PhD related activity.",
    icon: Users,
    href: "/faculty/profile?tab=interactions",
    color: "border-cyan-500",
  },
  {
    id: "contributions",
    title: "Contributions",
    description: "Track your service and contributions to department and community.",
    icon: Award,
    href: "/faculty/profile?tab=contributions",
    color: "border-teal-500",
  },
  {
    id: "patents",
    title: "Patents / Copyrights",
    description: "Patents filed, granted, or copyrights registered.",
    icon: FileCheck,
    href: "/faculty/profile?tab=patents",
    color: "border-red-500",
  },
  {
    id: "memberships",
    title: "Prof. Memberships",
    description: "Memberships in professional organizations and bodies.",
    icon: Award,
    href: "/faculty/profile?tab=memberships",
    color: "border-indigo-500",
  },
  {
    id: "awards",
    title: "Awards & Recognition",
    description: "Academic achievements, PhD awards, and recognition.",
    icon: Trophy,
    href: "/faculty/profile?tab=awards",
    color: "border-amber-500",
  },
  {
    id: "financial",
    title: "Financial Support",
    description: "Financial support received for professional development.",
    icon: IndianRupee,
    href: "/faculty/profile?tab=financial",
    color: "border-pink-500",
  },
  {
    id: "qualifications",
    title: "Qualifications",
    description: "Update your academic degrees and educational history.",
    icon: GraduationCap,
    href: "/faculty/profile?tab=qualifications",
    color: "border-purple-500",
  }
];

export function FacultyHub() {
  const { userDoc } = useContext(AuthContext);
  const facultyId = userDoc?.uid ?? "";
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async (moduleId: string) => {
    if (!facultyId) return;
    setGenerating(true);
    try {
      const facultyRef = doc(db, "faculty", facultyId);
      const facultySnap = await getDoc(facultyRef);
      
      if (!facultySnap.exists()) {
        toast.error("Faculty data not found. Please complete your profile.");
        return;
      }

      const facultyData = { id: facultySnap.id, ...facultySnap.data() } as Faculty;
      await generateFacultyReport(facultyData, sessionFilter, moduleId);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map((module) => (
        <Card key={module.id} className={`overflow-hidden border-t-4 ${module.color} transition-all hover:shadow-lg dark:bg-[#1C2128]`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <module.icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <CardTitle className="mt-4 uppercase text-xs font-bold tracking-wider text-zinc-500 dark:text-zinc-400">
              {module.title}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2 min-h-[40px]">
              {module.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link href={`/faculty/${facultyId}?tab=${module.id}`} passHref legacyBehavior>
              <Button variant="secondary" className="w-full justify-between group">
                Manage {module.title.split(" ")[0]}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between border-primary/20 text-primary hover:bg-primary/5"
                >
                  Generate Report
                  <Download className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate Report</DialogTitle>
                  <DialogDescription>
                    Download a detailed PDF report for your {module.title.toLowerCase()}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="session">Academic Session</Label>
                    <Select value={sessionFilter} onValueChange={setSessionFilter}>
                      <SelectTrigger id="session">
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Sessions (Cumulative)</SelectItem>
                        <SelectItem value="2025-26">Current Session (2025-26)</SelectItem>
                        <SelectItem value="2024-25">Previous Session (2024-25)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="sm:justify-start">
                  <Button onClick={() => handleGenerateReport(module.id)} disabled={generating} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11">
                    {generating ? "Generating..." : "Download Comprehensive PDF"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
