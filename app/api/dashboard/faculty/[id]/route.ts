import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const facultyId = parseInt(id, 10);

    if (isNaN(facultyId)) {
      return NextResponse.json(
        { success: false, message: "Invalid faculty ID" },
        { status: 400 }
      );
    }

    // Get current year
    const currentYear = new Date().getFullYear();

    // Get total publications
    const totalPublications = (await query(
      `SELECT COUNT(*) as count 
       FROM faculty_publications 
       WHERE faculty_id = ?`,
      [facultyId]
    )) as RowDataPacket[];

    // Get category-wise breakup
    const categoryBreakup = (await query(
      `SELECT 
         publication_type as category,
         COUNT(*) as count
       FROM faculty_publications
       WHERE faculty_id = ?
       GROUP BY publication_type
       ORDER BY count DESC`,
      [facultyId]
    )) as RowDataPacket[];

    // Get current year publications
    const currentYearPublications = (await query(
      `SELECT COUNT(*) as count
       FROM faculty_publications
       WHERE faculty_id = ? 
         AND YEAR(publication_date) = ?`,
      [facultyId, currentYear]
    )) as RowDataPacket[];

    // Get year-wise distribution (last 5 years)
    const yearDistribution = (await query(
      `SELECT 
         YEAR(publication_date) as year,
         COUNT(*) as count
       FROM faculty_publications
       WHERE faculty_id = ?
         AND publication_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
       GROUP BY YEAR(publication_date)
       ORDER BY year DESC`,
      [facultyId]
    )) as RowDataPacket[];

    // Get recent publications (last 5)
    const recentPublications = (await query(
      `SELECT 
         id,
         title,
         publication_type,
         publication_date,
         publication_venue,
         doi
       FROM faculty_publications
       WHERE faculty_id = ?
       ORDER BY publication_date DESC
       LIMIT 5`,
      [facultyId]
    )) as RowDataPacket[];

    return NextResponse.json({
      success: true,
      data: {
        facultyId,
        totalPublications: totalPublications[0]?.count || 0,
        currentYearPublications: currentYearPublications[0]?.count || 0,
        categoryBreakup: categoryBreakup.map((item) => ({
          category: item.category,
          count: item.count,
        })),
        yearDistribution: yearDistribution.map((item) => ({
          year: item.year,
          count: item.count,
        })),
        recentPublications: recentPublications.map((pub) => ({
          id: pub.id,
          title: pub.title,
          type: pub.publication_type,
          date: pub.publication_date,
          venue: pub.publication_venue,
          doi: pub.doi,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching faculty dashboard data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch faculty dashboard data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

