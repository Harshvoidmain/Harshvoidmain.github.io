"use client";

import { Suspense } from 'react';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Download,
  Filter,
  FileText,
  TrendingUp,
  Calendar,
  BookOpen,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label as RechartsLabel } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface Publication {
  id: number;
  title: string;
  authors: string;
  publicationDate: string;
  publicationType: string;
  publicationVenue: string;
  doi: string | null;
  url: string | null;
  citationCount: number | null;
  facultyId: number;
  facultyName: string;
  department: string;
}

interface CategoryBreakdown {
  category: string;
  count: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

function PublicationsReportPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [year, setYear] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [facultyId, setFacultyId] = useState<string>("all");

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments");
        const data = await response.json();
        if (data.success) {
          setDepartments(
            data.data.map((dept: any) => ({
              id: dept.Department_ID,
              name: dept.Department_Name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch publications report
  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (year !== "all") params.append("year", year);
      if (category !== "all") params.append("category", category);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (departmentId !== "all") params.append("departmentId", departmentId);
      if (facultyId !== "all") params.append("facultyId", facultyId);

      const response = await fetch(`/api/publications/report?${params.toString()}`, {
        credentials: "include", // Include cookies for auth
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Not authenticated, but continuing for testing");
          // For testing, continue even without auth - return empty data
          setPublications([]);
          setCategoryBreakdown([]);
          setTotalCount(0);
          setLoading(false);
          return;
        } else if (response.status === 404) {
          console.error(`API endpoint not found: /api/publications/report`);
          console.error("Make sure Next.js dev server has been restarted after adding new API routes");
          toast.error("Reports API not found. Please restart the dev server.");
          setPublications([]);
          setCategoryBreakdown([]);
          setTotalCount(0);
          setLoading(false);
          return;
        } else {
          const errorText = await response.text();
          console.error(`HTTP error! status: ${response.status}`, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        setPublications(data.data.publications || []);
        setCategoryBreakdown(data.data.summary?.categoryBreakdown || []);
        setTotalCount(data.data.summary?.total || 0);

        // Extract available years from publications
        if (data.data.publications && data.data.publications.length > 0) {
          const years = [
            ...new Set(
              data.data.publications.map((pub: Publication) =>
                new Date(pub.publicationDate).getFullYear()
              )
            ),
          ].sort((a, b) => b - a) as number[];
          setAvailableYears(years);
        }
      } else {
        console.error("API returned error:", data.message);
        // Don't show error toast if no data - might just be empty
        if (data.message && !data.message.includes("No publications")) {
          toast.error(data.message || "Failed to fetch publications");
        }
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      // Don't show error toast if it's just a network/auth issue during testing
      if (error instanceof Error && !error.message.includes("401")) {
        toast.error("Failed to fetch publications report");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchReport();
      } else {
        // If not authenticated, still try to fetch (for testing)
        // In production, you might want to redirect to login
        fetchReport();
      }
    }
  }, [authLoading, user]);

  // Generate PDF
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;

      // Try to load logo from public folder
      const fetchImageAsDataUrl = async (url: string) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Failed to fetch logo:", e);
          return null;
        }
      };

      const logoDataUrl = await fetchImageAsDataUrl("/fcritlogo.png");

      // Header area - smaller logo to save space
      if (logoDataUrl) {
        const logoWidth = 18;
        const logoHeight = 18;
        doc.addImage(logoDataUrl, "PNG", margin, 14, logoWidth, logoHeight);
      } else {
        doc.setDrawColor(200);
        doc.rect(margin, 14, 18, 18);
        doc.setFontSize(7);
        doc.text("LOGO", margin + 5, 24);
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Agnel Charities", pageWidth / 2, 22, { align: "center" });

      doc.setFontSize(16);
      doc.text(
        "Fr. C. Rodrigues Institute of Technology, Vashi",
        pageWidth / 2,
        30,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        "(An Autonomous Institute & Permanently Affiliated to University of Mumbai)",
        pageWidth / 2,
        36,
        { align: "center" }
      );

      // Report title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Publications Report", pageWidth / 2, 50, { align: "center" });

      // Filters info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = 60;
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, margin, yPos);
      yPos += 6;
      doc.text(`Total Publications: ${totalCount}`, margin, yPos);

      if (year !== "all") {
        yPos += 6;
        doc.text(`Year: ${year}`, margin, yPos);
      }
      if (category !== "all") {
        yPos += 6;
        doc.text(`Category: ${category}`, margin, yPos);
      }

      // Table data (do not truncate, let autotable wrap)
      const tableData = publications.map((pub, index) => [
        (index + 1).toString(),
        pub.title,
        pub.facultyName,
        pub.department,
        pub.publicationType,
        new Date(pub.publicationDate).toLocaleDateString("en-IN"),
        pub.publicationVenue || "",
      ]);

      // compute available width and assign proportional column widths so table fits
      const availWidth = pageWidth - margin * 2;
      const colRatios = [0.05, 0.45, 0.15, 0.12, 0.08, 0.08, 0.07];
      const colWidths: number[] = colRatios.map((r) => Math.floor(availWidth * r));

      autoTable(doc, {
        head: [["Sr. No", "Title", "Faculty", "Department", "Type", "Date", "Venue"]],
        body: tableData,
        startY: yPos + 8,
        theme: "grid",
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
        styles: { fontSize: 8, overflow: "linebreak", cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: colWidths[0] },
          1: { cellWidth: colWidths[1], overflow: "linebreak" },
          2: { cellWidth: colWidths[2], overflow: "linebreak" },
          3: { cellWidth: colWidths[3], overflow: "linebreak" },
          4: { cellWidth: colWidths[4] },
          5: { cellWidth: colWidths[5] },
          6: { cellWidth: colWidths[6], overflow: "linebreak" },
        },
        willDrawCell: (data) => {
          // ensure headers have smaller padding if needed
        },
      });

      // Category breakdown - put on new page if table used most of first page
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 100;
      if (finalY + 60 > pageHeight - margin) doc.addPage();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Category Distribution", margin, (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 20);

      const categoryTableData = categoryBreakdown.map((item) => [item.category, item.count.toString()]);

      autoTable(doc, {
        head: [["Category", "Count"]],
        body: categoryTableData,
        startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 18 : 30,
        theme: "grid",
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
        styles: { fontSize: 10 },
      });

      // Footer using Times font for a more formal look
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("times", "normal");
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

      const dateStr = new Date().toISOString().split("T")[0];
      doc.save(`Publications_Report_${dateStr}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Allow viewing even without auth for testing (remove in production)
  // if (!user) {
  //   router.push("/login?returnUrl=/reports/publications");
  //   return null;
  // }

  return (
    <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Publications Report</h1>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading || loading || publications.length === 0}
            className="flex items-center gap-2"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PDF
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="journal">Journal</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="book_chapter">Book Chapter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={fetchReport} className="w-full">
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryBreakdown.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Current Year</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {publications.filter(
                  (p) => new Date(p.publicationDate).getFullYear() === new Date().getFullYear()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.map((d, i) => ({
                        browser: d.category,
                        visitors: d.count,
                        fill: COLORS[i % COLORS.length],
                      }))}
                      dataKey="visitors"
                      nameKey="browser"
                      innerRadius={56}
                      outerRadius={90}
                      paddingAngle={3}
                      strokeWidth={4}
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      <RechartsLabel
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ fontFamily: "Times New Roman, Times, serif" }}
                              >
                                <tspan x={viewBox.cx} dy="-6" className="fill-foreground text-3xl font-bold">
                                  {totalCount}
                                </tspan>
                                <tspan x={viewBox.cx} dy="18" className="fill-muted-foreground" style={{ fontSize: 11 }}>
                                  Publications
                                </tspan>
                              </text>
                            );
                          }
                          return null;
                        }}
                      />

                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke={index === activePieIndex ? "#333" : "#fff"}
                          strokeWidth={index === activePieIndex ? 2 : 1}
                          opacity={activePieIndex === null ? 0.95 : index === activePieIndex ? 1 : 0.6}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} publications`,
                        name,
                      ]}
                      contentStyle={{ whiteSpace: "normal", maxWidth: 260 }}
                      wrapperStyle={{ zIndex: 1000 }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      height={42}
                      formatter={(value: string, entry: any) => {
                        const total = categoryBreakdown.reduce((sum, item) => sum + item.count, 0);
                        const pct = total > 0 ? ((entry.payload.visitors / total) * 100).toFixed(1) : "0.0";
                        return `${value}: ${entry.payload.visitors} (${pct}%)`;
                      }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Publications List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : publications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No publications found with the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Venue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publications.map((pub, index) => (
                        <TableRow key={pub.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {pub.title}
                          </TableCell>
                          <TableCell>{pub.facultyName}</TableCell>
                          <TableCell>{pub.department}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {pub.publicationType}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(pub.publicationDate).toLocaleDateString("en-IN")}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {pub.publicationVenue}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}


export default function PublicationsReportPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <PublicationsReportPageInner />
    </Suspense>
  );
}
