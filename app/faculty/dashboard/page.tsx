"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
import { useFacultyData } from "@/app/providers/faculty-data-provider";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import StatsCard from "@/app/components/StatsCard";
import { processPublicationData, processResearchProjectData, processContributionData, processWorkshopData, processMembershipData, processAwardData, getCurrentSession, CHART_COLORS, type ChartDataPoint, type CategoryData } from './dashboard-utils';
import CategorySessionChart from "@/app/components/faculty/CategorySessionChart";

  const FACULTY_CATEGORIES = [
  {
    id: "publications",
    title: "Publications",
    icon: BookOpen,
    headerBg: "bg-blue-600",
    modalHeaderBg: "bg-blue-400",
    borderColor: "border-blue-600",
    bgColor: "blue",
    iconColor: "text-blue-600",
    hexColor: "#93c5fd", 
  },
  {
    id: "research-projects",
    title: "Research Projects",
    icon: Target,
    headerBg: "bg-yellow-600",
    modalHeaderBg: "bg-yellow-400",
    borderColor: "border-yellow-600",
    bgColor: "yellow",
    iconColor: "text-yellow-600",
    hexColor: "#fcd34d", 
  },
  {
    id: "contributions",
    title: "Contributions",
    icon: FileText,
    headerBg: "bg-red-600",
    modalHeaderBg: "bg-red-400",
    borderColor: "border-red-600",
    bgColor: "red",
    iconColor: "text-red-600",
    hexColor: "#fca5a5",
  },
  {
    id: "workshops",
    title: "Workshops & Conferences",
    icon: Users,
    headerBg: "bg-green-600",
    modalHeaderBg: "bg-green-400",
    borderColor: "border-green-600",
    bgColor: "green",
    iconColor: "text-green-600",
    hexColor: "#86efac", 
  },
  {
    id: "memberships",
    title: "Professional Memberships",
    icon: Globe,
    headerBg: "bg-pink-600",
    modalHeaderBg: "bg-pink-400",
    borderColor: "border-pink-600",
    bgColor: "pink",
    iconColor: "text-pink-600",
    hexColor: "#f8a4d4", 
  },
  {
    id: "awards",
    title: "Awards & Recognitions",
    icon: Award,
    headerBg: "bg-orange-600",
    modalHeaderBg: "bg-orange-400",
    borderColor: "border-orange-600",
    bgColor: "orange",
    iconColor: "text-orange-600",
    hexColor: "#fed7aa", 
  },
  {
    id: "fdp-sttp",
    title: "FDP / STTP",
    icon: GraduationCap,
    headerBg: "bg-teal-600",
    modalHeaderBg: "bg-teal-400",
    borderColor: "border-teal-600",
    bgColor: "teal",
    iconColor: "text-teal-600",
    hexColor: "#67e8f9", 
  },
  {
    id: "financial-support",
    title: "Financial Support",
    icon: TrendingUp,
    headerBg: "bg-lime-600",
    modalHeaderBg: "bg-lime-400",
    borderColor: "border-lime-600",
    bgColor: "lime",
    iconColor: "text-lime-600",
    hexColor: "#bef264", 
  },
  {
    id: "patents",
    title: "Patent / Copyright",
    icon: Cpu,
    headerBg: "bg-purple-600",
    modalHeaderBg: "bg-purple-400",
    borderColor: "border-purple-600",
    bgColor: "purple",
    iconColor: "text-purple-600",
    hexColor: "#d8b4fe", 
  },
  {
    id: "interaction",
    title: "Faculty Interaction",
    icon: MessageCircle,
    headerBg: "bg-cyan-600",
    modalHeaderBg: "bg-cyan-400",
    borderColor: "border-cyan-600",
    bgColor: "cyan",
    iconColor: "text-cyan-600",
    hexColor: "#67e8f9", 
  },
];

