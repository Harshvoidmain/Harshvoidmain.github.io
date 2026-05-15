"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  FileBarChart,
  Edit,
  Camera,
  BookOpen,
  FlaskConical,
  Trophy,
  Wrench,
  Cpu,
  Handshake,
  ScrollText,
  MessageSquare,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { AuthContext } from "@/lib/context/AuthContext";
import { DeptIdBadge } from "@/components/departments/DeptIdBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatsCard } from "@/components/shared/StatsCard";
import { PublicationsModule } from "@/components/faculty/modules/PublicationsModule";
import { ResearchModule } from "@/components/faculty/modules/ResearchModule";
import { AwardsModule } from "@/components/faculty/modules/AwardsModule";
import { WorkshopsModule } from "@/components/faculty/modules/WorkshopsModule";
import { PatentsModule } from "@/components/faculty/modules/PatentsModule";
import { MembershipsModule } from "@/components/faculty/modules/MembershipsModule";
import { ContributionsModule } from "@/components/faculty/modules/ContributionsModule";
import { InteractionsModule } from "@/components/faculty/modules/InteractionsModule";
import { FinancialSupportModule } from "@/components/faculty/modules/FinancialSupportModule";
import { QualificationsModule } from "@/components/faculty/modules/QualificationsModule";
import type { Faculty } from "@/lib/types/faculty.types";
import { formatDate } from "@/lib/utils/formatters";
import { generateFacultyReport } from "@/lib/utils/facultyReport";
import { toast } from "sonner";

export default function FacultyProfilePage() {
  const { facultyId } = useParams<{ facultyId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userDoc } = useContext(AuthContext);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  const activeTab = searchParams.get("tab") || "publications";

  const isOwnProfile = faculty?.userId === userDoc?.uid;
  const canEdit = isOwnProfile || userDoc?.role === "admin" || userDoc?.role === "superadmin" || userDoc?.role === "hod";

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "faculty", facultyId));
      if (snap.exists()) {
        setFaculty({ id: snap.id, ...snap.data() } as Faculty);
      }
      setLoading(false);
    };
    load();
  }, [facultyId]);

  const handleGenerateReport = async () => {
    if (!faculty) return;
    setGeneratingReport(true);
    try {
      await generateFacultyReport(faculty);
      toast.success("Report generated successfully.");
    } catch {
      toast.error("Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-36 rounded-lg w-full" />
        <div className="skeleton h-10 w-96 rounded-lg" />
        <div className="skeleton h-64 rounded-lg w-full" />
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Faculty member not found.</p>
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
        <ArrowLeft className="w-4 h-4" /> Back to Faculty
      </button>

      {/* Tabbed Modules */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => router.push(`/faculty/${facultyId}?tab=${val}`, { scroll: false })}
      >
        <div className="overflow-x-auto">
          <TabsList className="flex w-max gap-0.5">
            <TabsTrigger value="publications"><BookOpen className="w-3.5 h-3.5 mr-1" />Publications</TabsTrigger>
            <TabsTrigger value="research"><FlaskConical className="w-3.5 h-3.5 mr-1" />Research</TabsTrigger>
            <TabsTrigger value="awards"><Trophy className="w-3.5 h-3.5 mr-1" />Awards</TabsTrigger>
            <TabsTrigger value="workshops"><Wrench className="w-3.5 h-3.5 mr-1" />Workshops</TabsTrigger>
            <TabsTrigger value="patents"><Cpu className="w-3.5 h-3.5 mr-1" />Patents</TabsTrigger>
            <TabsTrigger value="memberships"><Handshake className="w-3.5 h-3.5 mr-1" />Memberships</TabsTrigger>
            <TabsTrigger value="contributions"><ScrollText className="w-3.5 h-3.5 mr-1" />Contributions</TabsTrigger>
            <TabsTrigger value="interactions"><MessageSquare className="w-3.5 h-3.5 mr-1" />Interactions</TabsTrigger>
            <TabsTrigger value="financial"><DollarSign className="w-3.5 h-3.5 mr-1" />Financial</TabsTrigger>
            <TabsTrigger value="qualifications"><GraduationCap className="w-3.5 h-3.5 mr-1" />Qualifications</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="publications">
          <PublicationsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="research">
          <ResearchModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="awards">
          <AwardsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="workshops">
          <WorkshopsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="patents">
          <PatentsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="memberships">
          <MembershipsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="contributions">
          <ContributionsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="interactions">
          <InteractionsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="financial">
          <FinancialSupportModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="qualifications">
          <QualificationsModule facultyId={facultyId} customId={faculty.customId || facultyId} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
