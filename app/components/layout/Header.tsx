"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/app/providers/auth-provider";
import Link from "next/link";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Must wait for mount to read theme (avoids SSR hydration mismatch)
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  const notifications = [
    { id: 1, text: "New faculty member joined", time: "5m ago", read: false },
    { id: 2, text: "NBA Committee meeting scheduled", time: "1h ago", read: false },
    { id: 3, text: "Reports are due tomorrow", time: "3h ago", read: true },
  ];
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-20 flex items-center justify-between px-6 md:px-8 bg-transparent transition-colors duration-300">
      {/* Left: Title area (shows on mobile since sidebar is hidden) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">IMS</span>
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-sm">IMS Portal</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">

        {/* Dark/Light Toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
          aria-label="Toggle theme"
        >
          {mounted ? (
            isDark ? (
              /* Sun Icon */
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="5" />
                <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              /* Moon Icon */
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )
          ) : (
            <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(v => !v); setShowUserMenu(false); }}
            className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 dark:border-white/10 overflow-hidden z-50">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20 pointer-events-none" />
              <div className="px-4 py-3 border-b border-white/40 dark:border-white/10 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                {unread > 0 && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">{unread} new</span>}
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/10 max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{n.text}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(v => !v); setShowNotifications(false); }}
            className="flex items-center gap-2.5 h-9 pl-2 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-none truncate max-w-24">
                {user?.name?.split(" ")[0] || "User"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize leading-none mt-0.5">
                {user?.role || "faculty"}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-52 bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 dark:border-white/10 overflow-hidden z-50">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20 pointer-events-none" />
              <div className="px-4 py-3 border-b border-white/40 dark:border-white/10">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role || "faculty"}</p>
              </div>
              <div className="p-1">
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Your Profile
                </Link>
                <Link href="/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
