"use client";

import { useEffect, useState } from "react";
import {
  DocumentTextIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  TrophyIcon,
  SparklesIcon,
  BanknotesIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  XMarkIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
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
import MainLayout from "@/app/components/layout/MainLayout";
import { useAuth } from "@/app/providers/auth-provider";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import StatsCard from "@/app/components/StatsCard";


// Type definitions
interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface CategoryData {
  currentYearData: ChartDataPoint[];
  allYearsData: ChartDataPoint[];
}

  const FACULTY_CATEGORIES = [
  {
    id: "publications",
    title: "Publications",
    icon: BookOpen,
    headerBg: "bg-blue-600",
    borderColor: "border-blue-600",
    bgColor: "blue",
    iconColor: "text-blue-600",
    hexColor: "#2563eb",
  },
  {
    id: "research-projects",
    title: "Research Projects",
    icon: Target,
    headerBg: "bg-yellow-600",
    borderColor: "border-yellow-600",
    bgColor: "yellow",
    iconColor: "text-yellow-600",
    hexColor: "#ca8a04",
  },
  {
    id: "contributions",
    title: "Contributions",
    icon: FileText,
    headerBg: "bg-red-600",
    borderColor: "border-red-600",
    bgColor: "red",
    iconColor: "text-red-600",
    hexColor: "#dc2626",
  },
  {
    id: "workshops",
    title: "Workshops & Conferences",
    icon: Users,
    headerBg: "bg-green-600",
    borderColor: "border-green-600",
    bgColor: "green",
    iconColor: "text-green-600",
    hexColor: "#16a34a",
  },
  {
    id: "memberships",
    title: "Professional Memberships",
    icon: Globe,
    headerBg: "bg-pink-600",
    borderColor: "border-pink-600",
    bgColor: "pink",
    iconColor: "text-pink-600",
    hexColor: "#db2777",
  },
  {
    id: "awards",
    title: "Awards & Recognitions",
    icon: Award,
    headerBg: "bg-orange-600",
    borderColor: "border-orange-600",
    bgColor: "orange",
    iconColor: "text-orange-600",
    hexColor: "#ea580c",
  },
  {
    id: "fdp-sttp",
    title: "FDP / STTP",
    icon: GraduationCap,
    headerBg: "bg-teal-600",
    borderColor: "border-teal-600",
    bgColor: "teal",
    iconColor: "text-teal-600",
    hexColor: "#0d9488",
  },
  {
    id: "financial-support",
    title: "Financial Support",
    icon: TrendingUp,
    headerBg: "bg-lime-600",
    borderColor: "border-lime-600",
    bgColor: "lime",
    iconColor: "text-lime-600",
    hexColor: "#65a30d",
  },
  {
    id: "patents",
    title: "Patent / Copyright",
    icon: Cpu,
    headerBg: "bg-purple-600",
    borderColor: "border-purple-600",
    bgColor: "purple",
    iconColor: "text-purple-600",
    hexColor: "#7c3aed",
  },
  {
    id: "interaction",
    title: "Faculty Interaction",
    icon: MessageCircle,
    headerBg: "bg-cyan-600",
    borderColor: "border-cyan-600",
    bgColor: "cyan",
    iconColor: "text-cyan-600",
    hexColor: "#0891b2",
  },
];

// Pie chart colors
const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
];

