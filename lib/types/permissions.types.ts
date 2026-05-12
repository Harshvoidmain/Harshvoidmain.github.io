export type ModulePermissions = {
  dashboard: { view: boolean };
  faculty: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  publications: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  research: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  awards: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  workshops: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  patents: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  memberships: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  contributions: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  departments: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  students: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  reports: { view: boolean; generate: boolean; download: boolean };
  settings: { view: boolean; edit: boolean };
  userManagement: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  auditLogs: { view: boolean };
};

export type UserRole = "superadmin" | "admin" | "hod" | "faculty" | "staff" | "student";

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  superadmin: {
    dashboard: { view: true },
    faculty: { view: true, create: true, edit: true, delete: true },
    publications: { view: true, create: true, edit: true, delete: true },
    research: { view: true, create: true, edit: true, delete: true },
    awards: { view: true, create: true, edit: true, delete: true },
    workshops: { view: true, create: true, edit: true, delete: true },
    patents: { view: true, create: true, edit: true, delete: true },
    memberships: { view: true, create: true, edit: true, delete: true },
    contributions: { view: true, create: true, edit: true, delete: true },
    departments: { view: true, create: true, edit: true, delete: true },
    students: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, generate: true, download: true },
    settings: { view: true, edit: true },
    userManagement: { view: true, create: true, edit: true, delete: true },
    auditLogs: { view: true },
  },
  admin: {
    dashboard: { view: true },
    faculty: { view: true, create: true, edit: true, delete: false },
    publications: { view: true, create: true, edit: true, delete: false },
    research: { view: true, create: true, edit: true, delete: false },
    awards: { view: true, create: true, edit: true, delete: false },
    workshops: { view: true, create: true, edit: true, delete: false },
    patents: { view: true, create: true, edit: true, delete: false },
    memberships: { view: true, create: true, edit: true, delete: false },
    contributions: { view: true, create: true, edit: true, delete: false },
    departments: { view: true, create: true, edit: true, delete: false },
    students: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, generate: true, download: true },
    settings: { view: true, edit: true },
    userManagement: { view: true, create: true, edit: true, delete: false },
    auditLogs: { view: false },
  },
  hod: {
    dashboard: { view: true },
    faculty: { view: true, create: false, edit: true, delete: false },
    publications: { view: true, create: true, edit: true, delete: false },
    research: { view: true, create: true, edit: true, delete: false },
    awards: { view: true, create: true, edit: true, delete: false },
    workshops: { view: true, create: true, edit: true, delete: false },
    patents: { view: true, create: true, edit: true, delete: false },
    memberships: { view: true, create: true, edit: true, delete: false },
    contributions: { view: true, create: true, edit: true, delete: false },
    departments: { view: true, create: false, edit: false, delete: false },
    students: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, generate: true, download: true },
    settings: { view: false, edit: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
    auditLogs: { view: false },
  },
  faculty: {
    dashboard: { view: true },
    faculty: { view: false, create: false, edit: false, delete: false },
    publications: { view: true, create: true, edit: true, delete: true },
    research: { view: true, create: true, edit: true, delete: true },
    awards: { view: true, create: true, edit: true, delete: true },
    workshops: { view: true, create: true, edit: true, delete: true },
    patents: { view: true, create: true, edit: true, delete: true },
    memberships: { view: true, create: true, edit: true, delete: true },
    contributions: { view: true, create: true, edit: true, delete: true },
    departments: { view: true, create: false, edit: false, delete: false },
    students: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, generate: true, download: true },
    settings: { view: false, edit: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
    auditLogs: { view: false },
  },
  staff: {
    dashboard: { view: true },
    faculty: { view: true, create: false, edit: false, delete: false },
    publications: { view: true, create: false, edit: false, delete: false },
    research: { view: true, create: false, edit: false, delete: false },
    awards: { view: true, create: false, edit: false, delete: false },
    workshops: { view: true, create: false, edit: false, delete: false },
    patents: { view: true, create: false, edit: false, delete: false },
    memberships: { view: true, create: false, edit: false, delete: false },
    contributions: { view: true, create: false, edit: false, delete: false },
    departments: { view: true, create: false, edit: false, delete: false },
    students: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, generate: false, download: true },
    settings: { view: false, edit: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
    auditLogs: { view: false },
  },
  student: {
    dashboard: { view: true },
    faculty: { view: false, create: false, edit: false, delete: false },
    publications: { view: false, create: false, edit: false, delete: false },
    research: { view: false, create: false, edit: false, delete: false },
    awards: { view: false, create: false, edit: false, delete: false },
    workshops: { view: false, create: false, edit: false, delete: false },
    patents: { view: false, create: false, edit: false, delete: false },
    memberships: { view: false, create: false, edit: false, delete: false },
    contributions: { view: false, create: false, edit: false, delete: false },
    departments: { view: false, create: false, edit: false, delete: false },
    students: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, generate: false, download: false },
    settings: { view: false, edit: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
    auditLogs: { view: false },
  },
};
