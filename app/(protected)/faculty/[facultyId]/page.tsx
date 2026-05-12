"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const { userDoc } = useContext(AuthContext);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

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

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border shadow-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary to-primary/80" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="relative">
              {faculty.profilePhotoUrl ? (
                <img
                  src={faculty.profilePhotoUrl}
                  alt={faculty.displayName}
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1C2128] object-cover shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1C2128] bg-primary flex items-center justify-center text-white text-2xl font-heading font-bold shadow-md">
                  {(faculty.displayName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
              )}
              {canEdit && (
                <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-gray-700 border border-border flex items-center justify-center text-muted hover:text-primary transition-colors shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 sm:mb-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-heading font-bold text-[rgb(var(--text-primary))]">
                  {faculty.displayName}
                </h1>
                <DeptIdBadge deptId={faculty.departmentId} size="sm" />
              </div>
              <p className="text-muted text-sm">{faculty.designation}</p>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted">
                <span className="font-mono">{faculty.employeeId}</span>
                <span>·</span>
                <span>{faculty.email}</span>
                <span>·</span>
                <span>{faculty.phone}</span>
              </div>
              <p className="text-xs text-muted mt-0.5">Joined {formatDate(faculty.joiningDate)}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="accent"
                size="sm"
                onClick={handleGenerateReport}
                loading={generatingReport}
              >
                <FileBarChart className="w-4 h-4" /> Generate Report
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" /> Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Publications" value="0" icon={BookOpen} iconColor="text-primary" />
        <StatsCard title="Research Projects" value="0" icon={FlaskConical} iconColor="text-accent" />
        <StatsCard title="Awards" value="0" icon={Trophy} iconColor="text-yellow-500" />
        <StatsCard title="Workshops" value="0" icon={Wrench} iconColor="text-success" />
      </div>

      {/* Tabbed Modules */}
      <Tabs defaultValue="publications">
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
          <PublicationsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="research">
          <ResearchModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="awards">
          <AwardsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="workshops">
          <WorkshopsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="patents">
          <PatentsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="memberships">
          <MembershipsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="contributions">
          <ContributionsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="interactions">
          <InteractionsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="financial">
          <FinancialSupportModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="qualifications">
          <QualificationsModule facultyId={facultyId} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