export default function FacultyDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [categoryData, setCategoryData] = useState<{
    [key: string]: CategoryData;
  }>({});

  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Generate placeholder chart data
  const generatePlaceholderData = (): { [key: string]: CategoryData } => {
    const data: { [key: string]: CategoryData } = {};

    FACULTY_CATEGORIES.forEach((category) => {
      data[category.id] = {
        currentYearData: [
          { name: "Item 1", value: 25 },
          { name: "Item 2", value: 35 },
          { name: "Item 3", value: 40 },
        ],
        allYearsData: [
          { name: "Item 1", value: 100 },
          { name: "Item 2", value: 120 },
          { name: "Item 3", value: 150 },
        ],
      };
    });

    return data;
  };

  // Fetch faculty dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to fetch faculty-specific data
        // const response = await fetch(`/api/faculty/dashboard?facultyId=${user?.id}`);
        // const data = await response.json();

        // Placeholder: Initialize with mock data structure
        setCategoryData(generatePlaceholderData());
      } catch (error) {
        console.error("Error loading faculty dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  // Loading skeleton state
  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg shadow"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Custom pie chart component for cards
  const PieChartWrapper = ({
    data,
    title,
  }: {
    data: ChartDataPoint[];
    title: string;
  }) => {
    const chartDataWithColors = data.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
        <h4 className="text-[10px] font-semibold text-gray-700 mb-1">{title}</h4>
        <ResponsiveContainer width="100%" height={80}>
          <PieChart>
            <Pie
              data={chartDataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={12}
              outerRadius={35}
              paddingAngle={1}
              dataKey="value"
            >
              {chartDataWithColors.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Dashboard Card Component
  const DashboardCard = ({
    category,
    onExpand,
  }: {
    category: (typeof FACULTY_CATEGORIES)[0];
    onExpand: () => void;
  }) => {
    const data = categoryData[category.id];

    if (!data) return null;

    return (
      <div
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 ${category.borderColor} group cursor-pointer transform hover:scale-105`}
      >
        {/* Header with icon and title - matching FacultyModules style */}
        <div className={`px-4 py-3 text-gray-900 flex items-center gap-2`}>
          {category.icon && <category.icon className="h-5 w-5" />}
          <h3 className="font-semibold text-sm line-clamp-1">
            {category.title}
          </h3>
          <button
            onClick={onExpand}
            className="ml-auto p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0 inline-flex items-center justify-center"
            title="Expand"
          >
            <svg
              className="h-3 w-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M4 8V4m0 0h4m-4 0l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>

        {/* Content - Two pie charts side by side */}
        <div className="p-1 flex gap-0.5 bg-white">
          <PieChartWrapper
            data={data.currentYearData}
            title="Current Session"
          />
          <PieChartWrapper data={data.allYearsData} title="All Sessions" />
        </div>
      </div>
    );
  };

  // Expanded modal view
  const ExpandedCardModal = ({
    category,
    onClose,
  }: {
    category: (typeof FACULTY_CATEGORIES)[0];
    onClose: () => void;
  }) => {
    const data = categoryData[category.id];

    if (!data) return null;

    // Create larger data for expanded view
    const expandedCurrentYear = data.currentYearData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const expandedAllYears = data.allYearsData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Matching FacultyModules styling */}
          <div
            className={`${category.headerBg} p-6 text-gray-900 flex justify-between items-center flex-shrink-0`}
          >
            <div className="flex items-center gap-3">
              <category.icon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-semibold">{category.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content - Scrollable area */}
          <div className="overflow-y-auto flex-1 p-8 space-y-8">
            <div className="grid grid-cols-2 gap-12">
              {/* Current Session Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Current Session Data
                </h3>
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={expandedCurrentYear}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expandedCurrentYear.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* All Sessions Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  All Sessions Data (Cumulative)
                </h3>
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={expandedAllYears}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expandedAllYears.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const expandedCategory = FACULTY_CATEGORIES.find(
    (c) => c.id === expandedCard
  );

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Page Header - Matching faculty page styling */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Faculty Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage your academic profile, publications, and contributions
          </p>
        </div>

          {/* First 5 Quick Stats Cards */}
        <div className="grid grid-cols-5 gap-3">
          <StatsCard
            title="Publications"
            value="0"
            icon={<BookOpen className="h-5 w-5 text-blue-600" />}
            bgColor="bg-blue-50"
            textColor="text-blue-900"
          />
          <StatsCard
            title="Research Projects"
            value="0"
            icon={<Target className="h-5 w-5 text-yellow-600" />}
            bgColor="bg-yellow-50"
            textColor="text-yellow-900"
          />
          <StatsCard
            title="Contributions"
            value="0"
            icon={<FileText className="h-5 w-5 text-red-600" />}
            bgColor="bg-red-50"
            textColor="text-red-900"
          />
          <StatsCard
            title="Workshops & Conferences"
            value="0"
            icon={<Users className="h-5 w-5 text-green-600" />}
            bgColor="bg-green-50"
            textColor="text-green-900"
          />
          <StatsCard
            title="Professional Memberships"
            value="0"
            icon={<Globe className="h-5 w-5 text-pink-600" />}
            bgColor="bg-pink-50"
            textColor="text-pink-900"
          />
        </div>

        {/* First 5 Dashboard Cards */}
        <div className="grid grid-cols-5 gap-3 auto-rows-max">
          {FACULTY_CATEGORIES.slice(0, 5).map((category) => (
            <DashboardCard
              key={category.id}
              category={category}
              onExpand={() => setExpandedCard(category.id)}
            />
          ))}
        </div>

        {/* Second 5 Quick Stats Cards */}
        <div className="grid grid-cols-5 gap-3">
          <StatsCard
            title="Awards & Recognitions"
            value="0"
            icon={<Award className="h-5 w-5 text-orange-600" />}
            bgColor="bg-orange-50"
            textColor="text-orange-900"
          />
          <StatsCard
            title="FDP / STTP"
            value="0"
            icon={<GraduationCap className="h-5 w-5 text-teal-600" />}
            bgColor="bg-teal-50"
            textColor="text-teal-900"
          />
          <StatsCard
            title="Financial Support"
            value="0"
            icon={<TrendingUp className="h-5 w-5 text-lime-600" />}
            bgColor="bg-lime-50"
            textColor="text-lime-900"
          />
          <StatsCard
            title="Patent / Copyright"
            value="0"
            icon={<Cpu className="h-5 w-5 text-purple-600" />}
            bgColor="bg-purple-50"
            textColor="text-purple-900"
          />
          <StatsCard
            title="Faculty Interaction"
            value="0"
            icon={<MessageCircle className="h-5 w-5 text-cyan-600" />}
            bgColor="bg-cyan-50"
            textColor="text-cyan-900"
          />
        </div>

        {/* Second 5 Dashboard Cards */}
        <div className="grid grid-cols-5 gap-3 auto-rows-max">
          {FACULTY_CATEGORIES.slice(5, 10).map((category) => (
            <DashboardCard
              key={category.id}
              category={category}
              onExpand={() => setExpandedCard(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Expanded Modal */}
      {expandedCard && expandedCategory && (
        <ExpandedCardModal
          category={expandedCategory}
          onClose={() => {
            setExpandedCard(null);
          }}
        />
      )}
    </MainLayout>
  );
}