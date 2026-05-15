"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  GraduationCap,
  FlaskConical,
  Trophy,
  Wrench,
  RefreshCw,
  FileDown,
  Calendar,
  IndianRupee,
  FileText,
  Award,
  Activity,
  ChevronRight,
  LineChart as LineChartIcon
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import { AuthContext } from "@/lib/context/AuthContext";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ROLE_LABELS } from "@/lib/utils/formatters";
import { FacultyHub } from "@/components/faculty/FacultyHub";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/faculty/charts/ActivityTimeline";
import { ModuleDonutChart } from "@/components/faculty/charts/ModuleDonutChart";
import { useFacultyStats } from "@/lib/hooks/useFacultyStats";
import Link from "next/link";

// Sample data for charts
const publicationsByMonth = [
  { month: "Jan", count: 4 }, { month: "Feb", count: 7 }, { month: "Mar", count: 5 },
  { month: "Apr", count: 9 }, { month: "May", count: 6 }, { month: "Jun", count: 11 },
  { month: "Jul", count: 8 }, { month: "Aug", count: 13 }, { month: "Sep", count: 10 },
  { month: "Oct", count: 7 }, { month: "Nov", count: 15 }, { month: "Dec", count: 9 },
];

const facultyByDept = [
  { dept: "CS", count: 18 }, { dept: "IT", count: 14 }, { dept: "ME", count: 16 },
  { dept: "CE", count: 12 }, { dept: "EE", count: 11 }, { dept: "EC", count: 15 },
  { dept: "CH", count: 9 }, { dept: "MCA", count: 8 }, { dept: "MBA", count: 10 },
];

const pubTypeData = [
  { name: "Journal Articles", value: 45, color: "#0F2557" },
  { name: "Conference Papers", value: 30, color: "#E8A020" },
  { name: "Books & Chapters", value: 15, color: "#16A34A" },
  { name: "Others", value: 10, color: "#6B7280" },
];

const recentActivity = [
  { user: "Dr. Priya Sharma", action: "Added publication", entity: "IEEE Journal paper", time: "2h ago" },
  { user: "Dr. Rajesh Kumar", action: "Updated profile", entity: "Personal information", time: "4h ago" },
  { user: "Admin", action: "Created user", entity: "faculty@cs.edu", time: "6h ago" },
  { user: "Dr. Anita Singh", action: "Added research project", entity: "DST Grant Project", time: "1d ago" },
  { user: "Dr. Vikram Nair", action: "Added award", entity: "Best Researcher 2024", time: "2d ago" },
];

