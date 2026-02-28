import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { RowDataPacket } from "mysql2";
import fs from "fs";
import path from "path";

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
 
     // Check table existence
     const tableCheck = await query("SHOW TABLES LIKE 'faculty_interactions'");
     if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
       return NextResponse.json({
         success: true,
         data: [],
         message: "No interactions found (table doesn't exist)",
       });
     }
 
     const rows = (await query(
       `SELECT 
          id,
          faculty_id,
          role,
          event,
          institution,
          date,
          description
        FROM faculty_interactions
        WHERE faculty_id = ?
        ORDER BY date DESC`,
       [facultyId]
     )) as RowDataPacket[];
 
     return NextResponse.json({ success: true, data: rows });
   } catch (error) {
     console.error("Error fetching interactions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch interactions" },
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
    const tableCheck = await query("SHOW TABLES LIKE 'faculty_interactions'");
    if (!(Array.isArray(tableCheck) && tableCheck.length > 0)) {
      return NextResponse.json(
        { success: false, message: "Interactions table not found" },
        { status: 500 }
      );
    }
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const academic_year = (formData.get("academic_year") as string) || "";
      const branch = (formData.get("branch") as string) || "";
      const faculty_name = (formData.get("faculty_name") as string) || "";
      const role = (formData.get("role") as string) || "";
      const other_interaction = (formData.get("other_interaction") as string) || "";
      const details = (formData.get("details") as string) || "";
      const date = (formData.get("date") as string) || "";
      const level = (formData.get("level") as string) || "";
      const duration = (formData.get("duration") as string) || "";
      const certificate = formData.get("certificate") as File | null;
      if (!details || !branch || !role || !date) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }
      let certificatePath: string | null = null;
      if (certificate && certificate.size > 0) {
        const uploadsDir = path.join(process.cwd(), "public/uploads/interactions");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const fileName = `${Date.now()}-${certificate.name}`;
        const filePath = path.join(uploadsDir, fileName);
        const buffer = Buffer.from(await certificate.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        certificatePath = `/uploads/interactions/${fileName}`;
      }
      const extras = {
        academic_year,
        faculty_name,
        other_interaction,
        level,
        duration,
        certificate: certificatePath,
      };
      const result = await query(
        `INSERT INTO faculty_interactions (
          faculty_id, event, institution, role, date, description
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          facultyId,
          details,
          branch,
          role,
          new Date(date),
          JSON.stringify(extras),
        ]
      );
      return NextResponse.json({
        success: true,
        message: "Interaction added successfully",
        data: { id: (result as any).insertId, certificate: certificatePath },
      });
    } else {
      const body = await request.json();
      if (!body.event || !body.institution || !body.date || !body.role) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }
      const result = await query(
        `INSERT INTO faculty_interactions (
          faculty_id, event, institution, role, date, description
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          facultyId,
          body.event,
          body.institution,
          body.role,
          new Date(body.date),
          body.description || null,
        ]
      );
      return NextResponse.json({
        success: true,
        message: "Interaction added successfully",
        data: { id: (result as any).insertId },
      });
    }
  } catch (error) {
    console.error("Error adding interaction:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add interaction" },
      { status: 500 }
    );
  }
}
