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
       `UPDATE faculty_trainings SET 
         title = ?, 
         organization = ?, 
         start_date = ?, 
         end_date = ?, 
         category = ?, 
         description = ?
       WHERE id = ?`,
       [
         body.title,
         body.organization,
         body.start_date,
         body.end_date || null,
         body.category,
         body.description || null,
         id,
       ]
     );
     return NextResponse.json({ success: true });
   } catch (error) {
     console.error("Error updating training:", error);
     return NextResponse.json(
       { success: false, message: "Failed to update record" },
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
     await query("DELETE FROM faculty_trainings WHERE id = ?", [id]);
     return NextResponse.json({
       success: true,
       message: "Record deleted successfully",
     });
   } catch (error) {
     console.error("Error deleting training:", error);
     return NextResponse.json(
       { success: false, message: "Failed to delete record" },
       { status: 500 }
     );
   }
 }
