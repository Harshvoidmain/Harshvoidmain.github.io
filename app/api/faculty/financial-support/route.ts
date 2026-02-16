import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
     const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
       headers: {
         cookie: request.headers.get("cookie") || "",
       },
     });
 
     if (!authResponse.ok) {
       return NextResponse.json(
         { success: false, message: "Authentication failed" },
         { status: 401 }
       );
     }
 
     const authData = await authResponse.json();
     if (!authData.success || !authData.user) {
       return NextResponse.json(
         { success: false, message: "User not authenticated" },
         { status: 401 }
       );
     }
 
     const facultyId =
       request.nextUrl.searchParams.get("facultyId") || authData.user.username;
     if (!facultyId) {
       return NextResponse.json(
         { success: false, message: "Faculty ID is required" },
         { status: 400 }
       );
     }
 
     const tableCheck = await query("SHOW TABLES LIKE 'faculty_financial_support'");
     if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
       return NextResponse.json({
         success: true,
         data: [],
         message: "No financial support records found (table doesn't exist)",
       });
     }
 
     const rows = (await query(
       `SELECT 
          id,
          faculty_id,
          scheme_name,
          sponsor,
          amount,
          date,
          purpose,
          project_ref
        FROM faculty_financial_support
        WHERE faculty_id = ?
        ORDER BY date DESC`,
       [facultyId]
     )) as RowDataPacket[];
 
     return NextResponse.json({ success: true, data: rows });
   } catch (error) {
     console.error("Error fetching financial support:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch financial support records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    if (!authResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Authentication failed" },
        { status: 401 }
      );
    }
    const authData = await authResponse.json();
    if (!authData.success || !authData.user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }
    const facultyId =
      request.nextUrl.searchParams.get("facultyId") || authData.user.username;
    if (!facultyId) {
      return NextResponse.json(
        { success: false, message: "Faculty ID is required" },
        { status: 400 }
      );
    }
    const body = await request.json();
    if (!body.scheme_name || !body.sponsor || body.amount == null || !body.date) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    const tableCheck = await query("SHOW TABLES LIKE 'faculty_financial_support'");
    if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
      return NextResponse.json(
        { success: false, message: "Financial support table not found" },
        { status: 500 }
      );
    }
    const result = await query(
      `INSERT INTO faculty_financial_support (
        faculty_id, scheme_name, sponsor, amount, date, purpose, project_ref
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        facultyId,
        body.scheme_name,
        body.sponsor,
        Number(body.amount),
        new Date(body.date),
        body.purpose || null,
        body.project_ref || null,
      ]
    );
    return NextResponse.json({
      success: true,
      message: "Support record added successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error adding financial support:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add support record" },
      { status: 500 }
    );
  }
}
