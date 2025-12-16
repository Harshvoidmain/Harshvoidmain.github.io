-- Publications System Database Schema
-- Created for IMS Publications Module

-- Table: publications
-- Stores all publication records (journals, conferences, book chapters)
CREATE TABLE IF NOT EXISTS publications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  category ENUM('Journal', 'Conference', 'Book Chapter') NOT NULL,
  doi VARCHAR(200),
  journal_name VARCHAR(300),
  conference_name VARCHAR(300),
  publisher VARCHAR(200),
  year INT NOT NULL,
  volume VARCHAR(50),
  issue VARCHAR(50),
  pages VARCHAR(50),
  url VARCHAR(500),
  isbn VARCHAR(50),
  issn VARCHAR(50),
  status TINYINT DEFAULT 1 COMMENT '1 = active, 0 = soft deleted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_year (year),
  INDEX idx_status (status),
  INDEX idx_doi (doi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: publication_authors
-- Join table linking publications with faculty and students (co-authors)
CREATE TABLE IF NOT EXISTS publication_authors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  publication_id INT NOT NULL,
  author_id INT NOT NULL COMMENT 'Faculty ID or Student ID',
  author_type ENUM('faculty', 'student') NOT NULL,
  author_order INT DEFAULT 0 COMMENT 'Order of authorship (1st author, 2nd, etc.)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE,
  INDEX idx_publication (publication_id),
  INDEX idx_author (author_id, author_type),
  UNIQUE KEY unique_author_publication (publication_id, author_id, author_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: files_uploaded
-- Stores metadata for uploaded publication files (PDFs, etc.)
CREATE TABLE IF NOT EXISTS files_uploaded (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL COMMENT 'Auto-generated filename (e.g., FP-103-20241215-142355.pdf)',
  original_name VARCHAR(255) COMMENT 'Original filename uploaded by user',
  file_path VARCHAR(500) NOT NULL COMMENT 'Relative path to file storage',
  file_type VARCHAR(50) DEFAULT 'pdf',
  file_size INT COMMENT 'File size in bytes',
  uploaded_by INT NOT NULL COMMENT 'Faculty ID who uploaded',
  entity_type VARCHAR(50) NOT NULL COMMENT 'Type of entity (publication, research, etc.)',
  entity_id INT NOT NULL COMMENT 'ID of the related entity',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add indexes for performance
-- Already added inline above

-- Sample query to get publication count by category for a faculty member
-- SELECT category, COUNT(*) as count 
-- FROM publications p
-- JOIN publication_authors pa ON p.id = pa.publication_id
-- WHERE pa.author_id = ? AND pa.author_type = 'faculty' AND p.status = 1
-- GROUP BY category;
