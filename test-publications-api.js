// Test script for Publications API
// Run with: node test-publications-api.js

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing Publications Backend APIs\n');
  console.log('=' .repeat(50));

  // Test 1: Fetch DOI
  console.log('\n✅ Test 1: Fetch DOI Metadata');
  try {
    const response = await fetch(`${BASE_URL}/api/publications/fetch-doi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doi: '10.1038/nature12373' })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Add Publication
  console.log('\n✅ Test 2: Add Publication');
  try {
    const response = await fetch(`${BASE_URL}/api/publications/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facultyId: 103,
        title: 'Test Publication - Sample Paper',
        category: 'Journal',
        year: 2024,
        publisher: 'Test Publisher',
        journalName: 'Test Journal',
        coAuthors: [{ type: 'faculty', id: 105 }]
      })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.publicationId) {
      console.log('✨ Publication ID:', data.publicationId);
      global.testPublicationId = data.publicationId;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Get Publications
  console.log('\n✅ Test 3: Get Publications List');
  try {
    const response = await fetch(`${BASE_URL}/api/publications/add?facultyId=103`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Get Statistics
  console.log('\n✅ Test 4: Get Faculty Statistics');
  try {
    const response = await fetch(`${BASE_URL}/api/publications/stats?type=faculty&id=103`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All tests completed!\n');
}

// Run tests
testAPI().catch(console.error);
