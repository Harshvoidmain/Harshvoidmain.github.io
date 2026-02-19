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
 
     const tableCheck = await query("SHOW TABLES LIKE 'faculty_trainings'");
     if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
       return NextResponse.json({
         success: true,
         data: [],
         message: "No training records found (table doesn't exist)",
       });
     }
 
     const rows = (await query(
       `SELECT 
          id,
          faculty_id,
          title,
          organization,
          start_date,
          end_date,
          category,
          description
        FROM faculty_trainings
        WHERE faculty_id = ?
        ORDER BY start_date DESC`,
       [facultyId]
     )) as RowDataPacket[];
 
     return NextResponse.json({ success: true, data: rows });
   } catch (error) {
     console.error("Error fetching trainings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch training records" },
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
    if (!body.title || !body.organization || !body.start_date || !body.category) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    const tableCheck = await query("SHOW TABLES LIKE 'faculty_trainings'");
    if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
      return NextResponse.json(
        { success: false, message: "Trainings table not found" },
        { status: 500 }
      );
    }
    const result = await query(
      `INSERT INTO faculty_trainings (
        faculty_id, title, organization, start_date, end_date, category, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        facultyId,
        body.title,
        body.organization,
        new Date(body.start_date),
        body.end_date ? new Date(body.end_date) : null,
        body.category,
        body.description || null,
      ]
    );
    return NextResponse.json({
      success: true,
      message: "Record added successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error adding training:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add record" },
      { status: 500 }
    );
  }
}