export default function DashboardPage() {
  const { userDoc } = useContext(AuthContext);
  const router = useRouter();
  const role = userDoc?.role ?? "faculty";

  // Redirect deptadmin to their dedicated dashboard
  useEffect(() => {
    if (role === "deptadmin") {
      router.replace("/dept-admin");
    }
  }, [role, router]);

  const { counts, timeline, totalImpact, loading: statsLoading } = useFacultyStats(userDoc?.uid ?? "");

  // Only add "Dr." for faculty and hod roles
  const shouldAddDr = role === "faculty" || role === "hod";
  const welcomeName = userDoc?.displayName 
    ? (userDoc.displayName.startsWith("Dr.") || !shouldAddDr ? userDoc.displayName : `Dr. ${userDoc.displayName}`) 
    : "Faculty Member";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${welcomeName}`}
        subtitle={`${ROLE_LABELS[role]} Dashboard — ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      {/* Stats Row for Admin/Superadmin */}
      {(role === "superadmin" || role === "admin") && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Departments"
            value="12"
            subtitle="Active departments"
            icon={Building2}
            iconColor="text-primary"
            trend={{ value: 0, label: "unchanged" }}
          />
          <StatsCard
            title="Total Faculty"
            value="136"
            subtitle="Across all departments"
            icon={GraduationCap}
            iconColor="text-accent"
            trend={{ value: 4.5, label: "from last year" }}
          />
          <StatsCard
            title="Publications This Year"
            value="104"
            subtitle="Journals, conferences & books"
            icon={BookOpen}
            iconColor="text-success"
            trend={{ value: 12.3, label: "from last year" }}
          />
          <StatsCard
            title="Active Users"
            value="89"
            subtitle="Logged in this month"
            icon={Users}
            iconColor="text-purple-600"
            trend={{ value: 8.1, label: "from last month" }}
          />
        </div>
      )}

      {/* Stats Row for HOD */}
      {role === "hod" && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Faculty in Dept"
            value="18"
            subtitle="Computer Science"
            icon={GraduationCap}
            iconColor="text-primary"
          />
          <StatsCard
            title="Dept Publications"
            value="34"
            subtitle="This academic year"
            icon={BookOpen}
            iconColor="text-accent"
            trend={{ value: 9.2, label: "from last year" }}
          />
          <StatsCard
            title="Active Research"
            value="7"
            subtitle="Ongoing projects"
            icon={FlaskConical}
            iconColor="text-success"
          />
          <StatsCard
            title="Workshops Attended"
            value="23"
            subtitle="This year, dept-wide"
            icon={Wrench}
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* Faculty Specific Dashboard */}
      {role === "faculty" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-[rgb(var(--text-primary))]">Academic Impact Overview</h1>
              <p className="text-muted text-sm">A summary of your professional and research contributions.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/faculty/reports">
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <FileDown className="w-4 h-4" /> Reports Center
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Total Impact Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/20">
              <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wider mb-2">Total Impact Score</p>
                <h2 className="text-7xl font-bold mb-4">{totalImpact}</h2>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                  Across all academic modules
                </div>
              </div>
              <div className="absolute bottom-0 right-0 p-4 opacity-20 transform translate-x-4 translate-y-4">
                <TrendingUp className="w-48 h-48" />
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1C2128] rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">Activity Timeline</h3>
                  <p className="text-xs text-muted">Academic contributions across sessions.</p>
                </div>
                <div className="text-xs font-medium text-muted bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                  Cumulative: {totalImpact}
                </div>
              </div>
              <ActivityTimeline data={timeline.length > 0 ? timeline : [
                { session: "2021-22", count: 0 },
                { session: "2022-23", count: 0 },
                { session: "2023-24", count: 0 },
                { session: "2024-25", count: 0 },
                { session: "2025-26", count: 0 },
              ]} />
            </div>
          </div>

          {/* Module Stats Grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "PUBLICATIONS", count: counts.publications, icon: BookOpen, color: "blue", path: "publications" },
              { label: "RESEARCH PROJECTS", count: counts.research, icon: FlaskConical, color: "emerald", path: "research" },
              { label: "WORKSHOPS & CONT.", count: counts.workshops, icon: Calendar, color: "orange", path: "workshops" },
              { label: "FACULTY INTERACTIONS", count: counts.interactions, icon: Users, color: "sky", path: "interactions" },
              { label: "RECOGNITION & AWARDS", count: counts.awards, icon: Trophy, color: "amber", path: "awards" },
              { label: "PATENTS / COPYRIGHTS", count: counts.patents, icon: FileText, color: "red", path: "patents" },
              { label: "PROF. MEMBERSHIPS", count: counts.memberships, icon: Award, color: "indigo", path: "memberships" },
              { label: "CONTRIBUTIONS", count: counts.contributions, icon: Activity, color: "teal", path: "contributions" },
              { label: "FINANCIAL SUPPORT", count: counts.financial, icon: IndianRupee, color: "rose", path: "financial" },
              { label: "QUALIFICATIONS", count: 0, icon: GraduationCap, color: "purple", path: "qualifications" },
            ].map((module) => (
              <Link key={module.label} href={`/faculty/${userDoc?.uid}?tab=${module.path}`}>
                <div className="bg-white dark:bg-[#1C2128] rounded-xl border border-border p-4 hover:shadow-md transition-shadow group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-${module.color}-50 dark:bg-${module.color}-900/20 text-${module.color}-600`}>
                      <module.icon className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-bold text-[rgb(var(--text-primary))]">{module.count}</span>
                  </div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-4 line-clamp-1">{module.label}</p>
                  <div className="flex justify-center mb-4">
                    <ModuleDonutChart data={[
                      { name: "Count", value: module.count || 1, color: `rgb(var(--color-${module.color}-500))` },
                      { name: "Remaining", value: module.count ? 0 : 5, color: '#f3f4f6' }
                    ]} size={60} />
                  </div>
                  <div className="flex items-center justify-center text-[10px] font-semibold text-muted group-hover:text-primary transition-colors">
                    Manage <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Admin Specific Charts */}
      {(role === "superadmin" || role === "admin") && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
            <h3 className="text-sm font-heading font-semibold text-[rgb(var(--text-primary))] mb-4">
              Publications Trend (Monthly)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={publicationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0F2557"
                  strokeWidth={2}
                  dot={{ fill: "#E8A020", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
            <h3 className="text-sm font-heading font-semibold text-[rgb(var(--text-primary))] mb-4">
              Publication Types Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pubTypeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pubTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span className="text-[10px] text-muted">{value}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
