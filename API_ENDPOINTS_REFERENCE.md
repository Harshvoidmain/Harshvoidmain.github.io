# API Endpoints & Data Examples Reference

## API Endpoints Overview

### Base URL
```
http://localhost:3000/api/faculty/
```

### All Endpoints

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/faculty/publications` | GET | Fetch all publications for current faculty | Publication[] |
| `/api/faculty/research-projects` | GET | Fetch all research projects | ResearchProject[] |
| `/api/faculty/contributions` | GET | Fetch all contributions | Contribution[] |
| `/api/faculty/workshops` | GET | Fetch all workshops/seminars/conferences | Workshop[] |
| `/api/faculty/memberships` | GET | Fetch all professional memberships | Membership[] |
| `/api/faculty/awards` | GET | Fetch all awards and recognitions | AwardData[] |

---

## Detailed Endpoint Specifications

### 1. Publications Endpoint

**URL:** `/api/faculty/publications`  
**Method:** GET  
**Auth:** Required (uses current session user)

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "faculty_id": "12",
      "title": "Machine Learning in Healthcare",
      "abstract": "A comprehensive study of ML applications...",
      "authors": "John Doe, Jane Smith",
      "publication_date": "2024-08-15",
      "publication_type": "journal",
      "publication_venue": "IEEE Transactions on Machine Learning",
      "doi": "10.1109/TMLR.2024.1234567",
      "url": "https://example.com/paper",
      "citation_count": 12,
      "citations_crossref": 10,
      "citations_semantic_scholar": 12,
      "citations_google_scholar": 15,
      "citations_web_of_science": 8,
      "citations_last_updated": "2024-02-10T10:30:00Z"
    },
    {
      "id": 2,
      "faculty_id": "12",
      "title": "AI Ethics Framework",
      "abstract": "Modern approach to ethical AI...",
      "authors": "John Doe",
      "publication_date": "2024-02-20",
      "publication_type": "conference",
      "publication_venue": "AI Summit 2024",
      "doi": null,
      "url": "https://example.com/conference-paper",
      "citation_count": 5,
      "citations_crossref": null,
      "citations_semantic_scholar": 5,
      "citations_google_scholar": 7,
      "citations_web_of_science": null,
      "citations_last_updated": "2024-02-10T10:30:00Z"
    }
  ],
  "message": "Publications fetched successfully"
}
```

#### Data Fields Explanation
| Field | Type | Description | Chart Relevance |
|-------|------|-------------|-----------------|
| `publication_type` | string enum | journal, conference, book, book_chapter, other | **PRIMARY** - grouped for pie chart |
| `publication_date` | string (YYYY-MM-DD) | Date of publication | Used to determine session (current vs all) |
| Other fields | various | Additional metadata | Not used for charting |

#### Chart Processing
```typescript
// Grouped by publication_type, filtered by session
// Current Session: publications from Jun-May of current session
// All Sessions: all publications regardless of date

// Example: Feb 2025 publication → Session "2024-2025"
// Example: Aug 2024 publication → Session "2024-2025"
// Example: Jan 2024 publication → Session "2023-2024"

// Pie chart will show:
// - Journal Articles: 15
// - Conference Papers: 8
// - Book Chapters: 2
// - Other: 1
```

---

### 2. Research Projects Endpoint

