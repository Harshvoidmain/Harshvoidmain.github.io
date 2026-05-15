"use client";

import { useState } from "react";
import { updateDocument } from "@/lib/firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ModulePermissions, UserRole } from "@/lib/types/permissions.types";
import { ROLE_DEFAULT_PERMISSIONS } from "@/lib/types/permissions.types";

interface PermissionMatrixProps {
  userId: string;
  userRole: UserRole;
  permissions: ModulePermissions;
}

type ModuleKey = keyof ModulePermissions;
type ActionKey = "view" | "create" | "edit" | "delete" | "generate" | "download";

const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  faculty: "Faculty",
  publications: "Publications",
  research: "Research",
  awards: "Awards",
  workshops: "Workshops",
  patents: "Patents",
  memberships: "Memberships",
  contributions: "Contributions",
  departments: "Departments",
  students: "Students",
  reports: "Reports",
  settings: "Settings",
  userManagement: "User Management",
  auditLogs: "Audit Logs",
};

const getActionsForModule = (module: ModuleKey): ActionKey[] => {
  const m = ROLE_DEFAULT_PERMISSIONS.superadmin[module] as Record<string, boolean>;
  return Object.keys(m) as ActionKey[];
};

export function PermissionMatrix({ userId, userRole, permissions }: PermissionMatrixProps) {
  const [perms, setPerms] = useState<ModulePermissions>(permissions);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = (module: ModuleKey, action: ActionKey) => {
    setPerms((prev) => ({
      ...prev,
      [module]: {
        ...(prev[module] as Record<string, boolean>),
        [action]: !(prev[module] as Record<string, boolean>)[action],
      },
    }));
    setDirty(true);
  };

  const resetToDefaults = () => {
    setPerms(ROLE_DEFAULT_PERMISSIONS[userRole]);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateDocument(`users/${userId}`, { modulePermissions: perms });
      toast.success("Permissions updated.");
      setDirty(false);
    } catch {
      toast.error("Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  const modules = Object.keys(MODULE_LABELS) as ModuleKey[];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted">Based on role: <span className="text-primary font-medium capitalize">{userRole}</span></p>
        <button
          onClick={resetToDefaults}
          className="text-xs text-primary hover:underline"
        >
          Reset to defaults
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-3 py-2 font-semibold text-muted w-36">Module</th>
                <th className="text-center px-2 py-2 font-semibold text-muted">View</th>
                <th className="text-center px-2 py-2 font-semibold text-muted">Create</th>
                <th className="text-center px-2 py-2 font-semibold text-muted">Edit</th>
                <th className="text-center px-2 py-2 font-semibold text-muted">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {modules.map((module) => {
                const actions = getActionsForModule(module);
                const modulePerms = perms[module] as Record<string, boolean>;
                const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole][module] as Record<string, boolean>;
                const isChanged = JSON.stringify(modulePerms) !== JSON.stringify(defaultPerms);

                return (
                  <tr key={module} className={isChanged ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                    <td className="px-3 py-2 font-medium text-[rgb(var(--text-primary))]">
                      <div className="flex items-center gap-1.5">
                        {isChanged && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                        {MODULE_LABELS[module]}
                      </div>
                    </td>
                    {(["view", "create", "edit", "delete"] as ActionKey[]).map((action) => {
                      const hasAction = actions.includes(action);
                      return (
                        <td key={action} className="text-center px-2 py-2">
                          {hasAction ? (
                            <div className="flex justify-center">
                              <Switch
                                checked={!!modulePerms[action]}
                                onCheckedChange={() => toggle(module, action)}
                              />
                            </div>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dirty && (
        <div className="mt-3">
          <Button variant="accent" size="sm" onClick={save} loading={saving} className="w-full">
            Save Permissions
          </Button>
        </div>
      )}
    </div>
  );
}
