"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  ClipboardList,
  FlaskConical,
  Trophy,
  Wrench,
  Cpu,
  Handshake,
  DollarSign,
  ScrollText,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AuthContext } from "@/lib/context/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import { ROLE_LABELS, initials } from "@/lib/utils/formatters";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin", "hod", "faculty", "staff", "student", "deptadmin"],
  },
  {
    label: "Dept Dashboard",
    href: "/dept-admin",
    icon: Building2,
    roles: ["deptadmin"],
  },
  {
    label: "Faculty Modules",
    href: "/faculty/modules",
    icon: ClipboardList,
    roles: ["faculty"],
  },
  {
    label: "Report Generation",
    href: "/faculty/reports",
    icon: BarChart3,
    roles: ["faculty"],
  },
  {
    label: "Super Admin",
    href: "/superadmin",
    icon: Shield,
    roles: ["superadmin"],
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    roles: ["superadmin", "admin"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["superadmin", "admin"],
  },
  {
    label: "Faculty",
    href: "/faculty",
    icon: GraduationCap,
    roles: ["superadmin", "admin", "hod"],
  },
  {
    label: "Students",
    href: "/students",
    icon: Users,
    roles: ["superadmin", "admin", "hod", "staff"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["superadmin", "admin", "hod", "staff", "student"],
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ClipboardList,
    roles: ["superadmin"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["superadmin", "admin"],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { userDoc } = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["My Profile"]));

  const role = userDoc?.role ?? "faculty";
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleLogout = async () => {
    await signOutUser();
    router.replace("/login");
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full z-40 bg-white dark:bg-[#161B22] border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white font-heading font-bold text-xs shrink-0">
              IMS
            </div>
            <span className="font-heading font-semibold text-sm text-[rgb(var(--text-primary))] truncate">
              {process.env.NEXT_PUBLIC_APP_NAME ?? "IMS Portal"}
            </span>
          </div>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded flex items-center justify-center text-muted hover:text-[rgb(var(--text-primary))] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mx-auto"
            title="Expand Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-muted hover:text-[rgb(var(--text-primary))] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.has(item.label);

          return (
            <div key={item.label}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn("nav-item w-full", active && "active")}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        <ChevronRight
                          className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-3 border-l border-border pl-3 mt-0.5 space-y-0.5">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "nav-item text-xs",
                            pathname.startsWith(child.href) && "active"
                          )}
                        >
                          <child.icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href} className={cn("nav-item", active && "active")}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials(userDoc?.displayName ?? "U")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                {userDoc?.displayName ?? "User"}
              </p>
              <p className="text-xs text-muted capitalize">
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-1.5 rounded-md text-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