**URL:** `/api/faculty/research-projects`  
**Method:** GET  
**Auth:** Required

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "faculty_id": "12",
      "title": "AI in Smart Cities",
      "description": "Development of AI systems for urban planning...",
      "start_date": "2024-06-01",
      "end_date": null,
      "status": "ongoing",
      "funding_agency": "Ministry of Science & Technology",
      "funding_amount": 500000
    },
    {
      "id": 2,
      "faculty_id": "12",
      "title": "IoT Security Framework",
      "description": "Research on securing IoT networks...",
      "start_date": "2023-01-15",
      "end_date": "2024-12-31",
      "status": "completed",
      "funding_agency": "National Research Foundation",
      "funding_amount": 300000
    },
    {
      "id": 3,
      "faculty_id": "12",
      "title": "Quantum Computing Applications",
      "description": "Exploring practical quantum computing uses...",
      "start_date": "2025",
      "end_date": null,
      "status": "planned",
      "funding_agency": null,
      "funding_amount": null
    }
  ],
  "message": "Research projects fetched successfully"
}
```

#### Data Fields Explanation
| Field | Type | Description | Chart Relevance |
|-------|------|-------------|-----------------|
| `status` | string enum | ongoing, completed, planned | **PRIMARY** - grouped for pie chart |
| `start_date` | string (YYYY-MM-DD or YYYY) | Project start date | Used to determine session |
| Other fields | various | Project details | Not used for charting |

#### Chart Processing
```typescript
// Grouped by status, filtered by session
// Handle date formats: "2024-06-01" or just "2024"

// Pie chart will show:
// - Ongoing: 3
// - Completed: 5
// - Planned: 1
```

---

### 3. Contributions Endpoint

**URL:** `/api/faculty/contributions`  
**Method:** GET  
**Auth:** Required

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "Contribution_ID": 1,
      "F_ID": 12,
      "Contribution_Type": "Curriculum Development",
      "Description": "Developed new course on AI Ethics",
      "Contribution_Date": "2024-08-10"
    },
    {
      "Contribution_ID": 2,
      "F_ID": 12,
      "Contribution_Type": "Guest Lecture",
      "Description": "Lecture on Machine Learning at XYZ University",
      "Contribution_Date": "2024-09-15"
    },
    {
      "Contribution_ID": 3,
      "F_ID": 12,
      "Contribution_Type": "Committee Work",
      "Description": "Chair of Academic Standards Committee",
      "Contribution_Date": "2024-06-01"
    },
    {
      "Contribution_ID": 4,
      "F_ID": 12,
      "Contribution_Type": "Community Service",
      "Description": "Tech mentorship for underprivileged youth",
      "Contribution_Date": "2024-11-20"
    }
  ],
  "message": "Contributions fetched successfully"
}
```

#### Data Fields Explanation
| Field | Type | Description | Chart Relevance |
|-------|------|-------------|-----------------|
| `Contribution_Type` | string | Type of contribution (mapped to categories) | **PRIMARY** - grouped after mapping |
| `Contribution_Date` | string (YYYY-MM-DD) | Date of contribution | Used to determine session |
| Other fields | various | Contribution details | Not used for charting |

#### Category Mapping
```typescript
// Contribution_Type → Category (case-insensitive)
{
  "curriculum development": "Academic Contributions",
  "educational material": "Academic Contributions",
  "guest lecture": "Academic Contributions",
  "mentorship": "Academic Contributions",
  "department service": "Administrative Service",
  "college service": "Administrative Service",
  "university service": "Administrative Service",
  "committee work": "Administrative Service",
  "professional service": "Professional/External Engagement",
  "community service": "Professional/External Engagement",
}
// Unmapped types → "Other"

// Pie chart will show:
// - Academic Contributions: 2
// - Administrative Service: 1
// - Professional/External Engagement: 1
```

---

### 4. Workshops Endpoint

**URL:** `/api/faculty/workshops`  
**Method:** GET  
**Auth:** Required

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "faculty_id": 12,
      "title": "Advanced Python Programming",
      "type": "workshop",
      "start_date": "2024-08-20"
    },
    {
      "id": 2,
      "faculty_id": 12,
      "title": "AI Ethics in Industry",
      "type": "seminar",
      "start_date": "2024-10-15"
    },
    {
      "id": 3,
      "faculty_id": 12,
      "title": "5th International ML Conference",
      "type": "conference",
      "start_date": "2024-12-01"
    },
    {
      "id": 4,
      "faculty_id": 12,
      "title": "Data Science Training Program",
      "type": "workshop",
      "start_date": "2025-01-10"
    }
  ],
  "message": "Workshops fetched successfully"
}
```

#### Data Fields Explanation
| Field | Type | Description | Chart Relevance |
|-------|------|-------------|-----------------|
| `type` | string enum | workshop, seminar, conference, other | **PRIMARY** - grouped for pie chart (lowercased) |
| `start_date` | string (YYYY-MM-DD) | Event start date | Used to determine session |
| Other fields | various | Event details | Not used for charting |

#### Chart Processing
```typescript
// Type is lowercased before grouping
// Grouped by type, filtered by session

