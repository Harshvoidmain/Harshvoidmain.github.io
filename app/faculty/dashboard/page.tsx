"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/app/components/layout/MainLayout";
import { useAuth } from "@/app/providers/auth-provider";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import CategorySessionChart from "@/app/components/faculty/CategorySessionChart";
import {
  getYearlyActivityStats,
  getOverallDistribution,
  getRecentActivities,
  processPublicationData,
  processResearchProjectData,
  processContributionData,
  processWorkshopData,
  processMembershipData,
  processAwardData,
  getCurrentSession,
  CHART_COLORS,
} from "./dashboard-utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChartData { name: string; value: number; color?: string }
interface CategoryStore { currentSessionData: ChartData[]; allSessionsData: ChartData[] }

// ─── Category Definitions ────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "publications", label: "Publications", color: "#6366f1", light: "#eef2ff" },
  { id: "research-projects", label: "Research Projects", color: "#f59e0b", light: "#fffbeb" },
  { id: "contributions", label: "Contributions", color: "#ef4444", light: "#fef2f2" },
  { id: "workshops", label: "Workshops & Conf.", color: "#22c55e", light: "#f0fdf4" },
  { id: "memberships", label: "Memberships", color: "#ec4899", light: "#fdf4ff" },
  { id: "awards", label: "Awards", color: "#f97316", light: "#fff7ed" },
  { id: "fdp-sttp", label: "FDP / STTP", color: "#14b8a6", light: "#f0fdfa" },
  { id: "financial-support", label: "Financial Support", color: "#84cc16", light: "#f7fee7" },
  { id: "patents", label: "Patents", color: "#a855f7", light: "#faf5ff" },
  { id: "interaction", label: "Faculty Interaction", color: "#06b6d4", light: "#ecfeff" },
];

