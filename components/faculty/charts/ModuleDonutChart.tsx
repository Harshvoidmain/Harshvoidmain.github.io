"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ModuleDonutChartProps {
  data: { name: string; value: number; color: string }[];
  size?: number;
}

export function ModuleDonutChart({ data, size = 80 }: ModuleDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-12 h-12 rounded-full border-4 border-gray-100 dark:border-gray-800" />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 3.5}
            outerRadius={size / 2}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
