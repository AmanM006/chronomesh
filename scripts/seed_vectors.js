require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function seedMoreVectors() {
  const rootCert = (process.env.APPDATA && fs.existsSync(process.env.APPDATA + '/postgresql/root.crt')) ? fs.readFileSync(process.env.APPDATA + '/postgresql/root.crt').toString() : null;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.COCKROACH_DATABASE_URL,
    ssl: rootCert ? { ca: rootCert } : { rejectUnauthorized: false }
  });

  const domains = ['INFRASTRUCTURE_INCIDENT', 'FINANCIAL_COMPLIANCE', 'CHAOS_ENGINEERING', 'SECURITY_GOVERNANCE', 'PERFORMANCE_TUNING'];
  const regions = ['us-east-1', 'eu-central-1', 'ap-south-1'];
  const agents = ['AGENT_ORCHESTRATOR', 'AGENT_SRE_FORENSICS', 'AGENT_FINOPS_AUDIT', 'AGENT_STANDBY_GUARDIAN'];

  const makeVector = (seed) => {
    const vec = new Array(1536).fill(0);
    for (let i = 0; i < 1536; i++) {
      vec[i] = Math.sin(seed + i * 0.08) * 0.05;
    }
    return '[' + vec.map(v => v.toFixed(5)).join(',') + ']';
  };

  const sampleFacts = [
    'PostgreSQL connection pool exhaustion caused by unclosed cursor loops. Fixed by statement timeouts and read replica scaling.',
    'Cross-border GDPR data residency verified: customer PII pinned to eu-central-1 regional replica partition.',
    'AWS AZ outage simulation: Standby guardian detected expired lease in 14ms and reclaimed task checkpoint with zero state loss.',
    'Redis cache stampede mitigated using CockroachDB distributed row leases to prevent thundering herd on origin cluster.',
    'Kafka partition consumer lag resolved by auto-scaling ingestion workers and adjusting max poll interval.',
    'CockroachDB SERIALIZABLE transaction conflict 40001 resolved via exponential jitter backoff algorithm.',
    'Kubernetes pod OOMKilled event triaged: memory limits adjusted to 4Gi with automated horizontal pod autoscaler.',
    'TLS certificate rotation automated across multi-region ingress gateways with zero client connection drops.',
    'SQL query optimization: missing composite index on (tenant_id, created_at) added, reducing query latency from 420ms to 1.8ms.',
    'Database deadlock in payment checkout pipeline mitigated by sorting lock acquisition keys consistently across microservices.'
  ];

  console.log('Seeding 40 additional realistic episodic vector memories into live CockroachDB...');
  for (let i = 0; i < 40; i++) {
    const domain = domains[i % domains.length];
    const region = regions[i % regions.length];
    const agent = agents[i % agents.length];
    const content = sampleFacts[i % sampleFacts.length] + ' [Incident Ref: INC-' + (9000 + i) + ']';
    const vecStr = makeVector(i + 10.0);

    const taskId = 'INC-' + (9000 + i);
    await pool.query('INSERT INTO episodic_vectors (agent_id, task_id, domain, content, embedding, sovereignty_region) VALUES ($1, $2, $3, $4, $5::VECTOR, $6)', [agent, taskId, domain, content, vecStr, region]);
  }

  const countRes = await pool.query('SELECT count(*) as cnt FROM episodic_vectors');
  console.log('✅ Total episodic_vectors in live CockroachDB cluster: ' + countRes.rows[0].cnt);
  await pool.end();
}

seedMoreVectors().catch(console.error);
