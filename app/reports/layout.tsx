"use client";

import MainLayout from "@/app/components/layout/MainLayout";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already handles authentication, no need to duplicate checks here
  return <MainLayout>{children}</MainLayout>;
}
