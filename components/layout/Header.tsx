"use client";

import { useContext, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Sun, Moon, Search, Menu, ChevronRight } from "lucide-react";
import { AuthContext } from "@/lib/context/AuthContext";
import { initials } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumbs?: Breadcrumb[];
  onMenuToggle?: () => void;
}

export function Header({ breadcrumbs = [], onMenuToggle }: HeaderProps) {
  const { userDoc } = useContext(AuthContext);
  const { theme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-white dark:bg-[#161B22] flex items-center px-6 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-md text-muted hover:text-[rgb(var(--text-primary))] hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />}
            {i < breadcrumbs.length - 1 ? (
              <a href={crumb.href} className="text-muted hover:text-primary transition-colors truncate">
                {crumb.label}
              </a>
            ) : (
              <span className="font-medium text-[rgb(var(--text-primary))] truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Search */}
      <div
        className={cn(
          "hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border transition-all",
          searchFocused ? "border-primary bg-white dark:bg-gray-900 w-64" : "border-border bg-gray-50 dark:bg-gray-800 w-48"
        )}
      >
        <Search className="w-3.5 h-3.5 text-muted shrink-0" />
        <input
          type="text"
          placeholder="Search…"
          className="bg-transparent text-sm text-[rgb(var(--text-primary))] placeholder:text-muted outline-none w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded-md text-muted hover:text-[rgb(var(--text-primary))] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-md text-muted hover:text-[rgb(var(--text-primary))] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold ml-1">
          {initials(userDoc?.displayName ?? "U")}
        </div>
      </div>
    </header>
  );
}
