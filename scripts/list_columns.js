require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function checkCols() {
  const certPath = process.env.APPDATA ? process.env.APPDATA + '/postgresql/root.crt' : null;
  const rootCert = (certPath && fs.existsSync(certPath)) ? fs.readFileSync(certPath).toString() : null;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.COCKROACH_DATABASE_URL,
    ssl: rootCert ? { ca: rootCert } : { rejectUnauthorized: false }
  });

  const res = await pool.query(`
    SELECT table_name, column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position
  `);
  for (const r of res.rows) {
    console.log(`${r.table_name}.${r.column_name} (nullable: ${r.is_nullable})`);
  }
  await pool.end();
}

checkCols();
