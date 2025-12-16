import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { ResultSetHeader } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * File Upload API for Publications
 * Handles PDF upload with auto-renaming
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'publications');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const facultyId = formData.get('facultyId') as string;
    const publicationId = formData.get('publicationId') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    if (!publicationId) {
      return NextResponse.json(
        { success: false, error: 'Publication ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate new filename: FP-{FACULTYID}-{YYYYMMDD}-{HHMMSS}.pdf
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    const newFileName = `FP-${facultyId}-${dateStr}-${timeStr}.pdf`;

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Save file to disk
    const filePath = path.join(UPLOAD_DIR, newFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store file metadata in database
    const relativePath = `/uploads/publications/${newFileName}`;
    const insertResult = await query(
      `INSERT INTO files_uploaded (
        file_name, original_name, file_path, file_type, file_size,
        uploaded_by, entity_type, entity_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newFileName,
        file.name,
        relativePath,
        'pdf',
        file.size,
        parseInt(facultyId),
        'publication',
        parseInt(publicationId),
      ]
    ) as ResultSetHeader;

    return NextResponse.json({
      success: true,
      fileId: insertResult.insertId,
      fileName: newFileName,
      filePath: relativePath,
      fileSize: file.size,
      message: 'File uploaded successfully',
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch files for a publication
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicationId = searchParams.get('publicationId');

    if (!publicationId) {
      return NextResponse.json(
        { success: false, error: 'Publication ID is required' },
        { status: 400 }
      );
    }

    const files = await query(
      `SELECT 
        id, file_name, original_name, file_path, file_type, 
        file_size, uploaded_by, uploaded_at
      FROM files_uploaded 
      WHERE entity_type = 'publication' AND entity_id = ?
      ORDER BY uploaded_at DESC`,
      [parseInt(publicationId)]
    );

    return NextResponse.json({
      success: true,
      files,
    });

  } catch (error) {
    console.error('Fetch files error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch files' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to remove a file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Delete from database (file remains on disk for archival purposes)
    await query(
      'DELETE FROM files_uploaded WHERE id = ?',
      [parseInt(fileId)]
    );

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      },
      { status: 500 }
    );
  }
}
