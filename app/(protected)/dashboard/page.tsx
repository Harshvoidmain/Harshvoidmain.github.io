"use client";

import { useContext } from "react";
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  GraduationCap,
  FlaskConical,
  Trophy,
  Wrench,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AuthContext } from "@/lib/context/AuthContext";
import { StatsCard } from "@/components/shared/StatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ROLE_LABELS } from "@/lib/utils/formatters";

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
  const role = userDoc?.role ?? "faculty";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${userDoc?.displayName?.split(" ")[0] ?? "User"}`}
        subtitle={`${ROLE_LABELS[role]} Dashboard — ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      {/* Stats Row */}
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

      {role === "faculty" && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="My Publications"
            value="12"
            subtitle="Total publications"
            icon={BookOpen}
            iconColor="text-primary"
            trend={{ value: 20, label: "from last year" }}
          />
          <StatsCard
            title="Citations"
            value="148"
            subtitle="Total citations received"
            icon={TrendingUp}
            iconColor="text-accent"
          />
          <StatsCard
            title="Active Projects"
            value="2"
            subtitle="Research projects"
            icon={FlaskConical}
            iconColor="text-success"
          />
          <StatsCard
            title="Awards Won"
            value="5"
            subtitle="Career total"
            icon={Trophy}
            iconColor="text-yellow-600"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Publications trend - takes 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading font-semibold text-[rgb(var(--text-primary))] mb-4">
            Publications This Year
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={publicationsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0F2557"
                strokeWidth={2}
                dot={{ fill: "#E8A020", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pub type donut */}
        <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading font-semibold text-[rgb(var(--text-primary))] mb-4">
            Publication Types
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
              <Legend
                formatter={(value) => <span style={{ fontSize: "11px", color: "#6B7280" }}>{value}</span>}
              />
              <Tooltip formatter={(value) => [`${value}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Faculty by dept and recent activity */}
      {(role === "superadmin" || role === "admin") && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
            <h3 className="text-sm font-heading font-semibold text-[rgb(var(--text-primary))] mb-4">
              Faculty by Department
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={facultyByDept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis dataKey="dept" type="category" width={36} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#E8A020" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
            <h3 className="text-sm font-heading font-semibold text-[rgb(var(--text-primary))] mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                    {activity.user.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[rgb(var(--text-primary))] truncate">
                      {activity.user}
                    </p>
                    <p className="text-xs text-muted">
                      {activity.action}: {activity.entity}
                    </p>
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {(role === "superadmin" || role === "admin") && (
        <div className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading font-semibold text-[rgb(var(--text-primary))] mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Add Faculty", href: "/faculty/add", icon: GraduationCap },
              { label: "Add Department", href: "/admin/departments", icon: Building2 },
              { label: "Create User", href: "/admin/users", icon: Users },
              { label: "Generate Report", href: "/reports", icon: TrendingUp },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-[rgb(var(--text-primary))] hover:border-primary hover:bg-primary/5 transition-all"
              >
                <action.icon className="w-4 h-4 text-primary" />
                {action.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
