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
  isHero?: boolean;
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
  isHero = false,
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
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
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
          <h4 className={`${isLarge ? "text-sm" : "text-[10px]"} font-semibold text-gray-700 dark:text-gray-300 mb-1`}>
            {chartTitle}
          </h4>
          {isLarge && (
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{totalCount} {totalCount === 1 ? 'item' : 'items'}</div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={chartDataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={isLarge ? 40 : 22}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              stroke="none"
              cornerRadius={3}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{chartTitle}</h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {totalCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Items</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartDataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              stroke="none"
              cornerRadius={4}
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

  if (isHero) {
    const chartData = categoryData.allSessionsData;
    const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);

    // Explicit colors mimicking the previously requested "Rating" chart
    const heroColors = ["#6366f1", "#f97316", "#22c55e", "#ef4444"];

    const chartDataWithColors = chartData.map((item, index) => ({
      ...item,
      color: heroColors[index % heroColors.length],
    }));

    return (
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-end mb-6">
          <span className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {totalCount}<span className="text-lg text-gray-400 font-bold uppercase tracking-widest ml-1">Total</span>
          </span>
        </div>

        <div className="h-44 w-full relative mb-4 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartDataWithColors}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {chartDataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', background: 'rgba(255,255,255,0.95)', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
            <span className="text-2xl font-black text-gray-900 dark:text-white">100%</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracked</span>
          </div>
        </div>

        {/* Legends at the bottom */}
        <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center mt-auto">
          {chartDataWithColors.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
              {d.name} <span className="text-gray-900 dark:text-gray-200 ml-0.5">{d.value}</span>
            </div>
          ))}
        </div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {categoryData.allSessionsData.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Items</div>
            </div>
          </div>
        )}
        <div className={`${isDetailPage ? "grid grid-cols-2 gap-6" : "flex gap-0.5"} bg-transparent`}>
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

  return (
    <div className="w-full flex justify-center py-1">
      <PieChartWrapper
        chartData={categoryData.allSessionsData}
        chartTitle=""
        isLarge={false}
        isDashboard={true}
      />
    </div>
  );
}
