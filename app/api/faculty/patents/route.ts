 import { NextRequest, NextResponse } from "next/server";
 import { query } from "@/app/lib/db";
 import { RowDataPacket } from "mysql2";
 
export async function GET(request: NextRequest) {
  try {
     // Get user using our robust server-side auth utility
    const { getAuthUser } = await import("@/app/lib/auth-server");
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Polyfill authData to avoid breaking existing downstream code
    const authData = { success: true, user };
 
     const facultyId =
       request.nextUrl.searchParams.get("facultyId") || authData.user.username;
     if (!facultyId) {
       return NextResponse.json(
         { success: false, message: "Faculty ID is required" },
         { status: 400 }
       );
     }
 
     const tableCheck = await query("SHOW TABLES LIKE 'faculty_patents'");
     if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
       return NextResponse.json({
         success: true,
         data: [],
         message: "No IP records found (table doesn't exist)",
       });
     }
 
     const rows = (await query(
       `SELECT 
          id,
          faculty_id,
          title,
          type,
          application_no,
          status,
          filing_date,
          assignee,
          description
        FROM faculty_patents
        WHERE faculty_id = ?
        ORDER BY filing_date DESC`,
       [facultyId]
     )) as RowDataPacket[];
 
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching patents:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch patents and copyrights" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user using our robust server-side auth utility
    const { getAuthUser } = await import("@/app/lib/auth-server");
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Polyfill authData to avoid breaking existing downstream code
    const authData = { success: true, user };
    const facultyId =
      request.nextUrl.searchParams.get("facultyId") || authData.user.username;
    if (!facultyId) {
      return NextResponse.json(
        { success: false, message: "Faculty ID is required" },
        { status: 400 }
      );
    }
    const body = await request.json();
    if (!body.title || !body.type || !body.filing_date) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    const tableCheck = await query("SHOW TABLES LIKE 'faculty_patents'");
    if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
      return NextResponse.json(
        { success: false, message: "Patents table not found" },
        { status: 500 }
      );
    }
    const result = await query(
      `INSERT INTO faculty_patents (
        faculty_id, title, type, application_no, status, filing_date, assignee, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        facultyId,
        body.title,
        body.type,
        body.application_no || null,
        body.status || null,
        new Date(body.filing_date),
        body.assignee || null,
        body.description || null,
      ]
    );
    return NextResponse.json({
      success: true,
      message: "IP record added successfully",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error adding IP record:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add IP record" },
      { status: 500 }
    );
  }
}
