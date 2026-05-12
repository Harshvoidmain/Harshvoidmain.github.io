"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  emptyState?: { title: string; description?: string; action?: { label: string; onClick: () => void } };
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  rowClassName?: (row: T) => string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyState,
  selectable = false,
  onSelectionChange,
  rowClassName,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    onSelectionChange?.(Array.from(next));
  };

  const toggleAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const ids = paginatedData.map((r) => String(r[keyField]));
      setSelectedIds(new Set(ids));
      onSelectionChange?.(ids);
    }
  };

  if (data.length === 0 && emptyState) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-[#1C2128] shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
              {selectable && (
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 text-left font-semibold text-muted text-xs uppercase tracking-wide whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-[rgb(var(--text-primary))]",
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span className="text-muted">
                        {sortKey === col.key && sortDir === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5 text-primary" />
                        ) : sortKey === col.key && sortDir === "desc" ? (
                          <ChevronDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((row) => {
              const id = String(row[keyField]);
              return (
                <tr
                  key={id}
                  className={cn(
                    "table-row-hover transition-colors",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                        className="rounded border-border accent-primary"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn("px-4 py-3 text-[rgb(var(--text-primary))]", col.className)}
                    >
                      {col.cell ? col.cell(row) : String(row[col.key as keyof T] ?? "—")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-border rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-900"
            >
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="ml-2">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedData.length)} of {sortedData.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={page === p ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setPage(p)}
                  className="text-xs"
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
