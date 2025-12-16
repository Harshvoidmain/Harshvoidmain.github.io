import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { RowDataPacket, OkPacket } from "mysql2";

/**
 * Debug endpoint to seed dummy publications data for testing reports and dashboards
 * This will add publications across multiple faculty members and departments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clearFirst = searchParams.get("clear") === "true";
    const forceInsert = searchParams.get("force") === "true";

    // Option to clear all existing publications first
    if (clearFirst) {
      await query(`DELETE FROM faculty_publications`);
      console.log("Cleared all existing publications");
    }
    // Ensure table exists first
    await query(`CREATE TABLE IF NOT EXISTS faculty_publications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id BIGINT NOT NULL,
      title VARCHAR(500) NOT NULL,
      abstract TEXT,
      authors VARCHAR(500) NOT NULL,
      publication_date DATE NOT NULL,
      publication_type ENUM('journal', 'conference', 'book', 'book_chapter', 'other') NOT NULL,
      publication_venue VARCHAR(500) NOT NULL,
      doi VARCHAR(100),
      url VARCHAR(1000),
      citation_count INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (faculty_id)
    )`);

    // Get all faculty members
    const facultyMembers = (await query(
      `SELECT F_id, F_name, F_dept FROM faculty LIMIT 20`
    )) as RowDataPacket[];

    if (!facultyMembers || facultyMembers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No faculty members found. Please add faculty first.",
      });
    }

    console.log(`Found ${facultyMembers.length} faculty members to seed publications for`);

    // Dummy publications data
    const dummyPublications = [
      // Journal publications
      {
        title: "Machine Learning Applications in Computer Vision",
        authors: "Dr. John Smith, Dr. Jane Doe",
        publication_type: "journal",
        publication_venue: "IEEE Transactions on Pattern Analysis",
        publication_date: "2024-03-15",
        doi: "10.1109/TPAMI.2024.1234567",
        abstract: "This paper explores advanced machine learning techniques...",
      },
      {
        title: "Deep Neural Networks for Natural Language Processing",
        authors: "Dr. Alice Johnson, Dr. Bob Williams",
        publication_type: "journal",
        publication_venue: "ACM Transactions on Computational Linguistics",
        publication_date: "2024-01-20",
        doi: "10.1145/1234567.8901234",
        abstract: "We present a novel approach to NLP using deep learning...",
      },
      {
        title: "IoT Security: Challenges and Solutions",
        authors: "Dr. Charlie Brown, Dr. Diana Prince",
        publication_type: "journal",
        publication_venue: "IEEE Internet of Things Journal",
        publication_date: "2023-11-10",
        doi: "10.1109/JIOT.2023.9876543",
        abstract: "This study addresses security concerns in IoT ecosystems...",
      },
      {
        title: "Blockchain Technology in Supply Chain Management",
        authors: "Dr. Edward Norton, Dr. Fiona Apple",
        publication_type: "journal",
        publication_venue: "Journal of Information Systems",
        publication_date: "2023-09-05",
        doi: "10.1016/j.jis.2023.4567890",
        abstract: "We investigate blockchain applications in supply chains...",
      },
      {
        title: "Cloud Computing Architecture for Enterprise Applications",
        authors: "Dr. George Lucas, Dr. Helen Mirren",
        publication_type: "journal",
        publication_venue: "ACM Computing Surveys",
        publication_date: "2023-07-18",
        doi: "10.1145/9876543.2109876",
        abstract: "This paper presents a scalable cloud architecture...",
      },
      // Conference publications
      {
        title: "Real-time Data Processing with Apache Kafka",
        authors: "Dr. Ian Fleming, Dr. Julia Roberts",
        publication_type: "conference",
        publication_venue: "IEEE International Conference on Big Data",
        publication_date: "2024-05-12",
        doi: "10.1109/BigData.2024.1112222",
        abstract: "We demonstrate real-time data processing capabilities...",
      },
      {
        title: "Microservices Architecture: Best Practices",
        authors: "Dr. Kevin Spacey, Dr. Laura Linney",
        publication_type: "conference",
        publication_venue: "ACM SIGSOFT Conference on Software Engineering",
        publication_date: "2024-04-22",
        doi: "10.1145/3333333.4444444",
        abstract: "This work presents best practices for microservices...",
      },
      {
        title: "Cybersecurity in Healthcare Systems",
        authors: "Dr. Michael Jordan, Dr. Nancy Drew",
        publication_type: "conference",
        publication_venue: "International Conference on Healthcare Informatics",
        publication_date: "2023-12-08",
        doi: "10.1109/ICHI.2023.5555555",
        abstract: "We analyze cybersecurity threats in healthcare...",
      },
      {
        title: "Edge Computing for Smart Cities",
        authors: "Dr. Oliver Twist, Dr. Patricia Highsmith",
        publication_type: "conference",
        publication_venue: "IEEE Smart Cities Conference",
        publication_date: "2023-10-30",
        doi: "10.1109/SmartCity.2023.6666666",
        abstract: "This paper explores edge computing applications...",
      },
      {
        title: "Quantum Computing Algorithms",
        authors: "Dr. Quentin Tarantino, Dr. Rachel Green",
        publication_type: "conference",
        publication_venue: "ACM Conference on Quantum Computing",
        publication_date: "2023-08-14",
        doi: "10.1145/7777777.8888888",
        abstract: "We present new quantum computing algorithms...",
      },
      // Book chapters
      {
        title: "Introduction to Machine Learning",
        authors: "Dr. Samuel Jackson, Dr. Tina Turner",
        publication_type: "book_chapter",
        publication_venue: "Handbook of Artificial Intelligence",
        publication_date: "2024-02-28",
        doi: "10.1007/978-3-123-45678-9_5",
        abstract: "This chapter provides an introduction to ML concepts...",
      },
      {
        title: "Database Design Principles",
        authors: "Dr. Uma Thurman, Dr. Victor Hugo",
        publication_type: "book_chapter",
        publication_venue: "Modern Database Systems",
        publication_date: "2023-06-25",
        doi: "10.1007/978-3-987-65432-1_3",
        abstract: "We discuss fundamental database design principles...",
      },
      {
        title: "Software Testing Methodologies",
        authors: "Dr. William Shakespeare, Dr. Xena Warrior",
        publication_type: "book_chapter",
        publication_venue: "Software Engineering Handbook",
        publication_date: "2023-05-10",
        doi: "10.1007/978-3-111-22233-4_7",
        abstract: "This chapter covers various testing methodologies...",
      },
      // Books
      {
        title: "Advanced Algorithms and Data Structures",
        authors: "Dr. Yoda Master, Dr. Zara Phillips",
        publication_type: "book",
        publication_venue: "Academic Press",
        publication_date: "2024-01-15",
        doi: "10.1016/B978-0-12-345678-9.00001-2",
        abstract: "Comprehensive guide to advanced algorithms...",
      },
      {
        title: "Distributed Systems: Theory and Practice",
        authors: "Dr. Alan Turing, Dr. Ada Lovelace",
        publication_type: "book",
        publication_venue: "MIT Press",
        publication_date: "2023-04-20",
        doi: "10.7551/mitpress/9999.001.0001",
        abstract: "In-depth analysis of distributed systems...",
      },
      // Other
      {
        title: "Open Source Contributions to Linux Kernel",
        authors: "Dr. Linus Torvalds, Dr. Richard Stallman",
        publication_type: "other",
        publication_venue: "Linux Foundation",
        publication_date: "2023-11-25",
        doi: null,
        abstract: "Documentation of open source contributions...",
      },
    ];

    const insertedPublications: any[] = [];
    const errors: any[] = [];

    // Distribute publications across faculty members
    for (let i = 0; i < dummyPublications.length; i++) {
      const pub = dummyPublications[i];
      const faculty = facultyMembers[i % facultyMembers.length];

      try {
        // Convert faculty_id to number if it's a string
        const facultyId = typeof faculty.F_id === 'string' ? parseInt(faculty.F_id, 10) : faculty.F_id;
        
        // Check if publication already exists (by title and faculty)
        if (!forceInsert) {
          const existing = (await query(
            `SELECT id FROM faculty_publications 
             WHERE title = ? AND faculty_id = ?`,
            [pub.title, facultyId]
          )) as RowDataPacket[];

          if (existing && existing.length > 0) {
            console.log(`Skipping duplicate: ${pub.title} for faculty ${facultyId}`);
            continue; // Skip if already exists
          }
        }
        
        const result = (await query(
          `INSERT INTO faculty_publications 
           (faculty_id, title, abstract, authors, publication_date, 
            publication_type, publication_venue, doi, citation_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            facultyId,
            pub.title,
            pub.abstract,
            pub.authors,
            pub.publication_date,
            pub.publication_type,
            pub.publication_venue,
            pub.doi,
            Math.floor(Math.random() * 100), // Random citation count 0-99
          ]
        )) as ResultSetHeader;

        insertedPublications.push({
          id: result.insertId,
          faculty: faculty.F_name,
          facultyId: faculty.F_id,
          department: faculty.F_dept,
          title: pub.title,
          type: pub.publication_type,
        });
        
        console.log(`Inserted: ${pub.title} for ${faculty.F_name} (${faculty.F_id})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error inserting ${pub.title} for ${faculty.F_name}:`, errorMsg);
        errors.push({
          faculty: faculty.F_name,
          facultyId: faculty.F_id,
          title: pub.title,
          error: errorMsg,
        });
      }
    }

    // Also add some publications from previous years for better dashboard visualization
    const previousYearPubs = [
      {
        title: "Mobile Application Development Trends",
        authors: "Dr. Steve Jobs, Dr. Bill Gates",
        publication_type: "journal",
        publication_venue: "Mobile Computing Journal",
        publication_date: "2022-12-10",
        doi: "10.1234/mobile.2022.123456",
      },
      {
        title: "Web Development Frameworks Comparison",
        authors: "Dr. Tim Berners-Lee, Dr. Marc Andreessen",
        publication_type: "conference",
        publication_venue: "World Wide Web Conference",
        publication_date: "2022-08-15",
        doi: "10.1145/www.2022.789012",
      },
      {
        title: "Data Science in Business Analytics",
        authors: "Dr. Jeff Bezos, Dr. Elon Musk",
        publication_type: "journal",
        publication_venue: "Harvard Business Review",
        publication_date: "2021-11-20",
        doi: "10.1016/hbr.2021.345678",
      },
    ];

    for (let i = 0; i < previousYearPubs.length; i++) {
      const pub = previousYearPubs[i];
      const faculty = facultyMembers[i % facultyMembers.length];

      try {
        const existing = (await query(
          `SELECT id FROM faculty_publications 
           WHERE title = ? AND faculty_id = ?`,
          [pub.title, faculty.F_id]
        )) as RowDataPacket[];

        if (!forceInsert) {
          const existing = (await query(
            `SELECT id FROM faculty_publications 
             WHERE title = ? AND faculty_id = ?`,
            [pub.title, facultyId]
          )) as RowDataPacket[];

          if (existing && existing.length > 0) {
            console.log(`Skipping duplicate previous year: ${pub.title}`);
            continue;
          }
        }

        // Convert faculty_id to number if it's a string
        const facultyId = typeof faculty.F_id === 'string' ? parseInt(faculty.F_id, 10) : faculty.F_id;
        
        const result = (await query(
          `INSERT INTO faculty_publications 
           (faculty_id, title, authors, publication_date, 
            publication_type, publication_venue, doi, citation_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            facultyId,
            pub.title,
            pub.authors,
            pub.publication_date,
            pub.publication_type,
            pub.publication_venue,
            pub.doi,
            Math.floor(Math.random() * 150) + 50, // Higher citations for older papers
          ]
        )) as ResultSetHeader;

        insertedPublications.push({
          id: result.insertId,
          faculty: faculty.F_name,
          facultyId: faculty.F_id,
          department: faculty.F_dept,
          title: pub.title,
          type: pub.publication_type,
        });
        
        console.log(`Inserted previous year: ${pub.title} for ${faculty.F_name}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error inserting previous year ${pub.title}:`, errorMsg);
        errors.push({
          faculty: faculty.F_name,
          facultyId: faculty.F_id,
          title: pub.title,
          error: errorMsg,
        });
      }
    }

    const totalAttempted = dummyPublications.length + previousYearPubs.length;
    const skipped = totalAttempted - insertedPublications.length - errors.length;

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedPublications.length} publications`,
      inserted: insertedPublications,
      errors: errors.length > 0 ? errors : undefined,
      totalFaculty: facultyMembers.length,
      attempted: totalAttempted,
      skipped: skipped,
      cleared: clearFirst,
      forceInsert: forceInsert,
      debug: {
        facultySample: facultyMembers.slice(0, 3).map(f => ({ id: f.F_id, name: f.F_name, dept: f.F_dept })),
        note: skipped > 0 ? "Publications already exist. Use ?clear=true to clear first, or ?force=true to insert anyway." : undefined,
      },
    });
  } catch (error) {
    console.error("Error seeding publications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed publications",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

