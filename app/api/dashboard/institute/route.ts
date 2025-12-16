import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();

    // Get total publications across all departments
    const totalPublications = (await query(
      `SELECT COUNT(*) as count
       FROM faculty_publications`
    )) as RowDataPacket[];

    // Get category-wise breakup
    const categoryBreakup = (await query(
      `SELECT 
         publication_type as category,
         COUNT(*) as count
       FROM faculty_publications
       GROUP BY publication_type
       ORDER BY count DESC`
    )) as RowDataPacket[];

    // Get current year publications
    const currentYearPublications = (await query(
      `SELECT COUNT(*) as count
       FROM faculty_publications
       WHERE YEAR(publication_date) = ?`,
      [currentYear]
    )) as RowDataPacket[];

    // Get department-wise publication count
    const departmentBreakup = (await query(
      `SELECT 
         f.F_dept as department,
         COUNT(fp.id) as publicationCount
       FROM faculty f
       LEFT JOIN faculty_publications fp ON f.F_id = fp.faculty_id
       GROUP BY f.F_dept
       HAVING publicationCount > 0
       ORDER BY publicationCount DESC`
    )) as RowDataPacket[];

    // Get year-wise distribution (last 5 years)
    const yearDistribution = (await query(
      `SELECT 
         YEAR(publication_date) as year,
         COUNT(*) as count
       FROM faculty_publications
       WHERE publication_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
       GROUP BY YEAR(publication_date)
       ORDER BY year DESC`
    )) as RowDataPacket[];

    // Get top publishing faculty (top 10)
    const topFaculty = (await query(
      `SELECT 
         f.F_id as facultyId,
         f.F_name as facultyName,
         f.F_dept as department,
         COUNT(fp.id) as publicationCount
       FROM faculty f
       LEFT JOIN faculty_publications fp ON f.F_id = fp.faculty_id
       GROUP BY f.F_id, f.F_name, f.F_dept
       HAVING publicationCount > 0
       ORDER BY publicationCount DESC
       LIMIT 10`
    )) as RowDataPacket[];

    return NextResponse.json({
      success: true,
      data: {
        totalPublications: totalPublications[0]?.count || 0,
        currentYearPublications: currentYearPublications[0]?.count || 0,
        categoryBreakup: categoryBreakup.map((item) => ({
          category: item.category,
          count: item.count,
        })),
        departmentBreakup: departmentBreakup.map((item) => ({
          department: item.department,
          publicationCount: item.publicationCount,
        })),
        yearDistribution: yearDistribution.map((item) => ({
          year: item.year,
          count: item.count,
        })),
        topFaculty: topFaculty.map((item) => ({
          facultyId: item.facultyId,
          facultyName: item.facultyName,
          department: item.department,
          publicationCount: item.publicationCount,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching institute dashboard data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch institute dashboard data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

