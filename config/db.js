// server/config/db.js
const { Pool } = require('pg');

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper: convert "?" placeholders to "$1, $2, ..." for Postgres
function mapQuery(sql, params = []) {
  let index = 0;
  const text = sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
  return { text, values: params };
}

// Export a query function that mimics mysql2's [rows] response
module.exports = {
  query: async (sql, params = []) => {
    const { text, values } = mapQuery(sql, params);
    const result = await pool.query(text, values);
    // mysql2 usually returns [rows, fields], so we return [rows]
    return [result.rows];
  }
};
