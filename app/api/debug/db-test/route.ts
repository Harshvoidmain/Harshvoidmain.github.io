// app/api/debug/db-test/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      MYSQL_HOST: process.env.MYSQL_HOST,
      MYSQL_PORT: process.env.MYSQL_PORT,
      MYSQL_USER: process.env.MYSQL_USER,
      MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    },
    tests: {
      directConnection: { status: "pending", error: null, time: 0 },
      poolConnection: { status: "pending", error: null, time: 0 },
    },
  };

  // Test 1: Direct connection (no pool)
  try {
    const startTime = Date.now();
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    
    const result = await connection.execute("SELECT 1 as test");
    await connection.end();
    
    const time = Date.now() - startTime;
    diagnostics.tests.directConnection = {
      status: "success",
      error: null,
      time,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.tests.directConnection = {
      status: "failed",
      error: errorMessage,
      time: 0,
    };
  }

  // Test 2: Pool connection
  try {
    const startTime = Date.now();
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    const result = await connection.execute("SELECT 1 as test");
    connection.release();
    await pool.end();
    
    const time = Date.now() - startTime;
    diagnostics.tests.poolConnection = {
      status: "success",
      error: null,
      time,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.tests.poolConnection = {
      status: "failed",
      error: errorMessage,
      time: 0,
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
