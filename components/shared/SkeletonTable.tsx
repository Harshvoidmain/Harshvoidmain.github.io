interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <div className="w-full">
      <div className="skeleton h-10 rounded-t-lg mb-px w-full" />
      <div className="border border-border rounded-b-lg overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="skeleton h-4 rounded"
                style={{ width: `${Math.random() * 40 + 15}%`, flexShrink: 0 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
          <div className="skeleton h-6 w-16 rounded mb-3" />
          <div className="skeleton h-8 w-24 rounded mb-2" />
          <div className="skeleton h-4 w-full rounded mb-1.5" />
          <div className="skeleton h-4 w-3/4 rounded mb-4" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#1C2128] rounded-lg border border-border p-5 shadow-card">
          <div className="skeleton h-4 w-28 rounded mb-3" />
          <div className="skeleton h-8 w-16 rounded mb-1" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}
