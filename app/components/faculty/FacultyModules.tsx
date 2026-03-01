"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-provider";
import {
  BookOpen,
  Award,
  FileText,
  Users,
  Briefcase,
  GraduationCap,
  ArrowRight,
  BookMarked,
  Globe,
  Target,
  FileBarChart,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BioluminescentGrid, BioluminescentGridItem } from "@/components/ui/bioluminescent-grid";
import { getDepartmentStyle } from "@/app/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";

// Core styling classes for the "Liquid Glass" Grapho Aesthetic
const glassCardClasses = "bg-white/40 backdrop-blur-3xl dark:bg-[#0A0A0A]/40 dark:backdrop-blur-3xl rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.16)] transition-all duration-500 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.24)] hover:bg-white/50 dark:hover:bg-[#0A0A0A]/50 sm:p-6 p-4";
const glossyEdge = <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />;

interface FacultyInfo {
  F_id: number;
  F_name: string;
  F_dept: string;
  Email: string;
  Current_Designation: string;
  total_contributions: number;
  professional_memberships: number;
  publications?: number;
  research_projects?: number;
  workshops_attended?: number;
  awards?: number;
  interactions?: number;
  trainings?: number;
  financial_supports?: number;
  patents?: number;
}

interface FacultyModulesProps {
  facultyId?: number;
}