// Pie chart will show:
// - Workshops: 2
// - Seminars: 1
// - Conferences: 1
```

---

### 5. Memberships Endpoint

**URL:** `/api/faculty/memberships`  
**Method:** GET  
**Auth:** Required

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "SrNo": 1,
      "F_ID": 12,
      "organization": "IEEE",
      "Membership_Type": "Senior Member",
      "Start_Date": "2020-05-15"
    },
    {
      "SrNo": 2,
      "F_ID": 12,
      "organization": "ACM",
      "Membership_Type": "Professional Member",
      "Start_Date": "2022-03-10"
    },
    {
      "SrNo": 3,
      "F_ID": 12,
      "organization": "National Academy of Sciences",
      "Membership_Type": "Fellow",
      "Start_Date": "2024-06-01"
    },
    {
      "SrNo": 4,
      "F_ID": 12,
      "organization": "Industry Association ABC",
      "Membership_Type": "Others",
      "Start_Date": "2023-11-20"
    }
  ],
  "message": "Memberships fetched successfully"
}
```

#### Data Fields Explanation
| Field | Type | Description | Chart Relevance |
|-------|------|-------------|-----------------|
| `Membership_Type` | string enum | senior member, professional member, fellow, others | **PRIMARY** - grouped for pie chart (lowercased) |
| `Start_Date` | string (YYYY-MM-DD) | Membership start date | Used to determine session |
| Other fields | various | Organization details | Not used for charting |

#### Chart Processing
```typescript
// Membership_Type is lowercased before grouping
// Grouped by membership type, filtered by session

// Pie chart will show:
// - Senior Member: 1
// - Professional Member: 1
// - Fellow: 1
// - Others: 1
```

---

### 6. Awards Endpoint

**URL:** `/api/faculty/awards`  
**Method:** GET  
**Auth:** Required

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "award_id": 1,
      "faculty_id": 12,
      "award_name": "Best Teacher Award",
      "organization": "University Administration",
      "category": "teaching",
      "date": "2024-10-30"
    },
    {
      "award_id": 2,
      "faculty_id": 12,
      "award_name": "Research Excellence Award",
      "organization": "National Science Foundation",
      "category": "research",
      "date": "2024-08-15"
    },
    {
      "award_id": 3,
      "faculty_id": 12,
      "award_name": "Community Service Award",
      "organization": "City Government",
      "category": "service",
      "date": "2024-02-20"
    },
    {
      "award_id": 4,
      "faculty_id": 12,
      "award_name": "Innovation Award",
      "organization": "Tech Community",
      "category": "other",
      "date": "2025-01-15"
    }
  ],
  "message": "Awards fetched successfully"
}
```

#### Data Fields Explanation
| Field | Type | Description | Chart Relevance |
|-------|------|-------------|-----------------|
| `category` | string enum | teaching, research, service, other | **PRIMARY** - grouped for pie chart (lowercased) |
| `date` | string (YYYY-MM-DD) | Award received date | Used to determine session |
| Other fields | various | Award details | Not used for charting |

#### Chart Processing
```typescript
// Category is lowercased before grouping
// Grouped by category, filtered by session

// Pie chart will show:
// - Teaching: 1
// - Research: 1
// - Service: 1
// - Other: 1
```

---

## Common API Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "data": null,
  "message": "Unauthorized: Please log in"
}
```
**Cause:** User not authenticated  
**Fix:** Ensure user is logged in

