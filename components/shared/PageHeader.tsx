import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  count?: number;
}

export function PageHeader({ title, subtitle, actions, className, count }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-heading font-semibold text-[rgb(var(--text-primary))]">
            {title}
          </h1>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 min-w-[28px]">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
