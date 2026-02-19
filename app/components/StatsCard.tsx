import { ReactNode } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { classNames } from "@/app/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  changeText?: string;
  trend?: "up" | "down" | "neutral";
  bgColor?: string;
  textColor?: string;
};

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeText,
  trend = "neutral",
  bgColor = "bg-white",
  textColor = "text-gray-900",
}: StatsCardProps) {
  return (
    <div
      className={classNames(
        bgColor,
        "relative overflow-hidden rounded-lg shadow-md p-2 transition-all duration-300 hover:shadow-lg border border-gray-200"
      )}
    >
      {/* Title at top */}
      <h3 className="text-xs font-semibold text-gray-700 mb-1 truncate">
        {title}
      </h3>

      {/* Icon and Value side by side */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center h-6 w-6">
          {icon}
        </div>
        <p className={classNames(textColor, "text-lg font-bold")}>
          {value}
        </p>
      </div>

      {change !== undefined && trend !== "neutral" && (
        <div className="mt-2 flex items-center justify-end">
          <p
            className={classNames(
              trend === "up" ? "text-green-600" : "text-red-600",
              "flex items-center text-xs"
            )}
          >
            {trend === "up" ? (
              <ArrowUpIcon
                className="h-3 w-3 flex-shrink-0 self-center text-green-600"
                aria-hidden="true"
              />
            ) : (
              <ArrowDownIcon
                className="h-3 w-3 flex-shrink-0 self-center text-red-600"
                aria-hidden="true"
              />
            )}
            <span className="ml-1">{Math.abs(change)}%</span>
          </p>

          {changeText && (
            <p className="text-xs text-gray-500 ml-2">{changeText}</p>
          )}
        </div>
      )}
    </div>
  );
}