export default function FacultyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { publications, researchProjects, loading: dataLoading } = useFacultyData();

  const [fetchedPublications, setFetchedPublications] = useState<any[]>([]);
  const [fetchedResearchProjects, setFetchedResearchProjects] = useState<any[]>([]);
  const [fetchedContributions, setFetchedContributions] = useState<any[]>([]);
  const [fetchedWorkshops, setFetchedWorkshops] = useState<any[]>([]);
  const [fetchedMemberships, setFetchedMemberships] = useState<any[]>([]);
  const [fetchedAwards, setFetchedAwards] = useState<any[]>([]);

  const [categoryData, setCategoryData] = useState<{
    [key: string]: CategoryData;
  }>({});

  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [publicationCount, setPublicationCount] = useState(0);
  const [researchProjectCount, setResearchProjectCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh all data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log("Dashboard - Refreshing data...");

      const pubResponse = await fetch("/api/faculty/publications", {
        cache: "no-store",
      });
      if (pubResponse.ok) {
        const pubData = await pubResponse.json();
        if (pubData.success && Array.isArray(pubData.data)) {
          console.log("Dashboard - Refreshed publications:", pubData.data.length);
          setFetchedPublications(pubData.data);
          setPublicationCount(pubData.data.length);
        }
      }

      const projResponse = await fetch("/api/faculty/research-projects", {
        cache: "no-store",
      });
      if (projResponse.ok) {
        const projData = await projResponse.json();
        if (projData.success && Array.isArray(projData.data)) {
          console.log("Dashboard - Refreshed research projects:", projData.data.length);
          setFetchedResearchProjects(projData.data);
          setResearchProjectCount(projData.data.length);
        }
      }

      const contribResponse = await fetch("/api/faculty/contributions", {
        cache: "no-store",
      });
      if (contribResponse.ok) {
        const contribData = await contribResponse.json();
        if (contribData.success && Array.isArray(contribData.data)) {
          console.log("Dashboard - Refreshed contributions:", contribData.data.length);
          setFetchedContributions(contribData.data);
        }
      }

      const workshopResponse = await fetch("/api/faculty/workshops", {
        cache: "no-store",
      });
      if (workshopResponse.ok) {
        const workshopData = await workshopResponse.json();
        if (workshopData.success && Array.isArray(workshopData.data)) {
          console.log("Dashboard - Refreshed workshops:", workshopData.data.length);
          setFetchedWorkshops(workshopData.data);
        }
      }

      const membershipResponse = await fetch("/api/faculty/memberships", {
        cache: "no-store",
      });
      if (membershipResponse.ok) {
        const membershipData = await membershipResponse.json();
        if (membershipData.success && Array.isArray(membershipData.data)) {
          console.log("Dashboard - Refreshed memberships:", membershipData.data.length);
          setFetchedMemberships(membershipData.data);
        }
      }

      const awardResponse = await fetch("/api/faculty/awards", {
        cache: "no-store",
      });
      if (awardResponse.ok) {
        const awardData = await awardResponse.json();
        if (awardData.success && Array.isArray(awardData.data)) {
          console.log("Dashboard - Refreshed awards:", awardData.data.length);
          setFetchedAwards(awardData.data);
        }
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate placeholder chart data
  const generatePlaceholderData = (): { [key: string]: CategoryData } => {
    const data: { [key: string]: CategoryData } = {};

    FACULTY_CATEGORIES.forEach((category) => {
      data[category.id] = {
        currentSessionData: [
          { name: "Item 1", value: 25 },
          { name: "Item 2", value: 35 },
          { name: "Item 3", value: 40 },
        ],
        allSessionsData: [
          { name: "Item 1", value: 100 },
          { name: "Item 2", value: 120 },
          { name: "Item 3", value: 150 },
        ],
      };
    });

    return data;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Dashboard - Starting direct data fetch");

        const pubResponse = await fetch("/api/faculty/publications");
        if (pubResponse.ok) {
          const pubData = await pubResponse.json();
          if (pubData.success && Array.isArray(pubData.data)) {
            console.log("Dashboard - Fetched publications:", pubData.data.length);
            setFetchedPublications(pubData.data);
            setPublicationCount(pubData.data.length);
          }
        }

        const projResponse = await fetch("/api/faculty/research-projects");
        if (projResponse.ok) {
          const projData = await projResponse.json();
          if (projData.success && Array.isArray(projData.data)) {
            console.log("Dashboard - Fetched research projects:", projData.data.length);
            setFetchedResearchProjects(projData.data);
            setResearchProjectCount(projData.data.length);
          }
        }

        const contribResponse = await fetch("/api/faculty/contributions");
        if (contribResponse.ok) {
          const contribData = await contribResponse.json();
          if (contribData.success && Array.isArray(contribData.data)) {
            console.log("Dashboard - Fetched contributions:", contribData.data.length);
            setFetchedContributions(contribData.data);
          }
        }

        const workshopResponse = await fetch("/api/faculty/workshops");
        if (workshopResponse.ok) {
          const workshopData = await workshopResponse.json();
          if (workshopData.success && Array.isArray(workshopData.data)) {
            console.log("Dashboard - Fetched workshops:", workshopData.data.length);
            setFetchedWorkshops(workshopData.data);
          }
        }

        const membershipResponse = await fetch("/api/faculty/memberships");
        if (membershipResponse.ok) {
          const membershipData = await membershipResponse.json();
          if (membershipData.success && Array.isArray(membershipData.data)) {
            console.log("Dashboard - Fetched memberships:", membershipData.data.length);
            setFetchedMemberships(membershipData.data);
          }
        }

        const awardResponse = await fetch("/api/faculty/awards");
        if (awardResponse.ok) {
          const awardData = await awardResponse.json();
          if (awardData.success && Array.isArray(awardData.data)) {
            console.log("Dashboard - Fetched awards:", awardData.data.length);
            setFetchedAwards(awardData.data);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (!authLoading) {
      fetchData();
    }

    // Listen for visibility changes to refresh data when user returns to the dashboard
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !authLoading) {
        console.log("Dashboard became visible, refreshing data...");
        fetchData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authLoading]);

  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);

        console.log("Dashboard - Processing directly fetched data:", {
          publications: fetchedPublications.length,
          researchProjects: fetchedResearchProjects.length,
          contributions: fetchedContributions.length,
          workshops: fetchedWorkshops.length,
          memberships: fetchedMemberships.length,
          awards: fetchedAwards.length,
        });

        const newCategoryData: { [key: string]: CategoryData } = {};

        if (fetchedPublications && fetchedPublications.length > 0) {
          console.log("Processing publication data for charts");
          const processedData = processPublicationData(fetchedPublications);
          console.log("Processed publication data:", processedData);
          newCategoryData["publications"] = processedData;
        } else {
          console.log("No publications to process, using empty data");
          newCategoryData["publications"] = {
            currentSessionData: [],
            allSessionsData: [],
          };
        }

        if (fetchedResearchProjects && fetchedResearchProjects.length > 0) {
          console.log("Processing research project data for charts");
          const processedData = processResearchProjectData(fetchedResearchProjects);
          console.log("Processed research project data:", processedData);
          newCategoryData["research-projects"] = processedData;
        } else {
          console.log("No research projects to process, using empty data");
          newCategoryData["research-projects"] = {
            currentSessionData: [],
            allSessionsData: [],
          };
        }

        if (fetchedContributions && fetchedContributions.length > 0) {
          console.log("Processing contribution data for charts");
          const processedData = processContributionData(fetchedContributions);
          console.log("Processed contribution data:", processedData);
          newCategoryData["contributions"] = processedData;
        } else {
          console.log("No contributions to process, using empty data");
          newCategoryData["contributions"] = {
            currentSessionData: [],
            allSessionsData: [],
          };
        }

        if (fetchedWorkshops && fetchedWorkshops.length > 0) {
          console.log("Processing workshop data for charts");
          const processedData = processWorkshopData(fetchedWorkshops);
          console.log("Processed workshop data:", processedData);
          newCategoryData["workshops"] = processedData;
        } else {
          console.log("No workshops to process, using empty data");
          newCategoryData["workshops"] = {
            currentSessionData: [],
            allSessionsData: [],
          };
        }

        if (fetchedMemberships && fetchedMemberships.length > 0) {
          console.log("Processing membership data for charts");
          const processedData = processMembershipData(fetchedMemberships);
          console.log("Processed membership data:", processedData);
          newCategoryData["memberships"] = processedData;
        } else {
          console.log("No memberships to process, using empty data");
          newCategoryData["memberships"] = {
            currentSessionData: [],
            allSessionsData: [],
          };
        }

        if (fetchedAwards && fetchedAwards.length > 0) {
          console.log("Processing award data for charts");
          const processedData = processAwardData(fetchedAwards);
          console.log("Processed award data:", processedData);
          newCategoryData["awards"] = processedData;
        } else {
          console.log("No awards to process, using empty data");
          newCategoryData["awards"] = {
            currentSessionData: [],
            allSessionsData: [],
          };
        }

        // Generate placeholder data only for categories that don't have real implementations yet
        const placeholderData = generatePlaceholderData();
        FACULTY_CATEGORIES.forEach((category) => {
          if (
            !["publications", "research-projects", "contributions", "workshops", "memberships", "awards"].includes(category.id) &&
            !newCategoryData[category.id]
          ) {
            newCategoryData[category.id] = placeholderData[category.id];
          }
        });

        console.log("Setting category data:", newCategoryData);
        setCategoryData(newCategoryData);
      } catch (error) {
        console.error("Error processing dashboard data:", error);
        setCategoryData(generatePlaceholderData());
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [fetchedPublications, fetchedResearchProjects, fetchedContributions, fetchedWorkshops, fetchedMemberships, fetchedAwards]);

  if ((loading || authLoading) && !expandedCard) {
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

  const PieChartWrapper = ({
    data,
    title,
  }: {
    data: ChartDataPoint[];
    title: string;
  }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <h4 className="text-[10px] font-semibold mb-1">{title}</h4>
          <p className="text-[8px]">No data</p>
        </div>
      );
    }

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
              outerRadius={35}
              paddingAngle={1}
              dataKey="value"
              labelLine={false}
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

  const DashboardCard = ({
    category,
    onExpand,
  }: {
    category: (typeof FACULTY_CATEGORIES)[0];
    onExpand: () => void;
  }) => {
    if (category.id === "publications") {
      return (
        <div
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 group cursor-pointer transform hover:scale-105"
          style={{ borderTopColor: category.hexColor }}
        >
          {/* Header with icon and title */}
          <div className={`px-4 py-3 text-gray-900 flex items-center gap-2`}>
            {category.icon && <category.icon className={`h-5 w-5 ${category.iconColor}`} />}
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

          {/* Content - CategorySessionChart with showSessionComparison */}
          <div className="p-2 bg-white">
            <CategorySessionChart
              data={fetchedPublications}
              type="publication"
              title={category.title}
              showSessionComparison={true}
            />
          </div>
        </div>
      );
    }

    if (category.id === "research-projects") {
      return (
        <div
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 group cursor-pointer transform hover:scale-105"
          style={{ borderTopColor: category.hexColor }}
        >
          {/* Header with icon and title */}
          <div className={`px-4 py-3 text-gray-900 flex items-center gap-2`}>
            {category.icon && <category.icon className={`h-5 w-5 ${category.iconColor}`} />}
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

          {/* Content - CategorySessionChart with showSessionComparison */}
          <div className="p-2 bg-white">
            <CategorySessionChart
              data={fetchedResearchProjects}
              type="research-project"
              title={category.title}
              showSessionComparison={true}
            />
          </div>
        </div>
      );
    }

    if (category.id === "contributions") {
      return (
        <div
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 group cursor-pointer transform hover:scale-105"
          style={{ borderTopColor: category.hexColor }}
        >
          {/* Header with icon and title */}
          <div className={`px-4 py-3 text-gray-900 flex items-center gap-2`}>
            {category.icon && <category.icon className={`h-5 w-5 ${category.iconColor}`} />}
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

          {/* Content - CategorySessionChart with showSessionComparison */}
          <div className="p-2 bg-white">
            <CategorySessionChart
              data={fetchedContributions}
              type="contribution"
              title={category.title}
              showSessionComparison={true}
            />
          </div>
        </div>
      );
    }

    if (category.id === "workshops") {
      return (
        <div
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 group cursor-pointer transform hover:scale-105"
          style={{ borderTopColor: category.hexColor }}
        >
          {/* Header with icon and title */}
          <div className={`px-4 py-3 text-gray-900 flex items-center gap-2`}>
            {category.icon && <category.icon className={`h-5 w-5 ${category.iconColor}`} />}
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

          {/* Content - CategorySessionChart with showSessionComparison */}
          <div className="p-2 bg-white">
            <CategorySessionChart
              data={fetchedWorkshops}
              type="workshop"
              title={category.title}
              showSessionComparison={true}
            />
          </div>
        </div>
      );
    }

    if (category.id === "memberships") {
      return (
        <div
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 group cursor-pointer transform hover:scale-105"
          style={{ borderTopColor: category.hexColor }}
        >
          {/* Header with icon and title */}
          <div className={`px-4 py-3 text-gray-900 flex items-center gap-2`}>
            {category.icon && <category.icon className={`h-5 w-5 ${category.iconColor}`} />}
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

          {/* Content - CategorySessionChart with showSessionComparison */}
          <div className="p-2 bg-white">
            <CategorySessionChart
              data={fetchedMemberships}
              type="membership"
              title={category.title}
              showSessionComparison={true}
            />
          </div>
        </div>
      );
    }

    if (category.id === "awards") {
      return (
        <div
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 group cursor-pointer transform hover:scale-105"
          style={{ borderTopColor: category.hexColor }}
        >
          {/* Header with icon and title */}
          <div className={`px-4 py-3 text-gray-900 flex items-center gap-2`}>
            {category.icon && <category.icon className={`h-5 w-5 ${category.iconColor}`} />}
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

          {/* Content - CategorySessionChart with showSessionComparison */}
          <div className="p-2 bg-white">
            <CategorySessionChart
              data={fetchedAwards}
              type="award"
              title={category.title}
              showSessionComparison={true}
            />
          </div>
        </div>
      );
    }
  };

  const ExpandedCardModal = ({
    category,
    onClose,
  }: {
    category: (typeof FACULTY_CATEGORIES)[0];
    onClose: () => void;
  }) => {
    const data = categoryData[category.id];

    // If no data, show "No data" message
    if (!data || !data.currentSessionData || !data.allSessionsData || 
        (data.currentSessionData.length === 0 && data.allSessionsData.length === 0)) {
      return (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`${category.modalHeaderBg} p-6 text-white flex justify-between items-center flex-shrink-0`}
            >
              <div className="flex items-center gap-3">
                <category.icon className={`h-8 w-8 ${category.iconColor}`} />
                <div>
                  <h2 className="text-2xl font-semibold text-white">{category.title}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* No Data Message */}
            <div className="overflow-y-auto flex-1 p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Data Present</h3>
                <p className="text-gray-600">
                  There is no data available for {category.title} yet. Please add entries to see them displayed here.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const expandedCurrentSession = data.currentSessionData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const expandedAllSessions = data.allSessionsData.map((item, index) => ({
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
            className={`${category.modalHeaderBg} p-6 text-white flex justify-between items-center flex-shrink-0`}
          >
            <div className="flex items-center gap-3">
              <category.icon className={`h-8 w-8 ${category.iconColor}`} />
              <div>
                <h2 className="text-2xl font-semibold text-white">{category.title}</h2>
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Current Session Data ({getCurrentSession()})
                  </h3>
                  {(category.id === "publications" || category.id === "research-projects") && (
                    <p className="text-sm font-bold text-indigo-600">
                      {data?.currentSessionData?.reduce((sum, item) => sum + item.value, 0) || 0} {(data?.currentSessionData?.reduce((sum, item) => sum + item.value, 0) || 0) === 1 ? 'item' : 'items'}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 mt-4">
                  {expandedCurrentSession && expandedCurrentSession.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={expandedCurrentSession}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expandedCurrentSession.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-center">
                      <p className="text-gray-400 font-medium">No current data</p>
                    </div>
                  )}
                </div>
              </div>

              {/* All Sessions Chart */}
              <div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    All Sessions Data (Cumulative)
                  </h3>
                  {(category.id === "publications" || category.id === "research-projects") && (
                    <p className="text-sm font-bold text-indigo-600">
                      {data?.allSessionsData?.reduce((sum, item) => sum + item.value, 0) || 0} {(data?.allSessionsData?.reduce((sum, item) => sum + item.value, 0) || 0) === 1 ? 'item' : 'items'}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 mt-4">
                  {expandedAllSessions && expandedAllSessions.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={expandedAllSessions}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expandedAllSessions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-center">
                      <p className="text-gray-400 font-medium">No data available</p>
                    </div>
                  )}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
                Faculty Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your academic profile, publications, and contributions
              </p>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Refresh dashboard data"
          >
            <svg
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0114.85-3.36M20.49 15a9 9 0 01-14.85 3.36"></path>
            </svg>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

          {/* First 5 Quick Stats Cards */}
        <div className="grid grid-cols-5 gap-3">
          <StatsCard
            title="Publications"
            value={publicationCount}
            icon={<BookOpen className="h-5 w-5 text-blue-600" />}
            bgColor="bg-blue-50"
            textColor="text-blue-900"
          />
          <StatsCard
            title="Research Projects"
            value={researchProjectCount}
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