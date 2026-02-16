import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import fs from "fs";
import path from "path";
 
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
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
      await query(
        `UPDATE faculty_interactions SET 
          event = ?, 
          institution = ?, 
          role = ?, 
          date = ?, 
          description = ?
        WHERE id = ?`,
        [details, branch, role, date, JSON.stringify(extras), id]
      );
      return NextResponse.json({ success: true, certificate: certificatePath });
    } else {
      const body = await request.json();
      await query(
        `UPDATE faculty_interactions SET 
          event = ?, 
          institution = ?, 
          role = ?, 
          date = ?, 
          description = ?
        WHERE id = ?`,
        [
          body.event,
          body.institution,
          body.role,
          body.date,
          body.description || null,
          id,
        ]
      );
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error updating interaction:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update interaction" },
      { status: 500 }
    );
  }
}
 
 export async function DELETE(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   const { id } = await params;
   try {
     await query("DELETE FROM faculty_interactions WHERE id = ?", [id]);
     return NextResponse.json({
       success: true,
       message: "Interaction deleted successfully",
     });
   } catch (error) {
     console.error("Error deleting interaction:", error);
     return NextResponse.json(
       { success: false, message: "Failed to delete interaction" },
       { status: 500 }
     );
   }
 }