// SVG icons for each category
const ICONS: Record<string, React.ReactNode> = {
  "publications": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  "research-projects": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  "contributions": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "workshops": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  "memberships": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  "awards": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  "fdp-sttp": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  "financial-support": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  "patents": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  "interaction": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FacultyDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Raw data
  const [pubs, setPubs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contribs, setContribs] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);

  // Chart data per category
  const [chartData, setChartData] = useState<Record<string, CategoryStore>>({});

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      const [pubR, projR, contR, workshopR, memR, awardR] = await Promise.all([
        fetch("/api/faculty/publications", { cache: "no-store" }),
        fetch("/api/faculty/research-projects", { cache: "no-store" }),
        fetch("/api/faculty/contributions", { cache: "no-store" }),
        fetch("/api/faculty/workshops", { cache: "no-store" }),
        fetch("/api/faculty/memberships", { cache: "no-store" }),
        fetch("/api/faculty/awards", { cache: "no-store" }),
      ]);

      const set = async (res: Response, setter: (d: any[]) => void) => {
        if (res.ok) {
          const j = await res.json();
          if (j.success && Array.isArray(j.data)) setter(j.data);
        }
      };

      await Promise.all([
        set(pubR, setPubs),
        set(projR, setProjects),
        set(contR, setContribs),
        set(workshopR, setWorkshops),
        set(memR, setMembers),
        set(awardR, setAwards),
      ]);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      setLoading(true);
      fetchAll().finally(() => setLoading(false));
    }
  }, [authLoading]);

  // Refresh on tab visibility
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && !authLoading) fetchAll();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [authLoading]);

  // Process chart data
  useEffect(() => {
    const empty = (): CategoryStore => ({ currentSessionData: [], allSessionsData: [] });
    const placeholder = (): CategoryStore => ({
      currentSessionData: [{ name: "Item 1", value: 25 }, { name: "Item 2", value: 35 }, { name: "Item 3", value: 40 }],
      allSessionsData: [{ name: "Item 1", value: 100 }, { name: "Item 2", value: 120 }, { name: "Item 3", value: 150 }],
    });

    setChartData({
      "publications": pubs.length ? processPublicationData(pubs) : empty(),
      "research-projects": projects.length ? processResearchProjectData(projects) : empty(),
      "contributions": contribs.length ? processContributionData(contribs) : empty(),
      "workshops": workshops.length ? processWorkshopData(workshops) : empty(),
      "memberships": members.length ? processMembershipData(members) : empty(),
      "awards": awards.length ? processAwardData(awards) : empty(),
      "fdp-sttp": placeholder(),
      "financial-support": placeholder(),
      "patents": placeholder(),
      "interaction": placeholder(),
    });
  }, [pubs, projects, contribs, workshops, members, awards]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ─── Dynamic Data Processing ──────────────────────────────────────────────
  const yearlyStats = getYearlyActivityStats({ publications: pubs, projects, workshops, awards });
  const distribution = getOverallDistribution({ publications: pubs, projects, contributions: contribs, workshops, memberships: members, awards });
  const recentActivities = getRecentActivities({ publications: pubs, projects, awards, workshops }, 4);
  const totalContributions = pubs.length + projects.length + contribs.length + workshops.length + members.length + awards.length;

  const counts: Record<string, number> = {
    "publications": pubs.length,
    "research-projects": projects.length,
    "contributions": contribs.length,
    "workshops": workshops.length,
    "memberships": members.length,
    "awards": awards.length,
    "fdp-sttp": 0,
    "financial-support": 0,
    "patents": 0,
    "interaction": 0,
  };

  // ─── Chart data helpers ───────────────────────────────────────────────────

  const getCategoryChartData = (id: string) => {
    if (id === "publications") return { data: pubs, type: "publication" as const };
    if (id === "research-projects") return { data: projects, type: "research-project" as const };
    if (id === "contributions") return { data: contribs, type: "contribution" as const };
    if (id === "workshops") return { data: workshops, type: "workshop" as const };
    if (id === "memberships") return { data: members, type: "membership" as const };
    if (id === "awards") return { data: awards, type: "award" as const };
    return null;
  };

  // ─── Skeleton ─────────────────────────────────────────────────────────────

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-pulse w-full max-w-[1400px]">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="xl:col-span-1 h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const glassCardClasses = "bg-white/60 backdrop-blur-2xl dark:bg-gray-900/80 rounded-[28px] border border-white/60 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col";
  const glossyEdge = <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20 pointer-events-none z-10" />;

  // ─── Expanded Modal ───────────────────────────────────────────────────────
  const expandedCat = CATEGORIES.find(c => c.id === expandedId);

  const Modal = () => {
    if (!expandedCat) return null;
    const store = chartData[expandedCat.id];
    const coloredCurrent = (store?.currentSessionData || []).map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }));
    const coloredAll = (store?.allSessionsData || []).map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }));
    const chartEntry = getCategoryChartData(expandedCat.id);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => setExpandedId(null)}
      >
        <div
          className="bg-white/70 backdrop-blur-3xl dark:bg-gray-900/80 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/60 dark:border-white/10 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Glossy top edge highlight overlay */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20 pointer-events-none z-10" />
          {/* Modal Header */}
          <div
            className="px-6 py-5 flex items-center justify-between flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${expandedCat.color}22, ${expandedCat.color}11)`, borderBottom: `1px solid ${expandedCat.color}30` }}
          >
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: expandedCat.color }}
              >
                <span className="text-white">{ICONS[expandedCat.id]}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{expandedCat.label}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current session vs all sessions breakdown</p>
              </div>
            </div>
            <button
              onClick={() => setExpandedId(null)}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {chartEntry ? (
              <div className="mb-6">
                <CategorySessionChart
                  data={chartEntry.data}
                  type={chartEntry.type}
                  title={expandedCat.label}
                  showSessionComparison={true}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              {/* Current Session */}
              <div className="bg-white/40 dark:bg-gray-800/50 rounded-2xl p-5 border border-white/60 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Current Session</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: expandedCat.color + "20", color: expandedCat.color }}>
                    {getCurrentSession()}
                  </span>
                </div>
                {coloredCurrent.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={coloredCurrent} cx="50%" cy="50%" outerRadius={70} dataKey="value" labelLine={false}>
                        {coloredCurrent.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => [`${v}`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-600">No current session data</p>
                  </div>
                )}
              </div>

              {/* All Sessions */}
              <div className="bg-white/40 dark:bg-gray-800/50 rounded-2xl p-5 border border-white/60 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">All Sessions</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Cumulative</span>
                </div>
                {coloredAll.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={coloredAll} cx="50%" cy="50%" outerRadius={70} dataKey="value" labelLine={false}>
                        {coloredAll.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => [`${v}`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-600">No cumulative data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Dashboard Card ───────────────────────────────────────────────────────
  const DashboardCard = ({ cat }: { cat: typeof CATEGORIES[0] }) => {
    const count = counts[cat.id] ?? 0;
    const chartEntry = getCategoryChartData(cat.id);

    return (
      <div className="group bg-white/60 backdrop-blur-2xl dark:bg-gray-900/80 rounded-[28px] border border-white/60 dark:border-white/10 hover:border-white/80 dark:hover:border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col relative overflow-hidden">
        {/* Glossy top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: cat.color + "18", color: cat.color }}
            >
              {ICONS[cat.id]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate leading-none">{cat.label}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5 leading-none">
                <span className="font-bold" style={{ color: cat.color }}>{count}</span> entries
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpandedId(cat.id)}
            className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            title="Expand"
          >
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* Card Body — Chart or empty */}
        <div className="flex-1 p-3 relative z-10">
          {chartEntry ? (
            <CategorySessionChart
              data={chartEntry.data}
              type={chartEntry.type}
              title={cat.label}
              showSessionComparison={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: cat.color + "12", color: cat.color }}
              >
                {ICONS[cat.id]}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">No data yet</p>
            </div>
          )}
        </div>
      </div>
    );
  };



  const firstName = user?.name?.split(" ")[0] || "Faculty";

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="space-y-6 w-full max-w-[1500px]">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Welcome back, <span className="font-semibold text-indigo-500">{firstName}</span>. Here's your impact.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl shadow-md transition-all duration-200 flex-shrink-0"
          >
            <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Refreshing…" : "Refresh Data"}
          </button>
        </div>

        {/* Dynamic Grid Layout (Grapho Style) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ─── LEFT COLUMN (Span 2) ─── */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Top Row: Mass Stats & Bar Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Massive Stat Block */}
              <div className={`${glassCardClasses} p-6 justify-center`}>
                {glossyEdge}
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Total Impact</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500 leading-none py-1">
                    {totalContributions}
                  </h2>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  All active sessions
                </div>
              </div>

              {/* Bar Chart Block */}
              <div className={`${glassCardClasses} p-6 md:col-span-2`}>
                {glossyEdge}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity History</p>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-black/5 dark:bg-white/5 py-1 px-3 rounded-full">Last 5 Years</p>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyStats} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', fontWeight: 'bold' }}
                        itemStyle={{ fontWeight: 600 }}
                      />
                      <Bar dataKey="Publications" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={16} />
                      <Bar dataKey="Projects" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Workshops" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Awards" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Bottom Grid: Remaining 9 Category Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORIES.slice(1).map(cat => <DashboardCard key={`chart-${cat.id}`} cat={cat} />)}
            </div>          </div>

          {/* ─── RIGHT COLUMN (Span 1) ─── */}
          <div className="xl:col-span-1 flex flex-col gap-6">

            {/* Top Right: Core Category Card (Publications Hero) */}
            {(() => {
              const pubChartEntry = getCategoryChartData("publications");
              return (
                <div className={`${glassCardClasses} p-6 flex flex-col relative group overflow-hidden`}>
                  {glossyEdge}
                  <div className="flex justify-between items-center mb-0">
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Publications Overview</p>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {ICONS["publications"]}
                    </div>
                  </div>

                  <div className="flex-1 w-full flex flex-col justify-end mt-2 min-h-[290px]">
                    {pubChartEntry ? (
                      <CategorySessionChart
                        data={pubChartEntry.data}
                        type={pubChartEntry.type}
                        title="Publications"
                        showSessionComparison={false}
                        isHero={true}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">Loading chart data...</div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Recent Activities List */}
            <div className={`${glassCardClasses} p-6 flex-1`}>
              {glossyEdge}
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Activity</p>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 cursor-pointer hover:text-indigo-500 transition-colors">View All</span>
              </div>

              <div className="flex flex-col gap-4">
                {recentActivities.map(act => {
                  // Ensure a default fallback icon if mapping fails
                  const IconNode = ICONS[act.type.toLowerCase()] || ICONS["publications"];
                  return (
                    <div key={act.id} className="flex items-center gap-3 group/item">
                      <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform group-hover/item:scale-110 group-hover/item:shadow-md" style={{ backgroundColor: `${act.color}15`, color: act.color }}>
                        <div className="scale-75">
                          {IconNode}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 border-b border-gray-100 dark:border-white/5 pb-3 group-hover/item:border-transparent transition-colors">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate pr-2 group-hover/item:text-indigo-500 transition-colors">{act.title}</p>
                          <p className="text-[10px] font-bold text-gray-400 flex-shrink-0">{act.formattedDate}</p>
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 truncate">{act.type}</p>
                      </div>
                    </div>
                  );
                })}
                {recentActivities.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs font-semibold text-gray-400">No recent activity detected.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {expandedId && <Modal />}
    </MainLayout>
  );
}