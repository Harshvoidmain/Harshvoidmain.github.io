"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/lib/schemas/user.schema";
import { signIn, getAuthErrorMessage } from "@/lib/firebase/auth";
import { AuthContext } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Metadata } from "next";

export default function LoginPage() {
  const { user, userDoc, initialized } = useContext(AuthContext);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  useEffect(() => {
    if (!initialized) return;
    if (user) {
      if (userDoc?.passwordResetRequired) {
        router.replace("/change-password");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, userDoc, initialized, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password, data.rememberMe);
      // Navigation handled by the useEffect above
    } catch (error: any) {
      const code = error.code ?? "";
      const msg = error.message ?? getAuthErrorMessage(code);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-primary flex-col justify-between p-10 relative overflow-hidden">
        {/* Background geometric pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 700" fill="none">
          <circle cx="350" cy="100" r="200" stroke="white" strokeWidth="1" />
          <circle cx="350" cy="100" r="140" stroke="white" strokeWidth="1" />
          <circle cx="50" cy="600" r="150" stroke="white" strokeWidth="1" />
          <circle cx="200" cy="350" r="80" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="400" y2="700" stroke="white" strokeWidth="0.5" />
          <line x1="400" y1="0" x2="0" y2="700" stroke="white" strokeWidth="0.5" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">IMS</span>
            </div>
            <span className="text-white font-heading font-semibold text-lg">
              {process.env.NEXT_PUBLIC_APP_NAME ?? "IMS Portal"}
            </span>
          </div>

          <h1 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
            Information<br />Management<br />System
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Centralized academic data management for faculty, students, and research excellence.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-white/50 text-xs">Secure Access</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>
          <p className="text-white/40 text-xs mt-4 text-center">
            © {new Date().getFullYear()} IMS Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface dark:bg-[#0D1117]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-heading font-bold text-xs">
              IMS
            </div>
            <span className="font-heading font-semibold text-[rgb(var(--text-primary))]">
              IMS Portal
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-[rgb(var(--text-primary))]">
              Welcome back
            </h2>
            <p className="text-muted text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@institution.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              required
              {...register("email")}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              required
              {...register("password")}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border accent-primary"
                  {...register("rememberMe")}
                />
                <span className="text-[rgb(var(--text-primary))]">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full bg-primary hover:bg-primary/90 h-10 text-sm font-semibold"
              loading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            Don&apos;t have an account?{" "}
            <span className="text-[rgb(var(--text-primary))]">
              Contact your system administrator.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
