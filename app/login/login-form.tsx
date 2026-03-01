"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  CheckCircle2,
  LogIn,
  Eye,
  EyeOff,
  Sun,
  Moon,
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
} from "lucide-react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, error, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const message = searchParams.get("message");

  useEffect(() => { setMounted(true); }, []);

  const checkAuthStatusCookie = () =>
    document.cookie.split(";").some((c) => c.trim().startsWith("auth_status="));

  const checkSessionTokenCookie = () =>
    document.cookie.split(";").some((c) => c.trim().startsWith("session_token="));

  const doRedirect = (path: string) => {
    setSuccessMessage(`Login successful! Redirecting to ${path}...`);
    sessionStorage.setItem("loginSuccessful", "true");
    sessionStorage.setItem("loginRedirectPath", path);
    sessionStorage.setItem("preventAuthLoop", "true");
    setTimeout(() => {
      if (checkAuthStatusCookie() && checkSessionTokenCookie()) {
        router.push(path);
      } else {
        setTimeout(() => router.push(path), 1000);
      }
    }, 1000);
  };

  useEffect(() => {
    const loginJustCompleted = sessionStorage.getItem("loginSuccessful") === "true";
    if (loginJustCompleted) {
      sessionStorage.removeItem("loginSuccessful");
      return;
    }
    if (user) {
      doRedirect(redirect);
    }
  }, [user, redirect]);

  useEffect(() => {
    if (message) setSuccessMessage(message);
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setLocalError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          sessionStorage.setItem("authUser", JSON.stringify(data.user));
        }
        doRedirect(data.redirectUrl || redirect);
      } else {
        let errorData;
        try { errorData = await response.json(); } catch { errorData = { message: "Login failed" }; }
        setLocalError(errorData.message || "Login failed");
      }
    } catch (err) {
      setLocalError("Login failed - please check your connection and try again");
      try { await login(username, password, rememberMe); } catch { }
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: GraduationCap, label: "Faculty Management", desc: "Track staff, roles & activities" },
    { icon: BookOpen, label: "Publications", desc: "Research & journal submissions" },
    { icon: Users, label: "Departments", desc: "Org structure & HOD management" },
    { icon: BarChart3, label: "Reports & Analytics", desc: "Insights at a glance" },
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left panel: branding / features ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col justify-between p-12">
        {/* Animated blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-blob animation-delay-2000" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">IMS Portal</span>
          </div>
          <p className="text-white/60 text-sm">Fr. C. Rodrigues Institute of Technology</p>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your academic<br />hub, all in one<br />
            <span className="text-white/70">place.</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Manage faculty, publications, departments and generate insightful reports — seamlessly.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col gap-1 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-colors">
              <Icon className="w-5 h-5 text-white/80 mb-1" />
              <span className="text-white text-sm font-semibold">{label}</span>
              <span className="text-white/60 text-xs leading-snug">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: login form ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top bar with theme toggle */}
        <div className="flex items-center justify-between px-8 pt-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground">IMS Portal</span>
          </div>
          <div className="hidden lg:block" />

          {/* Dark / Light toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <><Sun className="w-4 h-4" /><span>Light</span></>
              ) : (
                <><Moon className="w-4 h-4" /><span>Dark</span></>
              )}
            </button>
          )}
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome back</h2>
              <p className="mt-1 text-muted-foreground text-sm">Sign in to your IMS account</p>
            </div>

            {/* Alerts */}
            {successMessage && (
              <div className="flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800/50 mb-5">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {(error || localError) && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800/50 mb-5">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Faculty ID or Roll Number"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 rounded-xl border-border bg-background focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                />
                <p className="text-xs text-muted-foreground">
                  Faculty/Admin: Faculty ID &nbsp;·&nbsp; Student: Roll Number
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-11 rounded-xl border-border bg-background focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all font-semibold text-white shadow-md shadow-indigo-500/20"
                disabled={isSubmitting || !username || !password}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
