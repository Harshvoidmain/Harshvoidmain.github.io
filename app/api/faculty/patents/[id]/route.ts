 import { NextRequest, NextResponse } from "next/server";
 import { query } from "@/app/lib/db";
 
 export async function PUT(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   const { id } = await params;
   try {
     const body = await request.json();
     await query(
       `UPDATE faculty_patents SET 
         title = ?, 
         type = ?, 
         application_no = ?, 
         status = ?, 
         filing_date = ?, 
         assignee = ?, 
         description = ?
       WHERE id = ?`,
       [
         body.title,
         body.type,
         body.application_no || null,
         body.status || null,
         body.filing_date,
         body.assignee || null,
         body.description || null,
         id,
       ]
     );
     return NextResponse.json({ success: true });
   } catch (error) {
     console.error("Error updating IP record:", error);
     return NextResponse.json(
       { success: false, message: "Failed to update IP record" },
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
     await query("DELETE FROM faculty_patents WHERE id = ?", [id]);
     return NextResponse.json({
       success: true,
       message: "IP record deleted successfully",
     });
   } catch (error) {
     console.error("Error deleting IP record:", error);
     return NextResponse.json(
       { success: false, message: "Failed to delete IP record" },
       { status: 500 }
     );
   }
 }
