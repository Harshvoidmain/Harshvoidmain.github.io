// app/api/health/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("Health check endpoint accessed");
  
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    success: true,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MYSQL_HOST: process.env.MYSQL_HOST || "NOT SET",
      MYSQL_PORT: process.env.MYSQL_PORT || "NOT SET",
      MYSQL_USER: process.env.MYSQL_USER || "NOT SET",
      MYSQL_DATABASE: process.env.MYSQL_DATABASE || "NOT SET",
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    },
    message: "Server is healthy",
  };

  // Try database connection but don't fail if it doesn't work
  try {
    const { query } = await import("@/app/lib/db");
    const result = await query("SELECT 1 as health_check");
    checks.database = {
      status: "connected",
      error: null,
    };
  } catch (error) {
    checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return NextResponse.json(checks, { status: 200 });
}
