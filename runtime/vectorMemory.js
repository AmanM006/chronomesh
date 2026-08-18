/**
 * Episodic Vector Memory Layer for ChronoMesh
 * Integrates CockroachDB Distributed Vector Indexing with Amazon Bedrock Titan Embeddings
 */
const { engine } = require('../db/client');
const bedrockClient = require('./bedrockClient');

class VectorMemoryManager {
  constructor() {
    this._seedInitialEpisodicMemories();
  }

  // Insert a new episodic vector memory
  async store({ agentId, domain, taskId, content, metadata = {}, importanceScore = 1.0 }) {
    const embedding = await bedrockClient.getEmbedding(content);
    const memory = engine.insertVector({
      agentId,
      domain,
      taskId,
      content,
      embedding,
      metadata,
      importanceScore
    });

    engine.recordAudit({
      eventType: 'VECTOR_MEMORY_STORED',
      agentId,
      details: { memoryId: memory.memoryId, domain, taskId, preview: content.slice(0, 60) }
    });

    return memory;
  }

  // Hybrid vector search: Cosine similarity + metadata filtering
  async search({ query, domain = null, topK = 5, minScore = 0.0 }) {
    const queryEmbedding = await bedrockClient.getEmbedding(query);
    return engine.searchVectors({
      queryEmbedding,
      domain,
      topK,
      minScore
    });
  }

  async searchVectors(query, topK = 5, domain = null) {
    return this.search({ query, topK, domain });
  }

  async storeMemory(params) {
    return this.store(params);
  }

  // Seed rich realistic historical memories
  async _seedInitialEpisodicMemories() {
    const seedData = [
      {
        agentId: 'AGENT_SRE_FORENSICS',
        domain: 'INFRASTRUCTURE_INCIDENT',
        taskId: 'INC-9042',
        content: 'PostgreSQL connection pool exhaustion caused by unclosed cursor loops in checkout microservice. Mitigated by enforcing statement timeouts and scaling read replicas in us-east-1.',
        metadata: { severity: 'P1', region: 'us-east-1', resolution_time_mins: 14 }
      },
      {
        agentId: 'AGENT_FINOPS_AUDIT',
        domain: 'FINANCIAL_COMPLIANCE',
        taskId: 'AUD-3011',
        content: 'Cross-border settlement discrepancy detected between EU-Central-1 ledger and US-East-1 clearinghouse. Resolved via CockroachDB serializable two-phase commit consensus.',
        metadata: { regulator: 'SEC_FINRA', discrepancy_usd: 450000 }
      },
      {
        agentId: 'AGENT_CHAOS_GUARDIAN',
        domain: 'CHAOS_ENGINEERING',
        taskId: 'CHAOS-771',
        content: 'Simulated AZ partition during peak swarm write traffic. CockroachDB multi-region Raft ranges maintained 100% write quorum without split-brain anomalies.',
        metadata: { survival_rate: 1.0, data_loss_bytes: 0 }
      },
      {
        agentId: 'AGENT_SRE_FORENSICS',
        domain: 'INFRASTRUCTURE_INCIDENT',
        taskId: 'INC-8812',
        content: 'Deadlock cascade observed during concurrent batch updates to user wallet balances. Solution: enforce strict alphabetical ordering on resource lock acquisition.',
        metadata: { root_cause: 'LOCK_ORDER_INVERSION', fixed_in_commit: 'a9f2c1' }
      },
      {
        agentId: 'AGENT_DATABASE_TUNER',
        domain: 'DATABASE_OPTIMIZATION',
        taskId: 'OPT-109',
        content: 'High latency on vector index scan over 5M embeddings. Resolved by adjusting CockroachDB ivfflat lists parameter and partitioning index ranges across regional leaseholders.',
        metadata: { latency_reduction: '74%', speedup_factor: 3.8 }
      }
    ];

    for (const item of seedData) {
      await this.store(item);
    }
  }

  getAllVectors() {
    return engine.vectors;
  }
}

module.exports = new VectorMemoryManager();
