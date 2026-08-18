const dbClient = require('../db/client');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
require('dotenv').config();

async function runProtocolAudit() {
  console.log('================================================================');
  console.log('🔍 UNIVERSAL VERIFICATION PROTOCOL: ADVERSARIAL LIVE AUDIT');
  console.log('================================================================\n');

  // 1. LIVE COCKROACHDB CLUSTER RAW PROOF
  console.log('--- [PROVEN ARTIFACT 1: LIVE COCKROACHDB CLUSTER READ-BACK] ---');
  const t0 = Date.now();
  try {
    const versionRes = await dbClient.query('SELECT version(), current_database(), current_user, now();');
    const dbLatency = Date.now() - t0;
    console.log('Raw Database Read-Back:');
    console.log('  Database Name:', versionRes.rows[0].current_database);
    console.log('  Current User:', versionRes.rows[0].current_user);
    console.log('  Cluster Version:', versionRes.rows[0].version.split('\n')[0]);
    console.log('  Cluster Timestamp (MVCC):', versionRes.rows[0].now);
    console.log('  Actual Network Wall-Clock Latency:', dbLatency + 'ms');

    const tableCounts = await Promise.all([
      dbClient.query('SELECT count(*) as count FROM episodic_vectors;'),
      dbClient.query('SELECT count(*) as count FROM memory_leases;'),
      dbClient.query('SELECT count(*) as count FROM memory_quarantine;'),
      dbClient.query('SELECT count(*) as count FROM working_scratchpad;'),
      dbClient.query('SELECT count(*) as count FROM agent_commitments;')
    ]);

    console.log('\nExact Table Row Counts in Live Cloud Cluster:');
    console.log('  episodic_vectors (pgvector):', tableCounts[0].rows[0].count);
    console.log('  memory_leases (distributed mutex):', tableCounts[1].rows[0].count);
    console.log('  memory_quarantine (write-gate):', tableCounts[2].rows[0].count);
    console.log('  working_scratchpad (TTL):', tableCounts[3].rows[0].count);
    console.log('  agent_commitments (serializable):', tableCounts[4].rows[0].count);

    // Read back exact vector query result
    console.log('\nRaw Vector Cosine Similarity Read-Back (<=>):');
    const sampleVec = '[' + Array(1536).fill(0.01).join(',') + ']';
    const vecRes = await dbClient.query('SELECT memory_id, domain, content, 1 - (embedding <=> $1::VECTOR) AS sim FROM episodic_vectors ORDER BY embedding <=> $1::VECTOR ASC LIMIT 2;', [sampleVec]);
    console.log('  Top Memory 1:', vecRes.rows[0]);
    console.log('  Top Memory 2:', vecRes.rows[1]);
  } catch (err) {
    console.error('❌ CockroachDB Live Query FAILED:', err);
  }

  // 2. AWS BEDROCK INTEGRATION RAW PROOF
  console.log('\n--- [PROVEN ARTIFACT 2: AWS BEDROCK LIVE API ATTEMPT] ---');
  const bedrock = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  try {
    const cmd = new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: new TextEncoder().encode(JSON.stringify({ inputText: 'test audit', dimensions: 1536 }))
    });
    const tB0 = Date.now();
    const res = await bedrock.send(cmd);
    const bLatency = Date.now() - tB0;
    console.log('AWS Bedrock Response Status: 200 OK | Latency:', bLatency + 'ms');
  } catch (err) {
    console.log('Raw AWS Bedrock Error Returned:');
    console.log('  Error Name:', err.name);
    console.log('  Error Message:', err.message);
  }

  // 3. DELIBERATE FAILURE MODE PROOF (RULE 6)
  console.log('\n--- [PROVEN ARTIFACT 3: DELIBERATE FAILURE MODE TESTING (RULE 6)] ---');
  try {
    // Deliberately trigger invalid SQL syntax to prove error handling
    await dbClient.query('SELECT * FROM non_existent_table_xyz;');
  } catch (negErr) {
    console.log('Deliberate SQL Error Surfaced Successfully:');
    console.log('  Severity:', negErr.severity);
    console.log('  Code:', negErr.code);
    console.log('  Message:', negErr.message);
  }

  process.exit(0);
}

runProtocolAudit();
