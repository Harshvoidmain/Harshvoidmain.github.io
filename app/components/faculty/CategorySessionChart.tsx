"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  processPublicationData,
  processResearchProjectData,
  processContributionData,
  processWorkshopData,
  processMembershipData,
  processAwardData,
  getCurrentSession,
  CHART_COLORS,
  type ChartDataPoint,
  type CategoryData,
} from "@/app/faculty/dashboard/dashboard-utils";

type CategorySessionChartProps = {
  data: any[];
  type: "publication" | "research-project" | "contribution" | "workshop" | "membership" | "award";
  title: string;
  subtitle?: string;
  height?: number;
  showSessionComparison?: boolean;
  isDetailPage?: boolean;
  isDashboardExpanded?: boolean;
};

export default function CategorySessionChart({
  data,
  type,
  title,
  subtitle,
  height = 300,
  showSessionComparison = true,
  isDetailPage = false,
  isDashboardExpanded = false,
}: CategorySessionChartProps) {
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processData = () => {
      setLoading(true);

      let processed: CategoryData | null = null;

      if (type === "publication") {
        processed = processPublicationData(data);
      } else if (type === "research-project") {
        processed = processResearchProjectData(data);
      } else if (type === "contribution") {
        processed = processContributionData(data);
      } else if (type === "workshop") {
        processed = processWorkshopData(data);
      } else if (type === "membership") {
        processed = processMembershipData(data);
      } else if (type === "award") {
        processed = processAwardData(data);
      }

      setCategoryData(processed);
      setLoading(false);
    };

    processData();
  }, [data, type]);

  const PieChartWrapper = ({
    chartData,
    chartTitle,
    isLarge = false,
    isDashboard = false,
  }: {
    chartData: ChartDataPoint[];
    chartTitle: string;
    isLarge?: boolean;
    isDashboard?: boolean;
  }) => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <h4 className={`${isLarge ? "text-sm" : "text-[10px]"} font-semibold mb-1`}>{chartTitle}</h4>
          <p className={`${isLarge ? "text-xs" : "text-[8px]"}`}>No data</p>
        </div>
      );
    }

    // Use unified pastel colors
    const chartDataWithColors = chartData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);
    const chartHeight = isLarge ? 200 : 80;
    const outerRadius = isLarge ? 60 : 35;

    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full text-center">
          <h4 className={`${isLarge ? "text-sm" : "text-[10px]"} font-semibold text-gray-700 mb-1`}>
            {chartTitle}
          </h4>
          {isLarge && (
            <div className="text-lg font-bold text-indigo-600">{totalCount} {totalCount === 1 ? 'item' : 'items'}</div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={chartDataWithColors}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              paddingAngle={1}
              dataKey="value"
              labelLine={false}
            >
              {chartDataWithColors.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.color || CHART_COLORS[index % CHART_COLORS.length]
                  }
                />
              ))}
            </Pie>
            {isLarge && <Tooltip formatter={(value: number) => `${value} items`} />}
            {isLarge && (
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: "16px" }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const LargePieChart = ({
    chartData,
    chartTitle,
  }: {
    chartData: ChartDataPoint[];
    chartTitle: string;
  }) => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex justify-center items-center h-[300px] text-gray-500">
          No data available
        </div>
      );
    }

    // Use unified pastel colors
    const chartDataWithColors = chartData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{chartTitle}</h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">
              {totalCount}
            </div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartDataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              dataKey="value"
              nameKey="name"
            >
              {chartDataWithColors.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.color || CHART_COLORS[index % CHART_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value} items`} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        Loading chart data...
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="flex justify-center items-center h-[300px] text-gray-500">
        No data available
      </div>
    );
  }

  // For dashboard-style display (small charts side by side) or detail page (larger charts side by side)
  if (showSessionComparison) {
    return (
      <div className="space-y-4">
        {isDetailPage && (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {categoryData.allSessionsData.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </div>
        )}
        <div className={`${isDetailPage ? "grid grid-cols-2 gap-6" : "flex gap-0.5"} bg-white`}>
          <PieChartWrapper
            chartData={categoryData.currentSessionData}
            chartTitle={
              isDetailPage || isDashboardExpanded
                ? `Current Session (${getCurrentSession()})`
                : "Current Session"
            }
            isLarge={isDetailPage}
            isDashboard={!isDetailPage}
          />
          <PieChartWrapper
            chartData={categoryData.allSessionsData}
            chartTitle="All Sessions"
            isLarge={isDetailPage}
            isDashboard={!isDetailPage}
          />
        </div>
      </div>
    );
  }

  // For full-page display (large chart)
  return (
    <LargePieChart
      chartData={categoryData.allSessionsData}
      chartTitle={title}
    />
  );
}
