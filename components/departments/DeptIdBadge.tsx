import { cn } from "@/lib/utils/cn";

interface DeptIdBadgeProps {
  deptId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DeptIdBadge({ deptId, size = "md", className }: DeptIdBadgeProps) {
  return (
    <span
      className={cn(
        "dept-id-badge",
        size === "sm" && "text-[10px] px-1 py-0.5",
        size === "lg" && "text-base px-3 py-1.5 text-xl font-bold",
        className
      )}
    >
      [{deptId}]
    </span>
  );
}
