import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get("facultyId");
    const departmentId = searchParams.get("departmentId");
    const year = searchParams.get("year");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    let sql = `
      SELECT 
        fp.id,
        fp.title,
        fp.authors,
        fp.publication_date,
        fp.publication_type,
        fp.publication_venue,
        fp.doi,
        fp.url,
        fp.citation_count,
        f.F_id as faculty_id,
        f.F_name as faculty_name,
        f.F_dept as department
      FROM faculty_publications fp
      JOIN faculty f ON fp.faculty_id = f.F_id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Apply filters
    if (facultyId && facultyId !== "all") {
      sql += " AND fp.faculty_id = ?";
      params.push(parseInt(facultyId, 10));
    }

    if (departmentId && departmentId !== "all") {
      // Get department name from ID
      const deptData = (await query(
        `SELECT Department_Name FROM department WHERE Department_ID = ?`,
        [parseInt(departmentId, 10)]
      )) as RowDataPacket[];

      if (deptData && deptData.length > 0) {
        sql += " AND f.F_dept = ?";
        params.push(deptData[0].Department_Name);
      }
    }

    if (year && year !== "all") {
      sql += " AND YEAR(fp.publication_date) = ?";
      params.push(parseInt(year, 10));
    }

    if (category && category !== "all") {
      sql += " AND fp.publication_type = ?";
      params.push(category);
    }

    if (startDate) {
      sql += " AND fp.publication_date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND fp.publication_date <= ?";
      params.push(endDate);
    }

    sql += " ORDER BY fp.publication_date DESC";

    const publications = (await query(sql, params)) as RowDataPacket[];

    // Get summary statistics - build base WHERE clause
    let whereClause = "WHERE 1=1";
    const summaryParams: any[] = [];

    // Apply same filters for summary
    if (facultyId && facultyId !== "all") {
      whereClause += " AND fp.faculty_id = ?";
      summaryParams.push(parseInt(facultyId, 10));
    }

    if (departmentId && departmentId !== "all") {
      const deptData = (await query(
        `SELECT Department_Name FROM department WHERE Department_ID = ?`,
        [parseInt(departmentId, 10)]
      )) as RowDataPacket[];

      if (deptData && deptData.length > 0) {
        whereClause += " AND f.F_dept = ?";
        summaryParams.push(deptData[0].Department_Name);
      }
    }

    if (year && year !== "all") {
      whereClause += " AND YEAR(fp.publication_date) = ?";
      summaryParams.push(parseInt(year, 10));
    }

    if (category && category !== "all") {
      whereClause += " AND fp.publication_type = ?";
      summaryParams.push(category);
    }

    if (startDate) {
      whereClause += " AND fp.publication_date >= ?";
      summaryParams.push(startDate);
    }

    if (endDate) {
      whereClause += " AND fp.publication_date <= ?";
      summaryParams.push(endDate);
    }

    // Get total count
    const totalResult = (await query(
      `SELECT COUNT(*) as total
       FROM faculty_publications fp
       JOIN faculty f ON fp.faculty_id = f.F_id
       ${whereClause}`,
      summaryParams
    )) as RowDataPacket[];

    // Get category breakdown
    const categoryBreakdown = (await query(
      `SELECT 
         fp.publication_type as category,
         COUNT(*) as count
       FROM faculty_publications fp
       JOIN faculty f ON fp.faculty_id = f.F_id
       ${whereClause}
       GROUP BY fp.publication_type`,
      summaryParams
    )) as RowDataPacket[];

    return NextResponse.json({
      success: true,
      data: {
        publications: publications.map((pub) => ({
          id: pub.id,
          title: pub.title,
          authors: pub.authors,
          publicationDate: pub.publication_date,
          publicationType: pub.publication_type,
          publicationVenue: pub.publication_venue,
          doi: pub.doi,
          url: pub.url,
          citationCount: pub.citation_count,
          facultyId: pub.faculty_id,
          facultyName: pub.faculty_name,
          department: pub.department,
        })),
        summary: {
          total: totalResult[0]?.total || 0,
          categoryBreakdown: categoryBreakdown.map((item) => ({
            category: item.category || item.categoryCount,
            count: item.count || item.categoryCount,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching publications report:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch publications report",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