export default function FacultyModules({ facultyId }: FacultyModulesProps) {
  const [facultyInfo, setFacultyInfo] = useState<FacultyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { user } = useAuth();
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchFacultyInfo = async () => {
      try {
        setLoading(true);

        // If facultyId is provided, fetch that specific faculty member's information
        // Otherwise fetch the current logged-in faculty member's information
        const endpoint = facultyId
          ? `/api/faculty/${facultyId}`
          : "/api/faculty/me";

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to fetch faculty information");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.message || "Failed to fetch faculty information"
          );
        }

        // Use actual data from the database, set defaults for missing values
        const facultyData = {
          ...data.data,
          publications: data.data.publications || 0,
          research_projects: data.data.research_projects || 0,
          workshops_attended: data.data.workshops_attended || 0,
          awards: data.data.awards || 0,
          total_contributions: data.data.total_contributions || 0,
          professional_memberships: data.data.professional_memberships || 0,
        };

        setFacultyInfo(facultyData);
        setError(null);
      } catch (err) {
        console.error("Error fetching faculty info:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyInfo();
  }, [facultyId]);

  // Function to generate reports for specific module types
  const generateModuleReport = async (moduleType: string) => {
    if (
      !user ||
      (user.role !== "department" &&
        user.role !== "hod" &&
        user.role !== "faculty")
    ) {
      return;
    }

    // Ensure we have faculty info before generating report
    if (!facultyInfo?.F_id) {
      alert("Faculty information not available. Please try again.");
      return;
    }

    try {
      setGeneratingReport(moduleType);

      const reportConfig = {
        reportType: moduleType,
        departmentId: "", // Empty for individual faculty reports
        format: "pdf",
        facultyId: facultyInfo?.F_id?.toString(), // Use the actual faculty ID from the fetched info
        isIndividualReport: true, // Flag to indicate this is for individual faculty
      };

      console.log("Generating report for:", {
        facultyName: facultyInfo?.F_name,
        facultyId: facultyInfo?.F_id,
        moduleType,
        reportConfig,
      });

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportConfig),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${moduleType} report`);
      }

      // Get the JSON response with base64 PDF data (same as dashboard reports)
      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || `Failed to generate ${moduleType} report`
        );
      }

      // Convert base64 to blob and download (same as dashboard approach)
      const byteCharacters = atob(result.data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        result.data.filename ||
        `${facultyInfo?.F_name?.replace(/\s+/g, "_")}_${moduleType}_report_${new Date().toISOString().split("T")[0]
        }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error generating ${moduleType} report:`, error);
      alert(`Failed to generate ${moduleType} report. Please try again.`);
    } finally {
      setGeneratingReport(null);
    }
  };

  // Helper function to check if user can generate reports
  const canGenerateReports = () => {
    return (
      user &&
      (user.role === "department" ||
        user.role === "hod" ||
        user.role === "faculty")
    );
  };

  const getCardSpan = (count?: number) => {
    const c = count || 0;
    if (c >= 20) return "md:col-span-2 lg:col-span-2 lg:row-span-2";
    if (c >= 10) return "md:col-span-2 lg:col-span-1";
    if (c >= 5) return "md:col-span-1 lg:col-span-1";
    return "col-span-1";
  };

  const handleDownloadReport = async () => {
    try {
      setReportLoading(true);
      const response = await fetch("/api/faculty/comprehensive-report");

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to generate report");
      }

      // Convert base64 to blob
      const pdfBlob = base64ToBlob(data.data.pdfBase64, "application/pdf");

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.data.filename || "faculty-report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert(err instanceof Error ? err.message : "Failed to download report");
    } finally {
      setReportLoading(false);
    }
  };

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  if (loading) {
    return <FacultyModulesSkeleton />;
  }

  if (error || !facultyInfo) {
    return (
      <div className="bg-red-50 text-red-500 p-6 rounded-md">
        <p className="font-medium">Error loading faculty information</p>
        <p className="text-sm mt-1">
          {error || "Faculty information not available"}
        </p>
      </div>
    );
  }

  const departmentStyle = getDepartmentStyle(facultyInfo.F_dept);

  return (
    <div className="space-y-6">
      {/* Faculty info header */}
      <div className={`${glassCardClasses} relative group overflow-hidden`}>
        {glossyEdge}
        <div
          className="absolute top-0 left-0 w-full h-2"
          style={{ backgroundColor: departmentStyle.primary }}
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2 relative z-10">
          <div
            className="w-20 h-20 rounded-[20px] flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0"
            style={{ backgroundColor: departmentStyle.primary }}
          >
            {facultyInfo.F_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{facultyInfo.F_name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{facultyInfo.Current_Designation}</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{facultyInfo.F_dept}</span>
            </div>
            <p className="mt-4 text-[13px] font-medium text-gray-400 dark:text-gray-500 max-w-2xl">
              Welcome to your faculty dashboard. Here you can manage all your academic records including publications, research projects, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <BioluminescentGrid>
        {/* Publications Module */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.publications)}`}>
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: departmentStyle.primary }}
          />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Publications</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{facultyInfo.publications}</p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Research papers and articles published
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/publications`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Publications
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("publications")}
                disabled={generatingReport === "publications"}
              >
                {generatingReport === "publications" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Research Projects */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.research_projects)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#16a34a" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Research Projects</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">
              {facultyInfo.research_projects}
            </p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Ongoing and completed research projects
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/research-projects`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Projects
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("research-projects")}
                disabled={generatingReport === "research-projects"}
              >
                {generatingReport === "research-projects" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Contributions */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.total_contributions)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#7c3aed" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Contributions</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">
              {facultyInfo.total_contributions}
            </p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Academic contributions across categories
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/contributions`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Contributions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("contributions")}
                disabled={generatingReport === "contributions"}
              >
                {generatingReport === "contributions" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Workshops & Conferences */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.workshops_attended)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#f59e0b" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Workshops & Conf.</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">
              {facultyInfo.workshops_attended}
            </p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Events attended or organized
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/workshops`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Events
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("workshops")}
                disabled={generatingReport === "workshops"}
              >
                {generatingReport === "workshops" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Faculty Interactions */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.interactions)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#065f46" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Faculty Interactions</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{facultyInfo.interactions ?? 0}</p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Speaker, auditor, judge roles in colleges
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/interactions`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Interactions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("interactions")}
                disabled={generatingReport === "interactions"}
              >
                {generatingReport === "interactions" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* FDP/STTP & Panels */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.trainings)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#1f2937" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">FDP/STTP & Panels</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{facultyInfo.trainings ?? 0}</p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Attended, resource person, organized, UGC panels
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/trainings`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Training & Panels
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("trainings")}
                disabled={generatingReport === "trainings"}
              >
                {generatingReport === "trainings" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Financial Support */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.financial_supports)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#7c2d12" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-500 flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Financial Support</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">
              {facultyInfo.financial_supports ?? 0}
            </p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Grants, sponsorships, and institutional support
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/financial-support`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Financial Support
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("financial-support")}
                disabled={generatingReport === "financial-support"}
              >
                {generatingReport === "financial-support" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Patents & Copyrights */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.patents)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#4b5563" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 flex items-center justify-center">
              <BookMarked className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Patents & Copyrights</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{facultyInfo.patents ?? 0}</p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Intellectual property filings and registrations
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/patents`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage IP Records
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("patents")}
                disabled={generatingReport === "patents"}
              >
                {generatingReport === "patents" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Professional Memberships */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.professional_memberships)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#dc2626" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Professional Memberships</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">
              {facultyInfo.professional_memberships}
            </p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Organizations and society memberships
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/memberships`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Memberships
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("memberships")}
                disabled={generatingReport === "memberships"}
              >
                {generatingReport === "memberships" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>

        {/* Awards & Recognitions */}
        <BioluminescentGridItem className={`flex flex-col group transition-all duration-300 hover:-translate-y-1 ${getCardSpan(facultyInfo.awards)}`}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: "#0ea5e9" }} />
          <div className="flex items-center gap-3 mb-4 mt-1">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Awards & Recognitions</h3>
          </div>
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{facultyInfo.awards}</p>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
              Honors and recognitions received
            </p>
          </div>
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <Link href={`/faculty/awards`} className="w-full">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Manage Awards
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {canGenerateReports() && (
              <Button
                className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                onClick={() => generateModuleReport("awards")}
                disabled={generatingReport === "awards"}
              >
                {generatingReport === "awards" ? (
                  <>
                    Generating...
                    <Download className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Generate Report
                    <Download className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </BioluminescentGridItem>
      </BioluminescentGrid>

      {/* Information Management System Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Information Management System | Faculty Portal
        </p>
      </div>
    </div>
  );
}

function FacultyModulesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Faculty info header skeleton */}
      <div className={`${glassCardClasses} relative overflow-hidden animate-pulse`}>
        <div className="h-2 bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-center gap-4 mt-4">
          <Skeleton className="w-16 h-16 rounded-[20px]" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-3/4 max-w-xl mt-2" />
        </div>
      </div>

      {/* Module Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`${glassCardClasses} flex flex-col relative overflow-hidden animate-pulse`}>
            <div className="h-1 bg-gray-200 dark:bg-gray-800 absolute top-0 left-0 w-full" />
            <div className="flex items-center gap-3 mb-4 mt-1">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div>
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-3 w-4/5 mt-2" />
            </div>
            <div className="mt-auto pt-6 flex flex-col gap-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
