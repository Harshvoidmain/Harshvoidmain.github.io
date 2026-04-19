// app/api/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MYSQL_HOST: process.env.MYSQL_HOST || "NOT SET",
      MYSQL_PORT: process.env.MYSQL_PORT || "NOT SET",
      MYSQL_USER: process.env.MYSQL_USER || "NOT SET",
      MYSQL_DATABASE: process.env.MYSQL_DATABASE || "NOT SET",
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    },
    database: {
      status: "unknown",
      error: null,
    },
  };

  // Test database connection
  try {
    const result = await query("SELECT 1 as health_check");
    checks.database.status = "connected";
    checks.database.error = null;
  } catch (error) {
    checks.database.status = "error";
    checks.database.error = error instanceof Error ? error.message : String(error);
  }

  const status = checks.database.status === "connected" ? 200 : 500;
  return NextResponse.json(checks, { status });
}
