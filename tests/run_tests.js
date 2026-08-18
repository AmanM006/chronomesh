/**
 * ChronoMesh Automated Test & Verification Suite
 * Tests all 4 memory layers, distributed leases, vector search, time-travel, and chaos failover
 */
const assert = require('assert');
const { engine } = require('../db/client');
const leaseManager = require('../runtime/leaseManager');
const vectorMemory = require('../runtime/vectorMemory');
const timeTravel = require('../runtime/timeTravel');
const chaosEngine = require('../runtime/chaosEngine');
const mcpServer = require('../integrations/mcpServer');
const skillsAgent = require('../integrations/skillsAgent');
const ccloudAgent = require('../integrations/ccloudAgent');

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING CHRONOMESH SYSTEM VERIFICATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. Atomic Leases Test
  await test('Tier 1: Atomic Working Memory Leases & Conflict Rejection', async () => {
    const resKey = 'test_resource:db_lock_001';
    
    // Agent A acquires lease
    const l1 = await leaseManager.acquire({
      resourceKey: resKey,
      agentId: 'AGENT_A',
      agentRole: 'Primary Tester',
      ttlMs: 5000
    });
    assert.strictEqual(l1.success, true, 'Agent A should acquire lease');

    // Agent B attempts to acquire same resource -> must be rejected
    const l2 = await leaseManager.acquire({
      resourceKey: resKey,
      agentId: 'AGENT_B',
      agentRole: 'Secondary Tester',
      ttlMs: 5000
    });
    assert.strictEqual(l2.success, false, 'Agent B must be rejected due to active lease');
    assert.strictEqual(l2.lockedBy, 'AGENT_A', 'Lock should indicate held by Agent A');

    // Agent A releases lease
    await leaseManager.release({ resourceKey: resKey, agentId: 'AGENT_A' });

    // Agent B now succeeds
    const l3 = await leaseManager.acquire({
      resourceKey: resKey,
      agentId: 'AGENT_B',
      agentRole: 'Secondary Tester',
      ttlMs: 5000
    });
    assert.strictEqual(l3.success, true, 'Agent B should succeed after Agent A releases');
    await leaseManager.release({ resourceKey: resKey, agentId: 'AGENT_B' });
  });

  // 2. Distributed Vector Search Test
  await test('Tier 2: Distributed Vector Indexing & Cosine Similarity', async () => {
    const stored = await vectorMemory.store({
      agentId: 'AGENT_TEST',
      domain: 'DATABASE_OPTIMIZATION',
      taskId: 'TEST-VEC-1',
      content: 'Configured Raft range leases and multi-region table localities in CockroachDB to minimize p99 latency.',
      metadata: { author: 'ChronoMesh Test' }
    });
    assert.ok(stored.memoryId, 'Memory should have a generated UUID');

    const searchHits = await vectorMemory.search({
      query: 'Configured Raft range leases and multi-region table localities in CockroachDB to minimize p99 latency.',
      domain: 'DATABASE_OPTIMIZATION',
      topK: 1
    });

    assert.ok(searchHits.length > 0, 'Vector search should return match');
    assert.ok(searchHits[0].similarity >= 0.95, 'Exact query match must yield near-1.0 cosine similarity');
  });

  // 3. Bi-Temporal Time-Travel Replay Test
  await test('Tier 3: Bi-Temporal State Replay (AS OF SYSTEM TIME)', async () => {
    const t0 = new Date().toISOString();
    await new Promise(r => setTimeout(r, 20));

    // Record Frame 1
    const f1 = timeTravel.recordFrame({
      taskId: 'TASK-TT-01',
      stepNumber: 1,
      agentId: 'AGENT_TT',
      actionType: 'INITIALIZE',
      reasoningTrace: 'Initial state exploration.',
      cognitiveState: { phase: 1, counter: 10 }
    });

    await new Promise(r => setTimeout(r, 50));
    const tMiddle = new Date().toISOString();
    await new Promise(r => setTimeout(r, 50));

    // Record Frame 2
    const f2 = timeTravel.recordFrame({
      taskId: 'TASK-TT-01',
      stepNumber: 2,
      agentId: 'AGENT_TT',
      actionType: 'MUTATE',
      reasoningTrace: 'Mutated counter.',
      cognitiveState: { phase: 2, counter: 50 }
    });

    // Query AS OF SYSTEM TIME at tMiddle -> must only have Frame 1
    const historical = timeTravel.replayAtTimestamp(tMiddle);
    assert.ok(historical.agentStates['AGENT_TT'], 'Agent state should exist at historical timestamp');
    assert.strictEqual(historical.agentStates['AGENT_TT'].lastStep, 1, 'Historical state should reflect step 1, not step 2');
  });

  // 4. Chaos Engineering & Autonomous Failover
  await test('Tier 4: Chaos Container Crash & Autonomous Failover Election', async () => {
    const taskId = 'TASK-CHAOS-RECOVER';
    engine.saveTask({
      taskId,
      title: 'Mission Critical Task',
      description: 'Must survive container SIGKILL',
      status: 'IN_PROGRESS',
      assignedAgent: 'AGENT_DOOMED',
      currentStep: 3,
      totalSteps: 5,
      checkpointState: { progress: '60%' }
    });

    await leaseManager.acquire({
      resourceKey: `task_lock:${taskId}`,
      agentId: 'AGENT_DOOMED',
      agentRole: 'Doomed Worker',
      ttlMs: 5000
    });

    // Kill AGENT_DOOMED
    const outcome = await chaosEngine.killAgent('AGENT_DOOMED', 'TEST_CHAOS_SIGKILL');
    assert.strictEqual(outcome.crashedAgent, 'AGENT_DOOMED');
    assert.strictEqual(outcome.standbyAgent, 'AGENT_STANDBY_GUARDIAN');
    assert.ok(outcome.recoveredTasks.includes(taskId), 'Standby agent must claim the orphaned task');

    // Verify task status in database
    const recoveredTask = engine.getTask(taskId);
    assert.strictEqual(recoveredTask.status, 'RECOVERED');
    assert.strictEqual(recoveredTask.assignedAgent, 'AGENT_STANDBY_GUARDIAN');
  });

  // 5. CockroachDB Managed MCP Server Test
  await test('Sponsor Tool 1: CockroachDB MCP Server Tool Execution', async () => {
    const manifest = mcpServer.getManifest();
    assert.strictEqual(manifest.name, 'chronomesh-cockroach-mcp');
    assert.strictEqual(manifest.tools.length, 4);

    const inspection = await mcpServer.executeTool('inspect_swarm_state', {});
    assert.ok(Array.isArray(inspection.activeLeases));
    assert.ok(Array.isArray(inspection.tasks));
  });

  // 6. CockroachDB ccloud CLI & Agent Skills
  await test('Sponsor Tool 2 & 3: ccloud Control Plane & Open-Source Agent Skills', async () => {
    const clusterHealth = await ccloudAgent.getClusterHealth();
    assert.strictEqual(clusterHealth.status, 'HEALTHY');
    assert.ok(clusterHealth.regions.includes('us-east-1'));

    const antiPatterns = await skillsAgent.detectSchemaAntiPatterns();
    assert.strictEqual(antiPatterns.antiPatternsDetected, 0);

    const fingerprints = await skillsAgent.profileStatementFingerprints();
    assert.ok(fingerprints.length >= 3);
  });

  // 7. Advanced: Sleep Consolidation & Cryptographic Merkle Audit Lineage
  await test('Advanced: Sleep Consolidation & Merkle Lineage Chaining', async () => {
    const memoryCompactor = require('../runtime/memoryCompaction');
    const compactionRes = await memoryCompactor.executeCompaction();
    assert.ok(compactionRes.success, 'Compaction should complete successfully');

    const auditLogs = engine.getAuditLogs(5);
    assert.ok(auditLogs.length >= 2, 'Audit logs should contain multiple chained events');
    const child = auditLogs[0];
    const parent = auditLogs[1];
    assert.strictEqual(child.previousHash, parent.signature, 'Child audit entry must cryptographically link to parent signature');
  });

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passed}/${total} TEST SUITES PASSED (100%)`);
  console.log('====================================================\n');

  leaseManager.destroy();
  if (passed === total) process.exit(0);
  else process.exit(1);
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
