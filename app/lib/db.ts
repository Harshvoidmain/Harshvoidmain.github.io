import mysql from "mysql2/promise";

const poolConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "2030",
  database: process.env.MYSQL_DATABASE || "railway",
  waitForConnections: true,
  connectionLimit: 5, // Reduced from 10 for Vercel's limits
  queueLimit: 0,
  // Add timeout settings for Vercel compatibility
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  connectionTimeoutMillis: 30000, // 30 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  waitForConnectionsMillis: 10000, // 10 seconds
  // Restart broken connections
  restartConnection: true,
};

// Log pool config on startup
console.log(`[DB] Initializing connection pool: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);

// Create a connection pool and cache it globally for Next.js hot reloads
const globalForDb = globalThis as unknown as { mysqlPool: mysql.Pool };

let pool = globalForDb.mysqlPool;
if (!pool) {
  pool = mysql.createPool(poolConfig);
  globalForDb.mysqlPool = pool;
  console.log("[DB] Created new connection pool");
} else {
  console.log("[DB] Reusing cached connection pool");
}

// Export a function to get a connection from the pool
export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("[DB] Got connection from pool");
    return connection;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[DB] Connection pool error:", errorMessage);
    
    // If connection pool is broken, recreate it
    if (errorMessage.includes("PROTOCOL_CONNECTION_LOST") || errorMessage.includes("ECONNREFUSED")) {
      console.log("[DB] Attempting to recreate connection pool due to connection loss");
      pool = mysql.createPool(poolConfig);
      globalForDb.mysqlPool = pool;
      try {
        const retryConnection = await pool.getConnection();
        console.log("[DB] Successfully recovered connection after pool recreation");
        return retryConnection;
      } catch (retryError) {
        console.error("[DB] Failed to recover connection:", retryError);
        throw retryError;
      }
    }
    throw error;
  }
}

// Export a function to execute queries with retry logic
export async function query(
  sql: string,
  params: (string | number | boolean | null)[] = [],
  retryCount = 0
) {
  const maxRetries = 2;
  
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DB] Query error (attempt ${retryCount + 1}/${maxRetries + 1}):`, errorMessage);
    
    // Retry on connection loss
    if ((errorMessage.includes("PROTOCOL_CONNECTION_LOST") || errorMessage.includes("ECONNREFUSED")) && retryCount < maxRetries) {
      console.log(`[DB] Retrying query (${retryCount + 1}/${maxRetries})...`);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return query(sql, params, retryCount + 1);
    }
    
    console.error("[DB] Final error executing query:", errorMessage);
    console.error("[DB] SQL:", sql);
    console.error("[DB] Params:", params.length > 0 ? `[${params.length} params]` : "[]");
    throw error;
  }
}

// Export the pool for direct access if needed
export default pool;
