/**
 * ChronoMesh Mission Control Server
 * Express REST API & WebSocket Streaming for Multi-Agent Swarm Orchestration
 */
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const { engine } = require('./db/client');
const leaseManager = require('./runtime/leaseManager');
const vectorMemory = require('./runtime/vectorMemory');
const timeTravel = require('./runtime/timeTravel');
const chaosEngine = require('./runtime/chaosEngine');
const swarm = require('./runtime/agents');
const memoryCompactor = require('./runtime/memoryCompaction');
const mcpServer = require('./integrations/mcpServer');
const ccloudAgent = require('./integrations/ccloudAgent');
const skillsAgent = require('./integrations/skillsAgent');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Broadcast message to all connected WebSocket clients
function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Forward runtime events to WebSocket
leaseManager.on('leaseAcquired', data => broadcast('LEASE_ACQUIRED', data));
leaseManager.on('leaseReleased', data => broadcast('LEASE_RELEASED', data));
leaseManager.on('leaseConflict', data => broadcast('LEASE_CONFLICT', data));
chaosEngine.on('agentKilled', data => broadcast('AGENT_KILLED', data));
chaosEngine.on('failoverCompleted', data => broadcast('FAILOVER_COMPLETED', data));
chaosEngine.on('agentRevived', data => broadcast('AGENT_REVIVED', data));
swarm.on('swarmEvent', data => broadcast('SWARM_EVENT', data));
memoryCompactor.on('compactionCompleted', data => broadcast('MEMORY_COMPACTED', data));

// --- REST API ENDPOINTS ---

// 1. Overall System Status
app.get('/api/status', async (req, res) => {
  const cluster = await ccloudAgent.getClusterHealth();
  res.json({
    system: 'ChronoMesh',
    version: '1.0.0',
    cockroachDb: {
      status: cluster.status,
      regions: cluster.regions,
      nodes: cluster.nodes_count,
      vectorIndexing: 'ENABLED',
      isolation: 'SERIALIZABLE',
      regionalSovereignty: 'LOCALITY REGIONAL BY ROW (GDPR Compliant)'
    },
    aws: {
      bedrockModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      embeddingModel: 'amazon.titan-embed-text-v2:0 (1536-dim)',
      region: 'us-east-1'
    },
    agents: swarm.getAgentsStatus(),
    activeLeases: leaseManager.getActiveLeases(),
    vectorCount: engine.vectors.length,
    tasksCount: engine.getAllTasks().length,
    framesCount: engine.stateFrames.length,
    auditCount: engine.auditLedger.length,
    lastCompactedAt: memoryCompactor.lastCompactedAt
  });
});

// 2. Leases
app.get('/api/leases', (req, res) => {
  res.json({ leases: leaseManager.getActiveLeases() });
});

// 3. Vectors & Semantic Search
app.get('/api/vectors', (req, res) => {
  res.json({ vectors: engine.vectors });
});

app.post('/api/vectors/search', async (req, res) => {
  const { query, domain, sovereigntyRegion, topK } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  const results = await vectorMemory.search({ query, domain, topK: topK || 5 });
  res.json({ results });
});

// 3b. Memory Compaction & Sleep Consolidation Loop
app.post('/api/memory/compact', async (req, res) => {
  const outcome = await memoryCompactor.executeCompaction();
  res.json({ outcome });
});

// 4. Bi-Temporal Time Travel ('AS OF SYSTEM TIME')
app.get('/api/timetravel/checkpoints', (req, res) => {
  res.json({ checkpoints: timeTravel.getTimelineCheckpoints() });
});

app.get('/api/timetravel/replay', (req, res) => {
  const { asOf } = req.query;
  if (!asOf) return res.status(400).json({ error: 'asOf timestamp is required' });
  const snapshot = timeTravel.replayAtTimestamp(asOf);
  res.json(snapshot);
});

// 5. Multi-Agent Scenarios
app.post('/api/scenario/incident', async (req, res) => {
  // Run asynchronously and stream via WS
  swarm.runIncidentScenario();
  res.json({ started: true, message: 'Global Multi-Region Incident Scenario initiated.' });
});

// 6. Chaos Engineering
app.post('/api/chaos/kill', async (req, res) => {
  const { agentId, reason } = req.body;
  if (!agentId) return res.status(400).json({ error: 'agentId is required' });
  const outcome = await chaosEngine.killAgent(agentId, reason);
  res.json({ outcome });
});

app.post('/api/chaos/revive', (req, res) => {
  const { agentId } = req.body;
  if (!agentId) return res.status(400).json({ error: 'agentId is required' });
  chaosEngine.reviveAgent(agentId);
  res.json({ success: true, agentId });
});

// 7. Sponsor Tooling: ccloud, Skills, MCP, Audit
app.get('/api/ccloud', async (req, res) => {
  const health = await ccloudAgent.getClusterHealth();
  res.json(health);
});

app.post('/api/ccloud/backup', async (req, res) => {
  const backup = await ccloudAgent.triggerPointInTimeBackup(req.body.reason);
  res.json(backup);
});

app.get('/api/skills', async (req, res) => {
  const fingerprints = await skillsAgent.profileStatementFingerprints();
  const antiPatterns = await skillsAgent.detectSchemaAntiPatterns();
  const deadlock = await skillsAgent.diagnoseDeadlockRisks();
  res.json({ fingerprints, antiPatterns, deadlock });
});

app.get('/api/mcp', (req, res) => {
  res.json(mcpServer.getManifest());
});

app.post('/api/mcp/execute', async (req, res) => {
  const { toolName, args } = req.body;
  try {
    const result = await mcpServer.executeTool(toolName, args);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/audit', (req, res) => {
  res.json({ logs: engine.getAuditLogs(30) });
});

const PORT = process.env.PORT || 3050;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ChronoMesh Mission Control live on http://localhost:${PORT}`);
  console.log(`🪳 CockroachDB Memory Engine & Distributed Leases Active`);
  console.log(`⚡ Amazon Bedrock & Titan Embeddings Ready`);
  console.log(`🛠️  MCP Server endpoint: ${mcpServer.endpoint}`);
  console.log(`=======================================================`);
});
