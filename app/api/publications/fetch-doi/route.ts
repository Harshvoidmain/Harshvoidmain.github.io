import { NextRequest, NextResponse } from 'next/server';

/**
 * DOI Fetch API
 * Fetches publication metadata from CrossRef API using DOI
 */

interface CrossRefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

interface CrossRefWork {
  title?: string[];
  'container-title'?: string[];
  publisher?: string;
  published?: {
    'date-parts'?: number[][];
  };
  type?: string;
  volume?: string;
  issue?: string;
  page?: string;
  URL?: string;
  author?: CrossRefAuthor[];
  ISSN?: string[];
  ISBN?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { doi } = await request.json();

    if (!doi) {
      return NextResponse.json(
        { success: false, error: 'DOI is required' },
        { status: 400 }
      );
    }

    // Clean DOI (remove any URL prefix)
    const cleanDOI = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '').trim();

    // Fetch from CrossRef API
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'DOI not found' },
          { status: 404 }
        );
      }
      throw new Error(`CrossRef API error: ${response.statusText}`);
    }

    const data = await response.json();
    const work: CrossRefWork = data.message;

    // Determine category based on type
    let category = 'Journal';
    if (work.type) {
      const typeMap: Record<string, string> = {
        'journal-article': 'Journal',
        'proceedings-article': 'Conference',
        'conference-paper': 'Conference',
        'book-chapter': 'Book Chapter',
        'book': 'Book Chapter',
      };
      category = typeMap[work.type] || 'Journal';
    }

    // Extract authors
    const authors = work.author?.map((author: CrossRefAuthor) => {
      if (author.family && author.given) {
        return `${author.given} ${author.family}`;
      } else if (author.name) {
        return author.name;
      }
      return 'Unknown Author';
    }) || [];

    // Extract publication year
    let year = new Date().getFullYear();
    if (work.published?.['date-parts']?.[0]?.[0]) {
      year = work.published['date-parts'][0][0];
    }

    // Build response
    const metadata = {
      title: work.title?.[0] || '',
      category,
      authors,
      journalName: category === 'Journal' ? work['container-title']?.[0] || '' : '',
      conferenceName: category === 'Conference' ? work['container-title']?.[0] || '' : '',
      publisher: work.publisher || '',
      year,
      volume: work.volume || '',
      issue: work.issue || '',
      pages: work.page || '',
      url: work.URL || `https://doi.org/${cleanDOI}`,
      issn: work.ISSN?.[0] || '',
      isbn: work.ISBN?.[0] || '',
      doi: cleanDOI,
    };

    return NextResponse.json({
      success: true,
      data: metadata,
    });

  } catch (error) {
    console.error('DOI fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch DOI metadata' 
      },
      { status: 500 }
    );
  }
}
