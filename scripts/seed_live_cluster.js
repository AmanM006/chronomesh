require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function seedLiveCluster() {
  const certPath = process.env.APPDATA ? process.env.APPDATA + '/postgresql/root.crt' : null;
  const rootCert = (certPath && fs.existsSync(certPath)) ? fs.readFileSync(certPath).toString() : null;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.COCKROACH_DATABASE_URL,
    ssl: rootCert ? { ca: rootCert } : { rejectUnauthorized: false }
  });

  console.log('====================================================');
  console.log('🌱 POPULATING LIVE COCKROACHDB CLOUD (sage-manatee)');
  console.log('====================================================\n');

  // 1. Seed Memory Leases
  console.log('1. Inserting active distributed memory leases...');
  await pool.query(`
    INSERT INTO memory_leases (resource_key, agent_id, agent_role, acquired_at, heartbeat_at, expires_at, status)
    VALUES 
      ('tasks.orchestrator', 'AGENT_ORCHESTRATOR', 'Master Orchestrator', clock_timestamp(), clock_timestamp(), clock_timestamp() + INTERVAL '1 hour', 'ACTIVE'),
      ('cluster.forensics', 'AGENT_SRE_FORENSICS', 'SRE Worker', clock_timestamp(), clock_timestamp(), clock_timestamp() + INTERVAL '1 hour', 'ACTIVE'),
      ('ledger.merkle', 'AGENT_FINOPS_AUDIT', 'FinOps Compliance', clock_timestamp(), clock_timestamp(), clock_timestamp() + INTERVAL '1 hour', 'ACTIVE'),
      ('guard.heartbeat', 'AGENT_STANDBY_GUARDIAN', 'Standby Guardian', clock_timestamp(), clock_timestamp(), clock_timestamp() + INTERVAL '1 hour', 'ACTIVE')
    ON CONFLICT (resource_key) DO UPDATE 
    SET expires_at = clock_timestamp() + INTERVAL '1 hour', status = 'ACTIVE';
  `);

  // 2. Helper for 1536-dim dummy vector
  const makeVector = (seed) => {
    const vec = new Array(1536).fill(0);
    for (let i = 0; i < 1536; i++) {
      vec[i] = Math.sin(seed + i * 0.1) * 0.05;
    }
    return '[' + vec.map(v => v.toFixed(5)).join(',') + ']';
  };

  // 3. Seed Episodic Vectors
  console.log('2. Inserting episodic vectors (1536-dim Titan Embeddings)...');
  const memories = [
    {
      agent: 'AGENT_SRE_FORENSICS',
      domain: 'INFRASTRUCTURE_INCIDENT',
      taskId: 'INC-9042',
      content: 'PostgreSQL connection pool exhaustion caused by unclosed cursor loops in checkout microservice. Mitigated by enforcing statement timeouts and scaling read replicas in us-east-1.',
      seed: 1.0,
      region: 'us-east-1'
    },
    {
      agent: 'AGENT_FINOPS_AUDIT',
      domain: 'FINANCIAL_COMPLIANCE',
      taskId: 'AUD-3011',
      content: 'Cross-border settlement discrepancy detected between EU-Central-1 ledger and US-East-1 clearinghouse. Resolved via CockroachDB serializable two-phase commit consensus.',
      seed: 2.0,
      region: 'eu-central-1'
    },
    {
      agent: 'AGENT_STANDBY_GUARDIAN',
      domain: 'CHAOS_ENGINEERING',
      taskId: 'CHAOS-771',
      content: 'Simulated AZ partition during peak swarm write traffic. CockroachDB multi-region Raft ranges maintained 100% write quorum without split-brain anomalies.',
      seed: 3.0,
      region: 'us-east-1'
    },
    {
      agent: 'AGENT_SRE_FORENSICS',
      domain: 'INFRASTRUCTURE_INCIDENT',
      taskId: 'INC-8812',
      content: 'Deadlock cascade observed during concurrent batch updates to user wallet balances. Solution: enforce strict alphabetical ordering on resource lock acquisition.',
      seed: 4.0,
      region: 'ap-south-1'
    },
    {
      agent: 'AGENT_ORCHESTRATOR',
      domain: 'DATABASE_OPTIMIZATION',
      taskId: 'OPT-109',
      content: 'High latency on vector index scan over 5M embeddings. Resolved by adjusting CockroachDB ivfflat lists parameter and partitioning index ranges across regional leaseholders.',
      seed: 5.0,
      region: 'us-east-1'
    }
  ];

  for (const m of memories) {
    await pool.query(`
      INSERT INTO episodic_vectors (agent_id, domain, task_id, content, embedding, sovereignty_region, created_at)
      VALUES ($1, $2, $3, $4, $5::VECTOR, $6, clock_timestamp())
    `, [m.agent, m.domain, m.taskId, m.content, makeVector(m.seed), m.region]);
  }

  // 4. Seed Working Scratchpad (Row-Level TTL)
  console.log('3. Inserting active working scratchpad with native Row-Level TTL...');
  await pool.query(`
    INSERT INTO working_scratchpad (agent_id, task_id, scratch_key, scratch_value, created_at, expires_at)
    VALUES 
      ('AGENT_SRE_FORENSICS', 'TASK_LIVE_01', 'query_plan_analysis', '{"bottleneck": "unindexed foreign key", "cost": 0.04}', clock_timestamp(), clock_timestamp() + INTERVAL '10 minutes'),
      ('AGENT_FINOPS_AUDIT', 'TASK_LIVE_02', 'merkle_epoch_state', '{"epoch": 4821, "proof": "0x8f2a4c..."}', clock_timestamp(), clock_timestamp() + INTERVAL '10 minutes');
  `);

  // 5. Seed Swarm Tasks & State Frames
  console.log('4. Inserting swarm tasks & state frames...');
  await pool.query(`
    INSERT INTO swarm_tasks (task_id, title, description, status, assigned_agent, created_at, updated_at)
    VALUES 
      ('TASK_LIVE_01', 'Diagnose Deadlock', 'Diagnose deadlock on payment-gateway shard-2', 'IN_PROGRESS', 'AGENT_SRE_FORENSICS', clock_timestamp(), clock_timestamp()),
      ('TASK_LIVE_02', 'GDPR Verification', 'Verify GDPR cross-border data locality compliance', 'COMPLETED', 'AGENT_FINOPS_AUDIT', clock_timestamp(), clock_timestamp())
    ON CONFLICT (task_id) DO NOTHING;
    
    INSERT INTO state_frames (task_id, step_number, agent_id, action_type, reasoning_trace, cognitive_state, state_hash, valid_time_start, recorded_at)
    VALUES 
      ('TASK_LIVE_01', 1, 'AGENT_SRE_FORENSICS', 'QUERY_PLAN', 'Detected index lock contention on table user_balances', '{"status": "DIAGNOSING"}', '0x1a2b3c4d', clock_timestamp(), clock_timestamp());

    INSERT INTO audit_ledger (event_type, agent_id, details, signature, timestamp)
    VALUES 
      ('GENESIS_CHAIN_VERIFICATION', 'AGENT_FINOPS_AUDIT', '{"merkle_root": "0x7e8b91a2..."}', '0xSIG9921', clock_timestamp());
  `);

  // 6. Seed Memory Quarantine Ledger (Contradiction Defense)
  console.log('5. Creating and seeding memory_quarantine table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memory_quarantine (
      quarantine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposing_agent STRING NOT NULL,
      candidate_content STRING NOT NULL,
      contradicting_memory_id UUID,
      verifier_verdict STRING NOT NULL DEFAULT 'HELD_FOR_REVIEW',
      verifier_reason STRING NOT NULL,
      confidence_score FLOAT8 NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
    );
  `);
  await pool.query(`
    INSERT INTO memory_quarantine (proposing_agent, candidate_content, verifier_verdict, verifier_reason, confidence_score)
    VALUES
      ('AGENT_SRE_FORENSICS', 'PostgreSQL connection pool max_connections should be raised to 100,000 without memory limits.', 'REJECTED', 'Adversarial verifier flagged hazardous OOM configuration on production shard.', 0.25),
      ('AGENT_ORCHESTRATOR', 'Unverified payment gateway bypass patch for staging testing.', 'QUARANTINED', 'Semantic contradiction detected against policy runbook. Held for compliance review.', 0.42);
  `);

  // 7. Seed Agent Commitments (Styx/Promise Kernel)
  console.log('6. Creating and seeding agent_commitments table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_commitments (
      commitment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      promise_key STRING NOT NULL,
      promiser_agent STRING NOT NULL,
      beneficiary_agent STRING NOT NULL,
      resource_type STRING NOT NULL,
      allocated_quantity INT8 NOT NULL DEFAULT 1,
      status STRING NOT NULL DEFAULT 'ACTIVE',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
    );
  `);
  await pool.query(`
    INSERT INTO agent_commitments (promise_key, promiser_agent, beneficiary_agent, resource_type, allocated_quantity, expires_at, status)
    VALUES
      ('GPU_RESERVE_INC_9042', 'AGENT_ORCHESTRATOR', 'AGENT_SRE_FORENSICS', 'GPU_CLUSTER_A100', 2, clock_timestamp() + INTERVAL '1 hour', 'ACTIVE'),
      ('DEPLOY_SLOT_PROD_SHARD', 'AGENT_ORCHESTRATOR', 'AGENT_FINOPS_AUDIT', 'PRODUCTION_DEPLOY_SLOT', 1, clock_timestamp() + INTERVAL '30 minutes', 'ACTIVE');
  `);

  // 8. Seed Bi-Temporal Fact Ledger
  console.log('7. Creating and seeding bi_temporal_facts table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bi_temporal_facts (
      fact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject STRING NOT NULL,
      predicate STRING NOT NULL,
      object_value JSONB NOT NULL,
      confidence FLOAT8 NOT NULL DEFAULT 1.0,
      source_agent STRING NOT NULL,
      valid_from TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      valid_to TIMESTAMPTZ,
      asserted_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      invalid_at TIMESTAMPTZ,
      invalidated_by UUID
    );
  `);
  await pool.query(`
    INSERT INTO bi_temporal_facts (subject, predicate, object_value, source_agent, valid_from)
    VALUES
      ('payment_gateway_shard_2', 'status', '{"state": "OPERATIONAL", "pool_utilization": 0.38}'::JSONB, 'AGENT_SRE_FORENSICS', clock_timestamp() - INTERVAL '1 day'),
      ('settlement_ledger_eu', 'sovereignty_status', '{"gdpr_compliant": true, "replica_region": "eu-central-1"}'::JSONB, 'AGENT_FINOPS_AUDIT', clock_timestamp() - INTERVAL '2 days');
  `);

  console.log('\n====================================================');
  console.log('🎉 LIVE COCKROACHDB SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');
  await pool.end();
}

seedLiveCluster();
