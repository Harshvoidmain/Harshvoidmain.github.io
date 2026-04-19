// Test MySQL Connection
import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    console.log('Testing MySQL connection...');
    console.log('Host:', process.env.MYSQL_HOST || 'sql12.freesqldatabase.com');
    console.log('User:', process.env.MYSQL_USER || 'sql12823670');
    console.log('Database:', process.env.MYSQL_DATABASE || 'sql12823670');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'sql12.freesqldatabase.com',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'sql12823670',
      password: process.env.MYSQL_PASSWORD || 'p8drE6VzYl',
      database: process.env.MYSQL_DATABASE || 'sql12823670',
    });

    console.log('✅ Connected successfully!');
    
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('\nAvailable databases:');
    console.log(databases);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Check if MySQL is running');
    console.error('2. Verify password in .env.local is correct');
    console.error('3. Make sure "railway" database exists');
    console.error('4. Check user permissions');
    process.exit(1);
  }
}

testConnection();
