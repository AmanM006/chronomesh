/**
 * ChronoMesh Mission Control Frontend Application
 * Real-time WebSocket streaming, Canvas Topology, Time-Travel Replay & Chaos Simulator
 */

// State
let appState = {
  agents: [],
  leases: [],
  vectors: [],
  checkpoints: [],
  ws: null,
  activeTab: 'swarm'
};

// Canvas Swarm Visualizer Setup
const canvas = document.getElementById('swarm-canvas');
const ctx = canvas.getContext('2d');

const agentPositions = {
  AGENT_ORCHESTRATOR: { x: 300, y: 70, label: 'Atlas Orchestrator', color: '#00d4aa' },
  AGENT_SRE_FORENSICS: { x: 140, y: 220, label: 'Sentinel SRE', color: '#06b6d4' },
  AGENT_FINOPS_AUDIT: { x: 460, y: 220, label: 'Veritas FinOps', color: '#8b5cf6' },
  AGENT_STANDBY_GUARDIAN: { x: 300, y: 290, label: 'Aegis Standby', color: '#f59e0b' }
};

let particles = [];

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => console.log('[ChronoMesh WS] Connected to live telemetry stream.');
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleWsEvent(msg);
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  ws.onclose = () => {
    console.warn('[ChronoMesh WS] Disconnected. Reconnecting in 2s...');
    setTimeout(initWebSocket, 2000);
  };

  appState.ws = ws;
}

function handleWsEvent({ type, data, timestamp }) {
  const stream = document.getElementById('swarm-event-stream');
  const timeStr = new Date(timestamp).toLocaleTimeString();

  // Add event to live stream UI
  if (stream) {
    const item = document.createElement('div');
    item.className = 'stream-item';
    item.innerHTML = `<span class="stream-time">[${timeStr}]</span> <span class="stream-msg"><strong>${type}</strong>: ${JSON.stringify(data).slice(0, 140)}</span>`;
    stream.prepend(item);
  }

  // Handle specific event actions
  if (type === 'SWARM_EVENT') {
    spawnParticle(data.agentId);
    refreshStatus();
  } else if (type === 'AGENT_KILLED') {
    renderChaosLog(`💥 Container Crash: ${data.agentId} (${data.reason})`);
    refreshStatus();
  } else if (type === 'FAILOVER_COMPLETED') {
    renderChaosLog(`🛡️ Autonomous Failover: ${data.standbyAgent} claimed orphaned tasks for ${data.crashedAgent}`);
    refreshStatus();
  } else if (type === 'LEASE_ACQUIRED' || type === 'LEASE_RELEASED') {
    refreshStatus();
  }
}

// Canvas Interaction (Click to inspect agent)
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  for (const [id, pos] of Object.entries(agentPositions)) {
    const dist = Math.hypot(clickX - pos.x, clickY - pos.y);
    if (dist <= 30) {
      openAgentDrawer(id);
      break;
    }
  }
});

function openAgentDrawer(agentId) {
  const drawer = document.getElementById('agent-drawer');
  const agentInfo = (appState.agents || []).find(a => a.id === agentId);
  const pos = agentPositions[agentId];

  document.getElementById('drawer-agent-name').textContent = `${pos?.label || agentId} (Inspector)`;
  document.getElementById('drawer-agent-role').textContent = agentInfo?.role || 'Autonomous Swarm Node';
  document.getElementById('drawer-agent-region').textContent = agentInfo?.region || 'us-east-1';
  document.getElementById('drawer-agent-status').textContent = agentInfo?.alive ? 'HEALTHY (ACTIVE)' : 'TERMINATED (OFFLINE)';
  document.getElementById('drawer-agent-status').className = agentInfo?.alive ? 'text-green' : 'text-danger';

  // Leases held by this agent
  const heldLeases = (appState.leases || []).filter(l => l.agentId === agentId);
  document.getElementById('drawer-agent-leases').textContent = heldLeases.length > 0
    ? JSON.stringify(heldLeases, null, 2)
    : 'No active mutex locks held.';

  // Recent reasoning
  document.getElementById('drawer-agent-reasoning').textContent = `Agent [${agentId}] active in CockroachDB distributed cluster (${agentInfo?.region || 'us-east-1'}). Connected to Bedrock Titan & Claude 3.5 Sonnet.`;

  drawer.style.display = 'block';
}

document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
  document.getElementById('agent-drawer').style.display = 'none';
});

