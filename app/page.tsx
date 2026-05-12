"use client";

import { useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/lib/context/AuthContext";

export default function RootPage() {
  const { user, userDoc, loading, initialized } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (userDoc?.passwordResetRequired) {
      router.replace("/change-password");
      return;
    }

    router.replace("/dashboard");
  }, [user, userDoc, initialized, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm font-body">Loading IMS Portal…</p>
      </div>
    </div>
  );
}
