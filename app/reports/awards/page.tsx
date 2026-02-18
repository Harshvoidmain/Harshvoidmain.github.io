"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Award {
  id: number;
  awardName: string;
  awardingOrganization: string;
  awardDate: string;
  category: string;
  awardDescription?: string;
}

export default function AwardsReportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [awards, setAwards] = useState<Award[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchReport();
    }
  }, [user, loading]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/faculty/awards", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized. Please log in again.");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAwards(data.data || []);
      } else {
        setError(data.message || "Failed to fetch awards");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setError("Failed to fetch awards report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      const csvContent = [
        ["Award Name", "Organization", "Date", "Category", "Description"],
        ...awards.map(a => [
          a.awardName,
          a.awardingOrganization,
          a.awardDate,
          a.category,
          a.awardDescription || "N/A"
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "awards-report.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2">Loading report...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Awards & Recognitions Report</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-600 p-4 bg-red-50 rounded border border-red-200">
                {error}
              </div>
            ) : awards.length === 0 ? (
              <div className="text-gray-600 p-4 bg-gray-50 rounded border border-gray-200">
                No awards found.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-lg font-semibold">Total Awards: {awards.length}</p>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
                <div className="space-y-3">
                  {awards.map((award) => (
                    <div key={award.id} className="p-4 bg-white border rounded-lg">
                      <h3 className="font-semibold text-lg">{award.awardName}</h3>
                      <p className="text-gray-600 text-sm mt-1">{award.awardDescription}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-gray-700">
                        <p><strong>Organization:</strong> {award.awardingOrganization}</p>
                        <p><strong>Date:</strong> {award.awardDate}</p>
                        <p><strong>Category:</strong> {award.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