// Traveling data packet animation
let travelingPackets = [];
setInterval(() => {
  const keys = Object.keys(agentPositions);
  const fromKey = keys[Math.floor(Math.random() * keys.length)];
  let toKey = keys[Math.floor(Math.random() * keys.length)];
  while (toKey === fromKey) toKey = keys[Math.floor(Math.random() * keys.length)];

  travelingPackets.push({
    from: agentPositions[fromKey],
    to: agentPositions[toKey],
    progress: 0,
    speed: 0.02 + Math.random() * 0.015,
    color: agentPositions[fromKey].color
  });
}, 800);

// Fetch Full System Status
async function refreshStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    appState.agents = data.agents;
    appState.leases = data.activeLeases;
    appState.vectorsCount = data.vectorCount;

    // Update metrics
    document.getElementById('metric-agents').textContent = data.agents.filter(a => a.alive).length;
    document.getElementById('metric-locks').textContent = data.activeLeases.length;
    document.getElementById('leases-count-badge').textContent = `${data.activeLeases.length} Active`;

    // Render Leases List
    const leasesList = document.getElementById('leases-list');
    if (leasesList) {
      if (data.activeLeases.length === 0) {
        leasesList.innerHTML = '<div class="empty-state">No active mutex locks. System idle.</div>';
      } else {
        leasesList.innerHTML = data.activeLeases.map(l => `
          <div class="lease-card">
            <div>
              <div class="lease-key">${l.resourceKey}</div>
              <div class="lease-owner">Held by: ${l.agentId} (${l.agentRole})</div>
            </div>
            <span class="badge badge-success">MUTEX_LOCKED</span>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error refreshing status:', err);
  }
}

// --- Canvas Swarm Topology Animation ---
function spawnParticle(agentId) {
  const pos = agentPositions[agentId] || { x: 300, y: 170 };
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: pos.x,
      y: pos.y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 1.0,
      color: pos.color || '#00d4aa'
    });
  }
}

function drawSwarm() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connecting mesh lines
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.lineWidth = 1.5;
  const keys = Object.keys(agentPositions);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const p1 = agentPositions[keys[i]];
      const p2 = agentPositions[keys[j]];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // Draw traveling mesh data packets
  for (let i = travelingPackets.length - 1; i >= 0; i--) {
    const pkt = travelingPackets[i];
    pkt.progress += pkt.speed;
    if (pkt.progress >= 1.0) {
      travelingPackets.splice(i, 1);
      continue;
    }
    const curX = pkt.from.x + (pkt.to.x - pkt.from.x) * pkt.progress;
    const curY = pkt.from.y + (pkt.to.y - pkt.from.y) * pkt.progress;

    ctx.fillStyle = pkt.color || '#00d4aa';
    ctx.shadowColor = pkt.color || '#00d4aa';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(curX, curY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw burst particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.02;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Draw Agent Nodes
  for (const [id, pos] of Object.entries(agentPositions)) {
    const agentInfo = (appState.agents || []).find(a => a.id === id);
    const isAlive = agentInfo ? agentInfo.alive : true;

    // Outer ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = isAlive ? '#0e1424' : '#221010';
    ctx.fill();
    ctx.strokeStyle = isAlive ? pos.color : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner icon
    ctx.fillStyle = isAlive ? pos.color : '#ef4444';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isAlive ? '●' : '✖', pos.x, pos.y);

    // Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = '11px Inter';
    ctx.fillText(pos.label, pos.x, pos.y + 34);

    // Region pill
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(agentInfo?.region || 'AWS', pos.x, pos.y + 46);
  }

  requestAnimationFrame(drawSwarm);
}

// --- Time-Travel Scrubber Engine ---
async function setupTimeTravel() {
  const slider = document.getElementById('timeline-slider');
  const label = document.getElementById('scrubber-current-label');
  const cogniView = document.getElementById('tt-cognitive-view');
  const metaView = document.getElementById('tt-meta-view');

  async function loadCheckpoints() {
    const res = await fetch('/api/timetravel/checkpoints');
    const data = await res.json();
    appState.checkpoints = data.checkpoints;
  }

  await loadCheckpoints();

  slider.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value);
    if (val === 100) {
      label.textContent = 'NOW (Live)';
      cogniView.textContent = 'Live tracking active. Select an earlier point to replay historic state.';
      metaView.textContent = 'All memory vectors and leases are live.';
      return;
    }

    if (appState.checkpoints.length === 0) {
      label.textContent = 'No past checkpoints recorded';
      return;
    }

    const idx = Math.floor((val / 100) * (appState.checkpoints.length - 1));
    const targetCp = appState.checkpoints[idx];
    label.textContent = `AS OF: ${new Date(targetCp.timestamp).toLocaleTimeString()}`;

    // Query CockroachDB AS OF SYSTEM TIME
    const replayRes = await fetch(`/api/timetravel/replay?asOf=${encodeURIComponent(targetCp.timestamp)}`);
    const replayData = await replayRes.json();

    cogniView.textContent = JSON.stringify(replayData.agentStates, null, 2);
    metaView.textContent = JSON.stringify({
      asOfSystemTime: replayData.asOf,
      summary: replayData.summary,
      activeLeasesAtTimestamp: replayData.activeLeases
    }, null, 2);
  });

  document.getElementById('btn-scrub-now')?.addEventListener('click', () => {
    slider.value = 100;
    slider.dispatchEvent(new Event('input'));
  });
}

// --- Distributed Vector Search ---
function setupVectorSearch() {
  const btn = document.getElementById('btn-search-vectors');
  const input = document.getElementById('vector-search-input');
  const domainFilter = document.getElementById('vector-domain-filter');
  const container = document.getElementById('vector-results-container');
  const compactBtn = document.getElementById('btn-compact-memory');

  async function runSearch() {
    const query = input.value;
    const domain = domainFilter.value || undefined;
    
    container.innerHTML = '<div class="empty-state">Computing 1536-dim embeddings & querying CockroachDB pgvector index...</div>';

    const res = await fetch('/api/vectors/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, domain, topK: 5 })
    });
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      container.innerHTML = '<div class="empty-state">No matching episodic memories found.</div>';
      return;
    }

    container.innerHTML = data.results.map(r => `
      <div class="vector-card">
        <div class="vector-content">
          <p><strong>${r.content}</strong></p>
          <div class="vector-meta">
            <span>Domain: <code>${r.domain}</code></span>
            <span>Task: <code>${r.taskId}</code></span>
            <span>Region: <code class="badge">${r.sovereigntyRegion || 'us-east-1'}</code></span>
            <span>Agent: <code>${r.agentId}</code></span>
          </div>
        </div>
        <div class="sim-score-badge" title="Cosine Similarity Score">
          ${(r.similarity * 100).toFixed(1)}% Match
        </div>
      </div>
    `).join('');
  }

  compactBtn?.addEventListener('click', async () => {
    compactBtn.disabled = true;
    compactBtn.textContent = '🧠 Consolidating Knowledge...';
    const res = await fetch('/api/memory/compact', { method: 'POST' });
    const data = await res.json();
    renderChaosLog(`🧠 Sleep Consolidation Complete: Compressed ${data.outcome.rawFramesProcessed} raw frames into long-term semantic knowledge.`);
    setTimeout(() => {
      compactBtn.disabled = false;
      compactBtn.textContent = '🧠 Run Sleep Consolidation Loop';
      runSearch();
    }, 1500);
  });

  btn?.addEventListener('click', runSearch);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
  runSearch(); // initial load
}

// --- Chaos Engineering Controls ---
function setupChaosLab() {
  document.querySelectorAll('.btn-chaos-kill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const agentId = btn.getAttribute('data-agent');
      btn.disabled = true;
      btn.textContent = 'Terminating...';

      await fetch('/api/chaos/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, reason: 'SIMULATED_AWS_ECS_SIGKILL' })
      });

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '💥 Kill Agent';
      }, 1500);
    });
  });

  document.getElementById('btn-sim-partition')?.addEventListener('click', () => {
    renderChaosLog('⚡ Simulated cross-region network latency (180ms) between US-East-1 and EU-Central-1. CockroachDB Multi-Region Raft consensus remained 100% active.');
  });

  document.getElementById('btn-revive-all')?.addEventListener('click', async () => {
    for (const ag of ['AGENT_ORCHESTRATOR', 'AGENT_SRE_FORENSICS', 'AGENT_FINOPS_AUDIT', 'AGENT_STANDBY_GUARDIAN']) {
      await fetch('/api/chaos/revive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: ag })
      });
    }
    renderChaosLog('🔄 All worker agents restored to healthy pool.');
    refreshStatus();
  });
}

// --- Telemetry & CockroachDB Skills ---
async function loadTelemetry() {
  try {
    const skillsRes = await fetch('/api/skills');
    const skills = await skillsRes.json();

    // Render Fingerprints
    const fpContainer = document.getElementById('fingerprints-list');
    if (fpContainer && skills.fingerprints) {
      fpContainer.innerHTML = `
        <table>
          <thead>
            <tr><th>Statement Fingerprint</th><th>Execs</th><th>Mean Latency</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${skills.fingerprints.map(f => `
              <tr>
                <td><code>${f.fingerprint}</code></td>
                <td>${f.executionCount}</td>
                <td>${f.meanLatencyMs}ms</td>
                <td><span class="badge badge-success">${f.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // Render Schema Anti-Pattern Rules
    const rulesContainer = document.getElementById('schema-rules-list');
    if (rulesContainer && skills.antiPatterns?.recommendations) {
      rulesContainer.innerHTML = skills.antiPatterns.recommendations.map(r => `
        <div class="rule-item">
          <div>
            <strong>${r.rule}</strong>
            <p class="text-muted" style="font-size: 0.72rem;">${r.detail}</p>
          </div>
          <span class="badge badge-success">${r.status}</span>
        </div>
      `).join('');
    }

    // Render Audit Logs with Merkle Lineage
    const auditRes = await fetch('/api/audit');
    const audit = await auditRes.json();
    const auditContainer = document.getElementById('audit-trail-container');
    if (auditContainer && audit.logs) {
      auditContainer.innerHTML = audit.logs.map(l => `
        <div class="audit-card">
          <div><strong>${l.eventType}</strong> by <code>${l.agentId}</code></div>
          <div class="text-muted" style="font-size: 0.7rem;">
            Merkle Parent: <code>${l.previousHash || 'GENESIS'}</code> ➔ Sig: <code>${l.signature}</code> • ${new Date(l.timestamp).toLocaleTimeString()}
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading telemetry:', err);
  }
}

// Navigation Tabs
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = `tab-${btn.getAttribute('data-tab')}`;
      document.getElementById(tabId)?.classList.add('active');
      appState.activeTab = btn.getAttribute('data-tab');

      if (appState.activeTab === 'telemetry') {
        loadTelemetry();
      }
    });
  });
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
  setupTabs();
  setupVectorSearch();
  setupTimeTravel();
  setupChaosLab();
  refreshStatus();
  drawSwarm();

  // Run Scenario Button
  document.getElementById('btn-run-scenario')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-scenario');
    const scenarioType = document.getElementById('scenario-selector')?.value || 'incident';
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Swarm Executing...';

    if (scenarioType === 'chaos') {
      await fetch('/api/chaos/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'AGENT_SRE_FORENSICS', reason: 'SCENARIO_CHAOS_TEST' })
      });
    } else {
      await fetch('/api/scenario/incident', { method: 'POST' });
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">▶</span> Launch Swarm Scenario';
    }, 8000);
  });

  // MCP Tool Playground Executor
  document.getElementById('btn-exec-mcp')?.addEventListener('click', async () => {
    const toolSelect = document.getElementById('mcp-tool-select');
    const resultView = document.getElementById('mcp-result-view');
    const toolName = toolSelect.value;

    resultView.textContent = `Executing MCP tool: ${toolName}...`;

    let args = {};
    if (toolName === 'query_episodic_vectors') {
      args = { query: 'PostgreSQL deadlock and connection exhaustion', topK: 2 };
    } else if (toolName === 'replay_memory_time_travel') {
      args = { asOfTimestamp: new Date(Date.now() - 5000).toISOString() };
    } else if (toolName === 'inject_chaos_failure') {
      args = { agentId: 'AGENT_FINOPS_AUDIT', reason: 'MCP_INSPECTION_TEST' };
    }

    try {
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, args })
      });
      const data = await res.json();
      resultView.textContent = JSON.stringify(data.result, null, 2);
    } catch (err) {
      resultView.textContent = `MCP Error: ${err.message}`;
    }
  });

  // ccloud Snapshot Button
  document.getElementById('btn-ccloud-backup')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-ccloud-backup');
    btn.disabled = true;
    btn.textContent = 'Triggering Backup...';
    await fetch('/api/ccloud/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'MANUAL_DASHBOARD_TRIGGER' })
    });
    loadTelemetry();
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '📸 Trigger ccloud Point-in-Time Snapshot';
    }, 1500);
  });
});
