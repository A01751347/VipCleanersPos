import 'server-only';
import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  timezone: '-06:00', 
});

// Configure timezone for each connection using callback-style query
pool.on('connection', (connection) => {
  // Use callback-style query for connection event (not promise-based)
  connection.query("SET time_zone = '-06:00'", (err: any) => {
    if (err) {
      console.error('Error configurando zona horaria en conexión:', err);
    }
  });
});

export async function executeQuery<T>({
  query,
  values,
}: {
  query: string;
  values?: unknown[];
}): Promise<T> {
  try {
    const [result] = await pool.query(query, values); // ✅ .query en lugar de .execute

    return result as T;
  } catch (err) {
    console.error('Database query error:', err);
    throw new Error('Database error');
  }
}