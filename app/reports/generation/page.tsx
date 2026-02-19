"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl">
        {/* Header - Left Aligned */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Reports Generation
          </h1>
          <p className="text-gray-600 mt-2">
            Generate comprehensive reports for each faculty module
          </p>
        </div>

        {/* Modules Grid - Matching Faculty Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FACULTY_MODULES.map((module) => {
            const Icon = module.icon;
            const isLoading = loadingModule === module.id;

            return (
              <Card
                key={module.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="h-1"
                  style={{ backgroundColor: module.borderColor }}
                />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${module.iconColor}`} />
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Generate detailed report for{" "}
                    {module.title.toLowerCase()}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-6">
                  <Button
                    onClick={() =>
                      handleGenerateReport(module.id, module.prefix)
                    }
                    disabled={isLoading}
                    className="w-full flex justify-between items-center"
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
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer Info - Left Aligned */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            About Reports
          </h3>
          <p className="text-blue-800 text-sm">
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
