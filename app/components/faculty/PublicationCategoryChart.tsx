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

type PublicationData = {
  id: number;
  publication_type: "journal" | "conference" | "book" | "book_chapter" | "other";
  publication_date: string;
};

type ChartData = {
  name: string;
  value: number;
  color: string;
};

type PublicationCategoryChartProps = {
  publications: PublicationData[];
  title: string;
  subtitle?: string;
  height?: number;
  filterByYear?: number;
};

const PUBLICATION_COLORS = {
  journal: "#3b82f6", // blue-500
  conference: "#8b5cf6", // purple-500
  book: "#10b981", // emerald-500
  book_chapter: "#06b6d4", // cyan-500
  other: "#6b7280", // gray-500
};

const PUBLICATION_LABELS = {
  journal: "Journal Articles",
  conference: "Conference Papers",
  book: "Books",
  book_chapter: "Book Chapters",
  other: "Other",
};

export default function PublicationCategoryChart({
  publications,
  title,
  subtitle,
  height = 300,
  filterByYear,
}: PublicationCategoryChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processData = () => {
      setLoading(true);

      // Filter publications by year if specified
      const filteredPublications = filterByYear
        ? publications.filter((pub) => {
            const pubYear = new Date(pub.publication_date).getFullYear();
            return pubYear === filterByYear;
          })
        : publications;

      // Count publications by type
      const typeCounts: Record<string, number> = {};
      
      filteredPublications.forEach((pub) => {
        const type = pub.publication_type;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      // Transform to chart data format
      const data: ChartData[] = Object.entries(typeCounts).map(([type, count]) => ({
        name: PUBLICATION_LABELS[type as keyof typeof PUBLICATION_LABELS],
        value: count,
        color: PUBLICATION_COLORS[type as keyof typeof PUBLICATION_COLORS],
      }));

      setChartData(data);
      setLoading(false);
    };

    processData();
  }, [publications, filterByYear]);

  // Custom label render props type
  type CustomLabelProps = {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: CustomLabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Find the actual value for this slice
    const entry = chartData.find((_, index) => {
      const entryPercent = chartData[index].value / chartData.reduce((sum, item) => sum + item.value, 0);
      return Math.abs(entryPercent - percent) < 0.001;
    });

    const actualValue = entry ? entry.value : Math.round(percent * chartData.reduce((sum, item) => sum + item.value, 0));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {actualValue}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        Loading chart data...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px] text-gray-500">
        No publications data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">
            {filterByYear 
              ? publications.filter((pub) => new Date(pub.publication_date).getFullYear() === filterByYear).length
              : publications.length
            }
          </div>
          <div className="text-sm text-gray-500">
            {filterByYear ? "This Year" : "Total"} Publications
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} publications`, null]}
          />
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
}
