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
       `UPDATE faculty_financial_support SET 
         scheme_name = ?, 
         sponsor = ?, 
         amount = ?, 
         date = ?, 
         purpose = ?, 
         project_ref = ?
       WHERE id = ?`,
       [
         body.scheme_name,
         body.sponsor,
         Number(body.amount),
         body.date,
         body.purpose || null,
         body.project_ref || null,
         id,
       ]
     );
     return NextResponse.json({ success: true });
   } catch (error) {
     console.error("Error updating financial support:", error);
     return NextResponse.json(
       { success: false, message: "Failed to update support record" },
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
     await query("DELETE FROM faculty_financial_support WHERE id = ?", [id]);
     return NextResponse.json({
       success: true,
       message: "Support record deleted successfully",
     });
   } catch (error) {
     console.error("Error deleting support record:", error);
     return NextResponse.json(
       { success: false, message: "Failed to delete support record" },
       { status: 500 }
     );
   }
 }
