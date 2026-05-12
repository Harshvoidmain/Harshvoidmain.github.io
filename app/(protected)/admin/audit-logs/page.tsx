"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@/lib/types/user.types";
import { formatDateTime } from "@/lib/utils/formatters";

const ACTION_COLORS: Record<string, "success" | "error" | "primary" | "warning" | "default"> = {
  created: "success",
  deleted: "error",
  updated: "primary",
  login: "default",
  logout: "default",
  password_changed: "warning",
  permission_updated: "warning",
  report_generated: "primary",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(200));
    return onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog));
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter((l) => actionFilter === "all" || l.action === actionFilter);

  const columns: Column<AuditLog>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      cell: (l) => <span className="text-xs text-muted font-mono">{formatDateTime(l.timestamp)}</span>,
    },
    {
      key: "userName",
      header: "User",
      sortable: true,
      cell: (l) => (
        <div>
          <p className="text-sm font-medium">{l.userName}</p>
          <p className="text-xs text-muted">{l.userEmail}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (l) => (
        <Badge variant={ACTION_COLORS[l.action] ?? "default"}>
          {l.action.replace(/_/g, " ")}
        </Badge>
      ),
    },
    { key: "entityType", header: "Entity Type", cell: (l) => <span className="text-xs capitalize">{l.entityType}</span> },
    {
      key: "entityId",
      header: "Entity ID",
      cell: (l) => <span className="font-mono text-xs text-muted">{l.entityId.slice(0, 12)}…</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Complete system activity history"
        count={filtered.length}
      />

      <div className="flex gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm"
        >
          <option value="all">All Actions</option>
          {["created","updated","deleted","login","logout","password_changed","permission_updated","report_generated"].map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {loading ? <SkeletonTable rows={8} cols={5} /> : (
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          keyField="id"
          emptyState={{ title: "No audit logs found" }}
        />
      )}
    </div>
  );
}