### 403 Forbidden
```json
{
  "success": false,
  "data": null,
  "message": "Forbidden: You do not have access to this resource"
}
```
**Cause:** User doesn't have permission  
**Fix:** Check user role/permissions

### 404 Not Found
```json
{
  "success": false,
  "data": null,
  "message": "Faculty member not found"
}
```
**Cause:** No data for this user  
**Fix:** User might have no entries for this module

### 500 Server Error
```json
{
  "success": false,
  "data": null,
  "message": "Internal server error"
}
```
**Cause:** Server-side issue  
**Fix:** Check server logs

---

## Testing with cURL

### Get Publications
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/faculty/publications
```

### Get Research Projects
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/faculty/research-projects
```

### Get Contributions
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/faculty/contributions
```

### Get Workshops
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/faculty/workshops
```

### Get Memberships
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/faculty/memberships
```

### Get Awards
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/faculty/awards
```

---

## Session-Based Filtering Logic

### How Sessions are Determined

```typescript
// Academic Session Calendar
// June1 - May 31 is ONE academic session

// Current Year: Any month
const now = new Date();
const month = now.getMonth() + 1; // 1-12
const year = now.getFullYear();

// If current month >= 6 (June or later in 2024)
// Session = 2024-2025

// If current month < 6 (Jan-May in 2025)  
// Session = 2024-2025 (still same academic year)

// Therefore:
// June 2024 → Session: 2024-2025 (CURRENT)
// August 2024 → Session: 2024-2025 (CURRENT)
// January 2025 → Session: 2024-2025 (CURRENT)
// May 2025 → Session: 2024-2025 (CURRENT)
// June 2025 → Session: 2025-2026 (NEW)
```

### Example Chart Split
```
Current Date: February 15, 2025
Current Session: 2024-2025

Publications:
├─ Current Session (2024-2025): Published Jun 2024 - Feb 2025
│  ├─ Journal Articles: 8
│  ├─ Conference Papers: 3
│  └─ Other: 1
│
└─ All Sessions (Cumulative): All published items ever
   ├─ Journal Articles: 25
   ├─ Conference Papers: 12
   ├─ Book Chapters: 3
   └─ Other: 2
```

---

## Data Validation Rules

### Required Fields Per Module

**Publications:**
- `id`, `faculty_id`, `publication_date`, `publication_type` (required)

**Research Projects:**
- `id`, `faculty_id`, `start_date`, `status` (required)
- Date can be "YYYY" or "YYYY-MM-DD"

**Contributions:**
- `Contribution_ID`, `Contribution_Date`, `Contribution_Type` (required)
- Uses capital C in field names

**Workshops:**
- `id`, `faculty_id`, `start_date`, `type` (required)

**Memberships:**
- `SrNo`, `F_ID`, `Start_Date`, `Membership_Type` (required)
- Uses capital letters for field names

**Awards:**
- `award_id`, `faculty_id`, `date`, `category` (required)

---

## Performance Notes

### Average Response Times
- Single module fetch: 50-150ms
- All 6 modules (parallel): 150-200ms
- Total page load: 200-400ms

### Data Limits
- No pagination implemented
- All records returned (may be large if faculty is prolific)
- Consider caching if data is large

### Optimization Tips
1. **Parallel fetching** (already implemented): Fetch all 6 simultaneously
2. **Caching**: Consider adding React Query or SWR
3. **Lazy loading**: Load charts only when visible
4. **Pagination**: Implement if faculty has 100+ items per module

---

## Additional Endpoints (Not Used in Pie Charts)

### Other Faculty Endpoints
- `/api/faculty/me` - Get current user faculty info
- `/api/faculty/{id}` - Get specific faculty info
- `/api/faculty/comprehensive-report` - Generate full report

---

## Questions About Endpoints?

If any endpoint returns unexpected data format:
1. Check the database schema
2. Verify data types match interface definitions
3. Check for null/undefined values
4. Log the raw response in browser console
5. Compare with sample responses in this document
