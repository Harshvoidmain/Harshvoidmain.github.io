"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Contribution {
  id: number;
  title: string;
  description: string;
  contributionType: string;
  date: string;
  status: string;
}

export default function ContributionsReportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
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
      const response = await fetch("/api/faculty/contributions", {
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
        setContributions(data.data || []);
      } else {
        setError(data.message || "Failed to fetch contributions");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setError("Failed to fetch contributions report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      const csvContent = [
        ["Title", "Description", "Type", "Date", "Status"],
        ...contributions.map(c => [
          c.title,
          c.description,
          c.contributionType,
          c.date,
          c.status
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contributions-report.csv";
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
            <CardTitle className="text-3xl">Contributions Report</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-600 p-4 bg-red-50 rounded border border-red-200">
                {error}
              </div>
            ) : contributions.length === 0 ? (
              <div className="text-gray-600 p-4 bg-gray-50 rounded border border-gray-200">
                No contributions found.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-lg font-semibold">Total Contributions: {contributions.length}</p>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
                <div className="space-y-3">
                  {contributions.map((contribution) => (
                    <div key={contribution.id} className="p-4 bg-white border rounded-lg">
                      <h3 className="font-semibold text-lg">{contribution.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{contribution.description}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-gray-700">
                        <p><strong>Type:</strong> {contribution.contributionType}</p>
                        <p><strong>Date:</strong> {contribution.date}</p>
                        <p><strong>Status:</strong> {contribution.status}</p>
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
