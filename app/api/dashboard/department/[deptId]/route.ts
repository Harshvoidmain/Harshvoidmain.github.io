import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deptId: string }> }
) {
  try {
    const { deptId } = await params;
    const departmentId = parseInt(deptId, 10);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid department ID" },
        { status: 400 }
      );
    }

    // Get department name
    const deptData = (await query(
      `SELECT Department_Name FROM department WHERE Department_ID = ?`,
      [departmentId]
    )) as RowDataPacket[];

    if (!deptData || deptData.length === 0) {
      return NextResponse.json(
        { success: false, message: "Department not found" },
        { status: 404 }
      );
    }

    const departmentName = deptData[0].Department_Name;

    // Get current year
    const currentYear = new Date().getFullYear();

    // Get total publications for department
    const totalPublications = (await query(
      `SELECT COUNT(*) as count
       FROM faculty_publications fp
       JOIN faculty f ON fp.faculty_id = f.F_id
       WHERE f.F_dept = ?`,
      [departmentName]
    )) as RowDataPacket[];

    // Get category-wise breakup
    const categoryBreakup = (await query(
      `SELECT 
         fp.publication_type as category,
         COUNT(*) as count
       FROM faculty_publications fp
       JOIN faculty f ON fp.faculty_id = f.F_id
       WHERE f.F_dept = ?
       GROUP BY fp.publication_type
       ORDER BY count DESC`,
      [departmentName]
    )) as RowDataPacket[];

    // Get current year publications
    const currentYearPublications = (await query(
      `SELECT COUNT(*) as count
       FROM faculty_publications fp
       JOIN faculty f ON fp.faculty_id = f.F_id
       WHERE f.F_dept = ?
         AND YEAR(fp.publication_date) = ?`,
      [departmentName, currentYear]
    )) as RowDataPacket[];

    // Get faculty-wise publication count
    const facultyBreakup = (await query(
      `SELECT 
         f.F_id as facultyId,
         f.F_name as facultyName,
         COUNT(fp.id) as publicationCount
       FROM faculty f
       LEFT JOIN faculty_publications fp ON f.F_id = fp.faculty_id
       WHERE f.F_dept = ?
       GROUP BY f.F_id, f.F_name
       HAVING publicationCount > 0
       ORDER BY publicationCount DESC
       LIMIT 10`,
      [departmentName]
    )) as RowDataPacket[];

    // Get year-wise distribution (last 5 years)
    const yearDistribution = (await query(
      `SELECT 
         YEAR(fp.publication_date) as year,
         COUNT(*) as count
       FROM faculty_publications fp
       JOIN faculty f ON fp.faculty_id = f.F_id
       WHERE f.F_dept = ?
         AND fp.publication_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
       GROUP BY YEAR(fp.publication_date)
       ORDER BY year DESC`,
      [departmentName]
    )) as RowDataPacket[];

    return NextResponse.json({
      success: true,
      data: {
        departmentId,
        departmentName,
        totalPublications: totalPublications[0]?.count || 0,
        currentYearPublications: currentYearPublications[0]?.count || 0,
        categoryBreakup: categoryBreakup.map((item) => ({
          category: item.category,
          count: item.count,
        })),
        facultyBreakup: facultyBreakup.map((item) => ({
          facultyId: item.facultyId,
          facultyName: item.facultyName,
          publicationCount: item.publicationCount,
        })),
        yearDistribution: yearDistribution.map((item) => ({
          year: item.year,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching department dashboard data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch department dashboard data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

