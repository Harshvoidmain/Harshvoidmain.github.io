import { Timestamp } from "firebase/firestore";
import type { ModulePermissions, UserRole } from "./permissions.types";

export type { UserRole };

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId: string | null;
  modulePermissions: ModulePermissions;
  isActive: boolean;
  passwordResetRequired: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastLoginAt?: Timestamp;
  profilePhotoUrl?: string | null;
}

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "login"
  | "logout"
  | "password_changed"
  | "permission_updated"
  | "report_generated"
  | "file_uploaded"
  | "file_deleted";
