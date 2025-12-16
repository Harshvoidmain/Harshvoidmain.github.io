"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";
import MainLayout from "@/app/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, TrendingUp, Calendar, BookOpen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

interface DashboardData {
  totalPublications: number;
  currentYearPublications: number;
  categoryBreakup: { category: string; count: number }[];
  yearDistribution: { year: number; count: number }[];
  recentPublications?: any[];
  facultyBreakup?: { facultyId: number; facultyName: string; publicationCount: number }[];
  departmentBreakup?: { department: string; publicationCount: number }[];
  topFaculty?: {
    facultyId: number;
    facultyName: string;
    department: string;
    publicationCount: number;
  }[];
}

export default function PublicationsDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardType, setDashboardType] = useState<"faculty" | "department" | "institute">(
    "institute"
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [publicationsList, setPublicationsList] = useState<any[]>([]);

  useEffect(() => {
    const type = searchParams?.get("type") as "faculty" | "department" | "institute" | null;
    const id = searchParams?.get("id") || "";

    if (type) {
      setDashboardType(type);
      setSelectedId(id);
    } else if (user?.role === "faculty" && user?.username) {
      // Auto-detect faculty dashboard
      setDashboardType("faculty");
      setSelectedId(user.username);
    }
  }, [searchParams, user]);

  // Fetch departments for selector
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

  useEffect(() => {
    if (!authLoading && dashboardType) {
      // Only fetch if we have selectedId for department/faculty, or if it's institute
      // For faculty, don't auto-fetch on every keystroke - wait for manual trigger or Enter key
      if (dashboardType === "institute") {
        fetchDashboardData();
      } else if (dashboardType === "department" && selectedId) {
        fetchDashboardData();
      }
      // Faculty dashboard requires manual "Load" button click or Enter key
    }
  }, [dashboardType, selectedId, authLoading]);

  // Separate effect for department changes (auto-fetch when department selected)
  useEffect(() => {
    if (!authLoading && dashboardType === "department" && selectedId) {
      fetchDashboardData();
    }
  }, [selectedId]); // Only trigger when selectedId changes, not dashboardType

  // Don't block rendering if not authenticated - allow viewing with dummy data
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let url = "";

      if (dashboardType === "faculty") {
        const fid = parseInt((selectedId || "").toString().trim(), 10);
        if (!selectedId || isNaN(fid)) {
          toast.error("Please enter a valid numeric Faculty ID");
          setLoading(false);
          return;
        }
        url = `/api/dashboard/faculty/${fid}`;
      } else if (dashboardType === "department") {
        if (selectedId) {
          url = `/api/dashboard/department/${selectedId}`;
        } else {
          // If department selected but no ID, fall back to institute
          console.warn("Department selected but no ID provided, using institute view");
          url = `/api/dashboard/institute`;
        }
      } else {
        url = `/api/dashboard/institute`;
      }
      
      console.log(`Fetching dashboard data from: ${url}`, { dashboardType, selectedId });

      const response = await fetch(url, {
        credentials: "include", // Include cookies for auth
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Not authenticated, but continuing for testing");
          // For testing, continue even without auth - return empty data
          setDashboardData({
            totalPublications: 0,
            currentYearPublications: 0,
            categoryBreakup: [],
            yearDistribution: [],
          });
          setLoading(false);
          return;
        } else if (response.status === 404) {
          console.error(`API endpoint not found: ${url}`);
          console.error("Make sure Next.js dev server has been restarted after adding new API routes");
          toast.error("Dashboard API not found. Please restart the dev server.");
          setDashboardData({
            totalPublications: 0,
            currentYearPublications: 0,
            categoryBreakup: [],
            yearDistribution: [],
          });
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
        setDashboardData(data.data);
        // If the API returned recentPublications (faculty route), use it directly
        if (Array.isArray(data.data.recentPublications) && data.data.recentPublications.length > 0) {
          const mapped = data.data.recentPublications
            .slice()
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              publicationType: p.type,
              publicationDate: p.date,
              publicationVenue: p.venue,
              facultyName: data.data.facultyName || "",
            }));
          setPublicationsList(mapped);
        } else {
          // Otherwise fetch via publications report API (supports dept/faculty filters)
          setTimeout(() => {
            fetchPublicationsList(data.data);
          }, 0);
        }
      } else {
        console.error("API returned error:", data.message);
        // Don't show error toast if no data - might just be empty
        if (data.message && !data.message.includes("No data")) {
          toast.error(data.message || "Failed to fetch dashboard data");
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      // Don't show error toast if it's just a network/auth issue during testing
      if (error instanceof Error && !error.message.includes("401")) {
        toast.error("Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch publications list for the current dashboard context
  const fetchPublicationsList = async (loadedData?: any) => {
    try {
      let url = "/api/publications/report";
      const params = new URLSearchParams();

      if (dashboardType === "faculty") {
        // prefer facultyId from loadedData if present
        const fid = loadedData?.facultyId || selectedId;
        if (fid) params.append("facultyId", fid.toString());
      } else if (dashboardType === "department") {
        if (selectedId) params.append("departmentId", selectedId.toString());
      }

      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      const res = await fetch(fullUrl, { credentials: "include" });
      if (!res.ok) return setPublicationsList([]);
      const json = await res.json();
      if (json.success && Array.isArray(json.data.publications)) {
        // sort by date desc and take top 10
        const sorted = json.data.publications
          .slice()
          .sort((a: any, b: any) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
          .slice(0, 10);
        setPublicationsList(sorted);
      } else {
        setPublicationsList([]);
      }
    } catch (err) {
      console.error("Failed to fetch publications list:", err);
      setPublicationsList([]);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  // Allow viewing even without auth for testing (remove in production)
  // if (!user) {
  //   router.push("/login?returnUrl=/dashboard/publications");
  //   return null;
  // }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-8 text-gray-500">
            No dashboard data available.
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Publications Dashboard</h1>
          <div className="flex gap-2">
            <Select value={dashboardType} onValueChange={(value: any) => {
              setDashboardType(value);
              setSelectedId(""); // Reset selected ID when changing type
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="institute">Institute</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
            
            {dashboardType === "department" && (
              <Select 
                value={selectedId || "all"} 
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedId("");
                    setDashboardType("institute");
                  } else {
                    setSelectedId(value);
                  }
                }}
                disabled={departments.length === 0}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments (Institute View)</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {dashboardType === "faculty" && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter numeric Faculty ID"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selectedId) {
                      fetchDashboardData();
                    }
                  }}
                />
                <Button
                  onClick={fetchDashboardData}
                  disabled={!selectedId}
                  size="sm"
                >
                  Load
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalPublications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time publications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Current Year</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.currentYearPublications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Published in {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.categoryBreakup.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Different publication types
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.categoryBreakup.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.categoryBreakup}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                    >
                      {dashboardData.categoryBreakup.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value} publications`,
                        name
                      ]}
                    />
                    <Legend 
                      formatter={(value: string, entry: any) => 
                        `${value}: ${entry.payload.count} (${((entry.payload.count / dashboardData.totalPublications) * 100).toFixed(1)}%)`
                      }
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

          {/* Year Distribution Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Year-wise Distribution (Last 5 Years)</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.yearDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.yearDistribution} margin={{ top: 40, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      tickMargin={8}
                      axisLine={false}
                    />
                    <YAxis
                      label={{ value: 'Publications', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} publications`, 'Count']}
                      labelFormatter={(year) => `Year: ${year}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill="#0088FE"
                      radius={[8, 8, 4, 4]}
                      name="Publications"
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        formatter={(value: any) => value}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Faculty/Department Breakdown */}
        {dashboardData.facultyBreakup && dashboardData.facultyBreakup.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Top Publishing Faculty</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboardData.facultyBreakup}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="facultyName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="publicationCount" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Department Breakdown */}
        {dashboardData.departmentBreakup && dashboardData.departmentBreakup.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Department-wise Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.departmentBreakup} margin={{ top: 48, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="publicationCount" fill="#FF8042" radius={[8, 8, 4, 4]}>
                    <LabelList
                      dataKey="publicationCount"
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      formatter={(value: any) => value}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Faculty Table */}
        {dashboardData.topFaculty && dashboardData.topFaculty.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Publishing Faculty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rank</th>
                      <th className="text-left p-2">Faculty Name</th>
                      <th className="text-left p-2">Department</th>
                      <th className="text-right p-2">Publications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.topFaculty.map((faculty, index) => (
                      <tr key={faculty.facultyId} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{faculty.facultyName}</td>
                        <td className="p-2">{faculty.department}</td>
                        <td className="p-2 text-right">{faculty.publicationCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Publications List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Publications</CardTitle>
          </CardHeader>
          <CardContent>
            {publicationsList.length === 0 ? (
              <div className="text-center text-gray-500 py-6">No recent publications found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Title</th>
                      {dashboardType !== "faculty" && <th className="text-left p-2">Faculty</th>}
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Venue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicationsList.map((pub, idx) => (
                      <tr key={pub.id || idx} className="border-b">
                        <td className="p-2 align-top">{idx + 1}</td>
                        <td className="p-2 align-top">{pub.title}</td>
                        {dashboardType !== "faculty" && (
                          <td className="p-2 align-top">{pub.facultyName || "-"}</td>
                        )}
                        <td className="p-2 align-top">{pub.publicationType}</td>
                        <td className="p-2 align-top">{new Date(pub.publicationDate).toLocaleDateString("en-IN")}</td>
                        <td className="p-2 align-top">{pub.publicationVenue || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

