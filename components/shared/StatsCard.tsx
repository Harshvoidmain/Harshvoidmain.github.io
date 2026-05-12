import { cn } from "@/lib/utils/cn";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-heading font-bold text-[rgb(var(--text-primary))] mt-1.5">
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend.value >= 0 ? "text-success" : "text-error")}>
              <span>{trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}%</span>
              <span className="text-muted font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
