# Publications API - Browser Testing Guide

## 🌐 Quick Browser Tests

Your server is running. Open your browser and test these URLs:

### 1. Test Statistics API (should work immediately)
```
http://localhost:3001/api/publications/stats?type=faculty&id=103
```
**Expected:** JSON response with stats (may be empty/zeros if no data)

### 2. Test Get Publications
```
http://localhost:3001/api/publications/add?facultyId=103
```
**Expected:** JSON with `{ success: true, publications: [], count: 0 }`

---

## 🧪 Test with Browser Console

Open browser console (F12) and run these tests:

### Test 1: Fetch DOI
```javascript
fetch('http://localhost:3001/api/publications/fetch-doi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ doi: '10.1038/nature12373' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Test 2: Add Publication
```javascript
fetch('http://localhost:3001/api/publications/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    facultyId: 103,
    title: 'Test Publication',
    category: 'Journal',
    year: 2024,
    publisher: 'Test Publisher',
    journalName: 'Test Journal'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Test 3: Get Publications
```javascript
fetch('http://localhost:3001/api/publications/add?facultyId=103')
  .then(r => r.json())
  .then(console.log);
```

### Test 4: Get Statistics
```javascript
fetch('http://localhost:3001/api/publications/stats?type=faculty&id=103')
  .then(r => r.json())
  .then(console.log);
```

---

## 📋 Expected Results

### If Database Tables Don't Exist:
You'll see errors like "Table 'publications' doesn't exist"

**Solution:** Run the SQL schema first:
```sql
-- Open MySQL and run:
source database/publications_schema.sql
```

### If Tables Exist But Empty:
```json
{
  "success": true,
  "publications": [],
  "count": 0
}
```

### After Adding a Publication:
```json
{
  "success": true,
  "publicationId": 1,
  "message": "Publication added successfully"
}
```

---

## ✅ Success Checklist

- [ ] Server running on http://localhost:3001
- [ ] Database tables created (publications, publication_authors, files_uploaded)
- [ ] GET requests return JSON (not auth errors)
- [ ] DOI fetch returns metadata
- [ ] Add publication returns publicationId
- [ ] Get publications returns list
- [ ] Stats API returns numbers

---

## 🔧 Troubleshooting

**Error: "Authentication required"**
→ Restart server (middleware was updated)

**Error: "Table doesn't exist"**
→ Run `database/publications_schema.sql` in MySQL

**Error: "Access denied"**
→ Check MySQL credentials in `.env.local`

**Error: "fetch failed"**
→ Make sure server is running on port 3001
