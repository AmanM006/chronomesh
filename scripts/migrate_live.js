require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const certPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'postgresql', 'root.crt') : null;
const rootCert = (certPath && fs.existsSync(certPath)) ? fs.readFileSync(certPath).toString() : null;

const connectionString = process.env.DATABASE_URL || process.env.COCKROACH_DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: rootCert ? { ca: rootCert, rejectUnauthorized: true } : { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('🚀 Migrating schema to CockroachDB Cloud cluster [sage-manatee]...');

    // 1. memory_leases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memory_leases (
        lease_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_key STRING NOT NULL UNIQUE,
        agent_id STRING NOT NULL,
        agent_role STRING NOT NULL,
        priority INT DEFAULT 1,
        payload JSONB DEFAULT '{}'::JSONB,
        acquired_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
        heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
        expires_at TIMESTAMPTZ NOT NULL,
        status STRING NOT NULL DEFAULT 'ACTIVE'
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leases_status_exp ON memory_leases (status, expires_at);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_leases_agent ON memory_leases (agent_id);`);
    console.log('✅ memory_leases table created.');

    // 2. episodic_vectors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS episodic_vectors (
        memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id STRING NOT NULL,
        domain STRING NOT NULL,
        task_id STRING NOT NULL,
        content STRING NOT NULL,
        embedding VECTOR(1536) NOT NULL,
        sovereignty_region STRING DEFAULT 'us-east-1',
        metadata JSONB DEFAULT '{}'::JSONB,
        importance_score FLOAT DEFAULT 1.0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_episodic_domain_region ON episodic_vectors (domain, sovereignty_region, created_at DESC);`);
    console.log('✅ episodic_vectors table created.');

    // Vector cosine index
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_episodic_vectors_cosine 
        ON episodic_vectors USING ivfflat (embedding vector_cosine_ops);
      `);
      console.log('✅ VECTOR(1536) ivfflat cosine index created.');
    } catch (e) {
      console.log('ℹ️ ivfflat note:', e.message);
    }

    // 3. state_frames
    await pool.query(`
      CREATE TABLE IF NOT EXISTS state_frames (
        frame_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id STRING NOT NULL,
        step_number INT NOT NULL,
        agent_id STRING NOT NULL,
        action_type STRING NOT NULL,
        reasoning_trace STRING NOT NULL,
        cognitive_state JSONB NOT NULL,
        state_hash STRING NOT NULL,
        sovereignty_region STRING DEFAULT 'us-east-1',
        valid_time_start TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
        valid_time_end TIMESTAMPTZ,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_frames_task_step ON state_frames (task_id, step_number);`);
    console.log('✅ state_frames table created.');

    // 4. swarm_tasks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS swarm_tasks (
        task_id STRING PRIMARY KEY,
        title STRING NOT NULL,
        description STRING NOT NULL,
        status STRING NOT NULL DEFAULT 'PENDING',
        assigned_agent STRING,
        current_step INT DEFAULT 0,
        total_steps INT DEFAULT 0,
        checkpoint_state JSONB DEFAULT '{}'::JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
      );
    `);
    console.log('✅ swarm_tasks table created.');

    // 5. audit_ledger
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_ledger (
        audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type STRING NOT NULL,
        agent_id STRING NOT NULL,
        details JSONB NOT NULL,
        previous_hash STRING,
        signature STRING NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_ledger (timestamp DESC);`);
    console.log('✅ audit_ledger table created.');

    // 6. working_scratchpad (CockroachDB Native Row-Level TTL)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS working_scratchpad (
          scratchpad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id STRING NOT NULL,
          task_id STRING NOT NULL,
          scratch_key STRING NOT NULL,
          scratch_value JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
          expires_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp() + INTERVAL '10 minutes'
        ) WITH (ttl_expiration_expression = 'expires_at');
      `);
      console.log('✅ working_scratchpad (Row-Level TTL) table created.');
    } catch (e) {
      console.log('ℹ️ working_scratchpad creation note:', e.message);
    }

    // Verify all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('🎉 ALL TABLES IN LIVE COCKROACHDB CLUSTER:', tables.rows.map(r => r.table_name));

    await pool.end();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
