"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  BookOpen,
  Target,
  FileText,
  Users,
  Globe,
  Award,
  GraduationCap,
  TrendingUp,
  Cpu,
  MessageCircle,
} from "lucide-react";
import { BioluminescentGrid, BioluminescentGridItem } from "@/components/ui/bioluminescent-grid";

const FACULTY_MODULES = [
  {
    id: "publications",
    title: "Publications",
    icon: BookOpen,
    iconColor: "text-blue-600",
    borderColor: "#2563eb",
    prefix: "FP",
  },
  {
    id: "research-projects",
    title: "Research Projects",
    icon: Target,
    iconColor: "text-yellow-600",
    borderColor: "#ca8a04",
    prefix: "FRP",
  },
  {
    id: "contributions",
    title: "Contributions",
    icon: FileText,
    iconColor: "text-red-600",
    borderColor: "#dc2626",
    prefix: "FC",
  },
  {
    id: "workshops",
    title: "Workshops & Conferences",
    icon: Users,
    iconColor: "text-green-600",
    borderColor: "#16a34a",
    prefix: "FW",
  },
  {
    id: "memberships",
    title: "Professional Memberships",
    icon: Globe,
    iconColor: "text-pink-600",
    borderColor: "#db2777",
    prefix: "FM",
  },
  {
    id: "awards",
    title: "Awards & Recognitions",
    icon: Award,
    iconColor: "text-orange-600",
    borderColor: "#ea580c",
    prefix: "FA",
  },
  {
    id: "fdp-sttp",
    title: "FDP / STTP",
    icon: GraduationCap,
    iconColor: "text-teal-600",
    borderColor: "#0d9488",
    prefix: "FF",
  },
  {
    id: "financial-support",
    title: "Financial Support",
    icon: TrendingUp,
    iconColor: "text-lime-600",
    borderColor: "#65a30d",
    prefix: "FFinS",
  },
  {
    id: "patents",
    title: "Patent / Copyright",
    icon: Cpu,
    iconColor: "text-purple-600",
    borderColor: "#9333ea",
    prefix: "FPat",
  },
  {
    id: "interaction",
    title: "Faculty Interaction",
    icon: MessageCircle,
    iconColor: "text-cyan-600",
    borderColor: "#06b6d4",
    prefix: "FI",
  },
];

export default function ReportsGenerationPage() {
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  const { user } = useAuth();

  const handleGenerateReport = async (
    moduleId: string,
    prefix: string
  ) => {
    setLoadingModule(moduleId);
    try {
      // Fetch report from API
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: moduleId,
          format: "pdf",
          facultyId: user?.facultyId?.toString() || "",
          isIndividualReport: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || `Failed to generate report`);
      }

      // Convert base64 to blob and download
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
      a.download = result.data.filename || `${prefix}-${user?.id || "000"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate report. Please try again."
      );
    } finally {
      setLoadingModule(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-7xl">
        {/* Header - Left Aligned */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Reports Generation
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground max-w-2xl mt-2">
            Generate comprehensive reports for each faculty module
          </p>
        </div>

        {/* Modules Grid - Matching Faculty Module Cards */}
        <BioluminescentGrid>
          {FACULTY_MODULES.map((module) => {
            const Icon = module.icon;
            const isLoading = loadingModule === module.id;

            return (
              <BioluminescentGridItem
                key={module.id}
                className="flex flex-col group transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: module.borderColor }}
                />
                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div className={`w-10 h-10 rounded-xl bg-opacity-10 dark:bg-opacity-20 ${module.iconColor.replace('text-', 'bg-')} ${module.iconColor} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    {module.title}
                  </h3>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mt-1">
                    Generate detailed report for {module.title.toLowerCase()}
                  </p>
                </div>
                <div className="mt-auto pt-6 flex flex-col gap-3">
                  <Button
                    onClick={() =>
                      handleGenerateReport(module.id, module.prefix)
                    }
                    disabled={isLoading}
                    className="w-full flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                  >
                    {isLoading ? (
                      <>
                        <span>Generating...</span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Generate Report</span>
                        <Download className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </BioluminescentGridItem>
            );
          })}
        </BioluminescentGrid>

        {/* Footer Info - Left Aligned */}
        <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
            About Reports
          </h3>
          <p className="text-indigo-800 dark:text-indigo-200 text-sm">
            Generate detailed reports for each faculty module to view
            analytics, statistics, and comprehensive data breakdowns.
            These reports can be filtered by various criteria and exported
            for further analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
