import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * Publications Statistics API
 * Provides aggregated statistics for faculty, department, and institute levels
 */

/**
 * GET /api/publications/stats?type=faculty&id=103
 * GET /api/publications/stats?type=department&id=5
 * GET /api/publications/stats?type=institute
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // faculty, department, institute
    const id = searchParams.get('id');

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    let stats;

    switch (type) {
      case 'faculty':
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Faculty ID is required' },
            { status: 400 }
          );
        }
        stats = await getFacultyStats(parseInt(id));
        break;

      case 'department':
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Department ID is required' },
            { status: 400 }
          );
        }
        stats = await getDepartmentStats(parseInt(id));
        break;

      case 'institute':
        stats = await getInstituteStats();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch statistics' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get publication statistics for a faculty member
 */
async function getFacultyStats(facultyId: number) {
  // Total publications
  const totalResult = await query(
    `SELECT COUNT(DISTINCT p.id) as count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     WHERE pa.author_id = ? AND pa.author_type = 'faculty' AND p.status = 1`,
    [facultyId]
  ) as RowDataPacket[];

  const total = totalResult[0]?.count || 0;

  // Category breakdown
  const categoryResult = await query(
    `SELECT p.category, COUNT(DISTINCT p.id) as count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     WHERE pa.author_id = ? AND pa.author_type = 'faculty' AND p.status = 1
     GROUP BY p.category`,
    [facultyId]
  ) as RowDataPacket[];

  const categories = {
    Journal: 0,
    Conference: 0,
    'Book Chapter': 0,
  };

  categoryResult.forEach((row) => {
    categories[row.category as keyof typeof categories] = row.count;
  });

  // Current year publications
  const currentYear = new Date().getFullYear();
  const currentYearResult = await query(
    `SELECT COUNT(DISTINCT p.id) as count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     WHERE pa.author_id = ? AND pa.author_type = 'faculty' 
     AND p.status = 1 AND p.year = ?`,
    [facultyId, currentYear]
  ) as RowDataPacket[];

  const currentYearCount = currentYearResult[0]?.count || 0;

  // Year-wise breakdown (last 5 years)
  const yearResult = await query(
    `SELECT p.year, COUNT(DISTINCT p.id) as count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     WHERE pa.author_id = ? AND pa.author_type = 'faculty' 
     AND p.status = 1 AND p.year >= ?
     GROUP BY p.year
     ORDER BY p.year DESC`,
    [facultyId, currentYear - 4]
  ) as RowDataPacket[];

  return {
    total,
    categories,
    currentYear: currentYearCount,
    yearWise: yearResult,
    pieData: [
      { name: 'Journal', value: categories.Journal },
      { name: 'Conference', value: categories.Conference },
      { name: 'Book Chapter', value: categories['Book Chapter'] },
    ],
  };
}

/**
 * Get publication statistics for a department
 */
async function getDepartmentStats(departmentId: number) {
  // Total publications for all faculty in department
  const totalResult = await query(
    `SELECT COUNT(DISTINCT p.id) as count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     JOIN faculty f ON pa.author_id = f.id
     WHERE pa.author_type = 'faculty' AND f.department_id = ? AND p.status = 1`,
    [departmentId]
  ) as RowDataPacket[];

  const total = totalResult[0]?.count || 0;

  // Category breakdown
  const categoryResult = await query(
    `SELECT p.category, COUNT(DISTINCT p.id) as count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     JOIN faculty f ON pa.author_id = f.id
     WHERE pa.author_type = 'faculty' AND f.department_id = ? AND p.status = 1
     GROUP BY p.category`,
    [departmentId]
  ) as RowDataPacket[];

  const categories = {
    Journal: 0,
    Conference: 0,
    'Book Chapter': 0,
  };

  categoryResult.forEach((row) => {
    categories[row.category as keyof typeof categories] = row.count;
  });

  // Current year publications
  const currentYear = new Date().getFullYear();
  const currentYearResult = await query(
    `SELECT COUNT(DISTINCT p.id) as count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     JOIN faculty f ON pa.author_id = f.id
     WHERE pa.author_type = 'faculty' AND f.department_id = ? 
     AND p.status = 1 AND p.year = ?`,
    [departmentId, currentYear]
  ) as RowDataPacket[];

  const currentYearCount = currentYearResult[0]?.count || 0;

  // Top contributing faculty
  const topFacultyResult = await query(
    `SELECT 
       f.id, f.name, COUNT(DISTINCT p.id) as publication_count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     JOIN faculty f ON pa.author_id = f.id
     WHERE pa.author_type = 'faculty' AND f.department_id = ? AND p.status = 1
     GROUP BY f.id, f.name
     ORDER BY publication_count DESC
     LIMIT 10`,
    [departmentId]
  ) as RowDataPacket[];

  return {
    total,
    categories,
    currentYear: currentYearCount,
    topFaculty: topFacultyResult,
    pieData: [
      { name: 'Journal', value: categories.Journal },
      { name: 'Conference', value: categories.Conference },
      { name: 'Book Chapter', value: categories['Book Chapter'] },
    ],
  };
}

/**
 * Get publication statistics for entire institute
 */
async function getInstituteStats() {
  // Total publications
  const totalResult = await query(
    `SELECT COUNT(DISTINCT id) as count
     FROM publications
     WHERE status = 1`,
    []
  ) as RowDataPacket[];

  const total = totalResult[0]?.count || 0;

  // Category breakdown
  const categoryResult = await query(
    `SELECT category, COUNT(DISTINCT id) as count
     FROM publications
     WHERE status = 1
     GROUP BY category`,
    []
  ) as RowDataPacket[];

  const categories = {
    Journal: 0,
    Conference: 0,
    'Book Chapter': 0,
  };

  categoryResult.forEach((row) => {
    categories[row.category as keyof typeof categories] = row.count;
  });

  // Current year publications
  const currentYear = new Date().getFullYear();
  const currentYearResult = await query(
    `SELECT COUNT(DISTINCT id) as count
     FROM publications
     WHERE status = 1 AND year = ?`,
    [currentYear]
  ) as RowDataPacket[];

  const currentYearCount = currentYearResult[0]?.count || 0;

  // Department-wise breakdown
  const deptResult = await query(
    `SELECT 
       d.id, d.name, COUNT(DISTINCT p.id) as publication_count
     FROM publications p
     JOIN publication_authors pa ON p.id = pa.publication_id
     JOIN faculty f ON pa.author_id = f.id
     JOIN departments d ON f.department_id = d.id
     WHERE pa.author_type = 'faculty' AND p.status = 1
     GROUP BY d.id, d.name
     ORDER BY publication_count DESC`,
    []
  ) as RowDataPacket[];

  return {
    total,
    categories,
    currentYear: currentYearCount,
    byDepartment: deptResult,
    pieData: [
      { name: 'Journal', value: categories.Journal },
      { name: 'Conference', value: categories.Conference },
      { name: 'Book Chapter', value: categories['Book Chapter'] },
    ],
  };
}
