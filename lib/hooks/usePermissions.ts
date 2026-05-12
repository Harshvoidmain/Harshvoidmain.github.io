"use client";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import type { ModulePermissions } from "../types/permissions.types";
import { ROLE_DEFAULT_PERMISSIONS } from "../types/permissions.types";

type Module = keyof ModulePermissions;
type Action = "view" | "create" | "edit" | "delete" | "generate" | "download";

export function usePermissions() {
  const { userDoc } = useContext(AuthContext);

  function can(module: Module, action: Action): boolean {
    if (!userDoc) return false;

    const perms = userDoc.modulePermissions ?? ROLE_DEFAULT_PERMISSIONS[userDoc.role];
    const modulePerms = perms[module] as Record<string, boolean> | undefined;
    if (!modulePerms) return false;

    return modulePerms[action] === true;
  }

  function canView(module: Module): boolean {
    return can(module, "view");
  }

  function canCreate(module: Module): boolean {
    return can(module, "create");
  }

  function canEdit(module: Module): boolean {
    return can(module, "edit");
  }

  function canDelete(module: Module): boolean {
    return can(module, "delete");
  }

  function isSuperAdmin(): boolean {
    return userDoc?.role === "superadmin";
  }

  function isAdmin(): boolean {
    return userDoc?.role === "admin" || isSuperAdmin();
  }

  function isHOD(): boolean {
    return userDoc?.role === "hod" || isAdmin();
  }

  function isFaculty(): boolean {
    return userDoc?.role === "faculty";
  }

  function isStudent(): boolean {
    return userDoc?.role === "student";
  }

  return { can, canView, canCreate, canEdit, canDelete, isSuperAdmin, isAdmin, isHOD, isFaculty, isStudent };
}
