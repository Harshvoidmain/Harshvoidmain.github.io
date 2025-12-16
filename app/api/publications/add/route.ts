import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Add Publication API
 * Handles creation of new publications with co-authors
 */

interface CoAuthor {
  type: 'faculty' | 'student';
  id: number;
}

interface AddPublicationRequest {
  facultyId: number;
  doi?: string;
  title: string;
  category: 'Journal' | 'Conference' | 'Book Chapter';
  year: number;
  publisher?: string;
  journalName?: string;
  conferenceName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  issn?: string;
  isbn?: string;
  coAuthors?: CoAuthor[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AddPublicationRequest = await request.json();

    // Validate required fields
    if (!body.facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!body.year || body.year < 1900 || body.year > new Date().getFullYear() + 5) {
      return NextResponse.json(
        { success: false, error: 'Valid year is required' },
        { status: 400 }
      );
    }

    // Check for duplicate publications (same title and year)
    const duplicateCheck = await query(
      'SELECT id FROM publications WHERE title = ? AND year = ? AND status = 1',
      [body.title.trim(), body.year]
    ) as RowDataPacket[];

    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Publication with the same title and year already exists' },
        { status: 409 }
      );
    }

    // Insert publication
    const insertResult = await query(
      `INSERT INTO publications (
        title, category, doi, journal_name, conference_name,
        publisher, year, volume, issue, pages, url, issn, isbn, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        body.title.trim(),
        body.category,
        body.doi || null,
        body.journalName || null,
        body.conferenceName || null,
        body.publisher || null,
        body.year,
        body.volume || null,
        body.issue || null,
        body.pages || null,
        body.url || null,
        body.issn || null,
        body.isbn || null,
      ]
    ) as ResultSetHeader;

    const publicationId = insertResult.insertId;

    // Insert main author (faculty who submitted)
    await query(
      'INSERT INTO publication_authors (publication_id, author_id, author_type, author_order) VALUES (?, ?, ?, ?)',
      [publicationId, body.facultyId, 'faculty', 1]
    );

    // Insert co-authors
    if (body.coAuthors && body.coAuthors.length > 0) {
      let authorOrder = 2;
      for (const coAuthor of body.coAuthors) {
        // Check if co-author is not the same as main author
        if (!(coAuthor.type === 'faculty' && coAuthor.id === body.facultyId)) {
          try {
            await query(
              'INSERT INTO publication_authors (publication_id, author_id, author_type, author_order) VALUES (?, ?, ?, ?)',
              [publicationId, coAuthor.id, coAuthor.type, authorOrder]
            );
            authorOrder++;
          } catch (error: any) {
            // Handle duplicate constraint error (same author added twice)
            if (error.code !== 'ER_DUP_ENTRY') {
              throw error;
            }
          }
        }
      }
    }

    // Update faculty statistics
    await updateFacultyStats(body.facultyId, body.category);
    
    // Update co-authors' statistics
    if (body.coAuthors && body.coAuthors.length > 0) {
      for (const coAuthor of body.coAuthors) {
        if (coAuthor.type === 'faculty') {
          await updateFacultyStats(coAuthor.id, body.category);
        }
      }
    }

    return NextResponse.json({
      success: true,
      publicationId,
      message: 'Publication added successfully',
    });

  } catch (error) {
    console.error('Add publication error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add publication' 
      },
      { status: 500 }
    );
  }
}

/**
 * Update faculty statistics after adding a publication
 */
async function updateFacultyStats(facultyId: number, category: string) {
  try {
    // This is a placeholder - implement based on your stats table structure
    // You can either:
    // 1. Update a dedicated stats table
    // 2. Calculate on-the-fly when fetching dashboard data
    // 3. Use database triggers
    
    // For now, we'll leave this as a hook point for future implementation
    console.log(`Updating stats for faculty ${facultyId}, category: ${category}`);
  } catch (error) {
    console.error('Error updating faculty stats:', error);
    // Don't throw - stats update failure shouldn't block publication creation
  }
}

/**
 * GET endpoint to fetch publications for a faculty member
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const category = searchParams.get('category');
    const year = searchParams.get('year');

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    let sql = `
      SELECT DISTINCT
        p.id,
        p.title,
        p.category,
        p.doi,
        p.journal_name,
        p.conference_name,
        p.publisher,
        p.year,
        p.volume,
        p.issue,
        p.pages,
        p.url,
        p.issn,
        p.isbn,
        p.created_at
      FROM publications p
      JOIN publication_authors pa ON p.id = pa.publication_id
      WHERE pa.author_id = ? AND pa.author_type = 'faculty' AND p.status = 1
    `;
    
    const params: (string | number)[] = [parseInt(facultyId)];

    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (year) {
      sql += ' AND p.year = ?';
      params.push(parseInt(year));
    }

    sql += ' ORDER BY p.year DESC, p.created_at DESC';

    const publications = await query(sql, params) as RowDataPacket[];

    // Fetch co-authors for each publication
    for (const pub of publications) {
      const authors = await query(
        `SELECT author_id, author_type, author_order 
         FROM publication_authors 
         WHERE publication_id = ? 
         ORDER BY author_order`,
        [pub.id]
      ) as RowDataPacket[];
      
      pub.authors = authors;
    }

    return NextResponse.json({
      success: true,
      publications,
      count: publications.length,
    });

  } catch (error) {
    console.error('Fetch publications error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch publications' 
      },
      { status: 500 }
    );
  }
}
