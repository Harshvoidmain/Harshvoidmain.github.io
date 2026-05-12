import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow } from "date-fns";

export function formatDate(date: Timestamp | Date | string | null | undefined): string {
  if (!date) return "—";
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Timestamp | Date | string | null | undefined): string {
  if (!date) return "—";
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return format(d, "dd MMM yyyy, HH:mm");
}

export function formatRelativeTime(date: Timestamp | Date | string | null | undefined): string {
  if (!date) return "—";
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  hod: "HOD",
  faculty: "Faculty",
  staff: "Staff",
  student: "Student",
};

export const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  hod: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  faculty: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  staff: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  student: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
};

export const STATUS_COLORS: Record<string, string> = {
  Ongoing: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Submitted: "bg-yellow-100 text-yellow-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
  Filed: "bg-sky-100 text-sky-800",
  Published: "bg-indigo-100 text-indigo-800",
  Granted: "bg-green-100 text-green-800",
  Active: "bg-green-100 text-green-800",
  Expired: "bg-red-100 text-red-800",
  Inactive: "bg-gray-100 text-gray-800",
};
