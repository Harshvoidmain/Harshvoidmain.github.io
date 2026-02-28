import mysql from "mysql2/promise";

const poolConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "2030",
  database: process.env.MYSQL_DATABASE || "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create a connection pool and cache it globally for Next.js hot reloads
const globalForDb = globalThis as unknown as { mysqlPool: mysql.Pool };
const pool = globalForDb.mysqlPool || mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = pool;
}

// Export a function to get a connection from the pool
export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
}

// Export a function to execute queries
export async function query(
  sql: string,
  params: (string | number | boolean | null)[] = []
) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Export the pool for direct access if needed
export default pool;
