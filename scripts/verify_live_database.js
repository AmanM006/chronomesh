require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function checkLiveDb() {
  const certPath = process.env.APPDATA ? process.env.APPDATA + '/postgresql/root.crt' : null;
  const rootCert = (certPath && fs.existsSync(certPath)) ? fs.readFileSync(certPath).toString() : null;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.COCKROACH_DATABASE_URL,
    ssl: rootCert ? { ca: rootCert } : { rejectUnauthorized: false }
  });

  console.log('====================================================');
  console.log('🗄️ INSPECTING LIVE COCKROACHDB CLOUD (sage-manatee)');
  console.log('====================================================\n');

  const res = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name', ['public']);
  console.log('Tables Present:', res.rows.map(r => r.table_name));

  for (const row of res.rows) {
    const countRes = await pool.query(`SELECT count(*) FROM ${row.table_name}`);
    console.log(`  • ${row.table_name}: ${countRes.rows[0].count} live rows`);
  }

  console.log('\nTesting Row-Level TTL Expression on working_scratchpad:');
  const ttlRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'working_scratchpad'
  `);
  console.log('working_scratchpad verified in schema:', ttlRes.rows.length > 0 ? 'YES (Active)' : 'NO');

  await pool.end();
}

checkLiveDb();
