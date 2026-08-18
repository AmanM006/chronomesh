/**
 * CockroachDB Managed Model Context Protocol (MCP) Server for ChronoMesh
 * Enables Claude Code, Cursor, and external tools to securely inspect and control swarm memory
 */
const { engine } = require('../db/client');
const timeTravel = require('../runtime/timeTravel');
const vectorMemory = require('../runtime/vectorMemory');
const chaosEngine = require('../runtime/chaosEngine');

class CockroachMcpServer {
  constructor() {
    this.serverName = 'chronomesh-cockroach-mcp';
    this.version = '1.0.0';
    this.endpoint = 'https://cockroachlabs.cloud/mcp';
    this.tools = [
      {
        name: 'inspect_swarm_state',
        description: 'Read-only audit of active distributed memory leases, swarm tasks, and node health.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'replay_memory_time_travel',
        description: 'Query historical agent memory state AS OF SYSTEM TIME <timestamp>.',
        inputSchema: {
          type: 'object',
          properties: {
            asOfTimestamp: { type: 'string', description: 'ISO-8601 timestamp string' }
          },
          required: ['asOfTimestamp']
        }
      },
      {
        name: 'query_episodic_vectors',
        description: 'Semantic cosine similarity search over CockroachDB pgvector memory table.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Semantic search string' },
            domain: { type: 'string', description: 'Optional domain filter (e.g. INFRASTRUCTURE_INCIDENT, FINANCIAL_COMPLIANCE)' },
            topK: { type: 'number', description: 'Maximum number of results to return' }
          },
          required: ['query']
        }
      },
      {
        name: 'inject_chaos_failure',
        description: 'Trigger simulated agent or container failure to test zero-data-loss failover.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'ID of the agent to terminate' },
            reason: { type: 'string', description: 'Failure classification' }
          },
          required: ['agentId']
        }
      }
    ];
  }

  // Handle incoming MCP tool call
  async executeTool(toolName, args = {}) {
    switch (toolName) {
      case 'inspect_swarm_state':
        return {
          activeLeases: engine.getActiveLeases(),
          tasks: engine.getAllTasks(),
          recentAuditLogs: engine.getAuditLogs(10)
        };

      case 'replay_memory_time_travel':
        if (!args.asOfTimestamp) throw new Error('Missing asOfTimestamp argument');
        return timeTravel.replayAtTimestamp(args.asOfTimestamp);

      case 'query_episodic_vectors':
        if (!args.query) throw new Error('Missing query argument');
        return await vectorMemory.search({
          query: args.query,
          domain: args.domain || null,
          topK: args.topK || 5
        });

      case 'inject_chaos_failure':
        if (!args.agentId) throw new Error('Missing agentId argument');
        return await chaosEngine.killAgent(args.agentId, args.reason || 'MCP_MANUAL_INJECTION');

      default:
        throw new Error(`Unknown MCP tool: ${toolName}`);
    }
  }

  getManifest() {
    return {
      name: this.serverName,
      version: this.version,
      endpoint: this.endpoint,
      tools: this.tools
    };
  }
}

const mcpServer = new CockroachMcpServer();

// Standalone execution support for MCP CLI protocol
if (require.main === module) {
  console.log(JSON.stringify(mcpServer.getManifest(), null, 2));
}

module.exports = mcpServer;
