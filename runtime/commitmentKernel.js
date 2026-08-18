/**
 * ChronoMesh Distributed Commitment & Promise Kernel (Styx-Grade)
 * Coordinates binding multi-agent promises and resource reservations
 * (deploy slots, GPU workers, database shards) using CockroachDB SERIALIZABLE transactions
 * with bounded 40001 serialization-failure retry logic and typed ResourceConflict signals.
 */
const dbClient = require('../db/client');

class CommitmentKernel {
  constructor() {
    this.inMemoryCommitments = [];
    this.resourceCapacities = {
      'GPU_CLUSTER_A100': 4,
      'PRODUCTION_DEPLOY_SLOT': 1,
      'SHARD_RECOVERY_LOCK': 1,
      'DATABASE_PARTITION_HEALER': 2
    };
  }

  /**
   * Reserve a resource commitment inside CockroachDB with 40001 retry backoff
   */
  async makeCommitment({ promiseKey, promiserAgent, beneficiaryAgent, resourceType, quantity = 1, ttlSeconds = 60 }) {
    const maxRetries = 5;
    let attempt = 0;
    const startMs = Date.now();
    const capacity = this.resourceCapacities[resourceType] || 1;

    while (attempt < maxRetries) {
      attempt++;
      try {
        if (dbClient.isLive) {
          // CockroachDB SERIALIZABLE transaction with capacity check
          const client = await dbClient.pool.connect();
          try {
            await client.query('BEGIN PRIORITY HIGH;');

            // 1. Calculate currently active allocated quantity
            const usageRes = await client.query(`
              SELECT COALESCE(SUM(allocated_quantity), 0) as current_usage
              FROM agent_commitments
              WHERE resource_type = $1
                AND status = 'ACTIVE'
                AND expires_at > clock_timestamp();
            `, [resourceType]);

            const currentUsage = parseInt(usageRes.rows[0]?.current_usage || 0, 10);
            const available = capacity - currentUsage;

            // 2. If insufficient capacity, reject with ResourceConflict
            if (available < quantity) {
              await client.query('ROLLBACK;');
              const conflictRes = await client.query(`
                SELECT promiser_agent, beneficiary_agent, allocated_quantity, expires_at - clock_timestamp() as remaining_ttl
                FROM agent_commitments
                WHERE resource_type = $1 AND status = 'ACTIVE' AND expires_at > clock_timestamp()
                ORDER BY expires_at ASC
                LIMIT 1;
              `, [resourceType]);

              const activeHolder = conflictRes.rows[0] || {};
              return {
                committed: false,
                status: 'RESOURCE_CONFLICT',
                reason: `Capacity exceeded for [${resourceType}]. Required: ${quantity}, Available: ${available}/${capacity}.`,
                conflictDetails: {
                  resourceType,
                  currentHolder: activeHolder.promiser_agent || 'UNKNOWN_AGENT',
                  remainingTtl: activeHolder.remaining_ttl || '30s',
                  suggestedRetryMs: 2500
                },
                attempt,
                latencyMs: Date.now() - startMs
              };
            }

            // 3. Insert commitment atomically
            const insertRes = await client.query(`
              INSERT INTO agent_commitments (promise_key, promiser_agent, beneficiary_agent, resource_type, allocated_quantity, expires_at, status)
              VALUES ($1, $2, $3, $4, $5, clock_timestamp() + ($6 || ' seconds')::INTERVAL, 'ACTIVE')
              RETURNING commitment_id, created_at, expires_at;
            `, [promiseKey, promiserAgent, beneficiaryAgent, resourceType, quantity, ttlSeconds]);

            await client.query('COMMIT;');

            return {
              committed: true,
              status: 'COMMITTED',
              commitmentId: insertRes.rows[0].commitment_id,
              promiseKey,
              promiserAgent,
              beneficiaryAgent,
              resourceType,
              allocatedQuantity: quantity,
              capacityRemaining: available - quantity,
              totalCapacity: capacity,
              expiresAt: insertRes.rows[0].expires_at,
              attempt,
              latencyMs: Date.now() - startMs,
              isolationLevel: 'SERIALIZABLE'
            };
          } catch (txErr) {
            await client.query('ROLLBACK;').catch(() => {});
            // Check for CockroachDB 40001 (serialization_failure / retry transaction)
            if (txErr.code === '40001' && attempt < maxRetries) {
              const backoff = Math.min(50 * Math.pow(2, attempt) + Math.random() * 25, 500);
              await new Promise(r => setTimeout(r, backoff));
              continue;
            }
            throw txErr;
          } finally {
            client.release();
          }
        }

        // In-Memory Fallback
        const now = Date.now();
        const activeUsage = this.inMemoryCommitments
          .filter(c => c.resourceType === resourceType && c.status === 'ACTIVE' && new Date(c.expiresAt).getTime() > now)
          .reduce((sum, c) => sum + c.quantity, 0);

        const available = capacity - activeUsage;
        if (available < quantity) {
          return {
            committed: false,
            status: 'RESOURCE_CONFLICT',
            reason: `In-memory capacity exhausted for [${resourceType}]. Available: ${available}/${capacity}.`,
            conflictDetails: { resourceType, suggestedRetryMs: 1500 },
            attempt: 1,
            latencyMs: Date.now() - startMs
          };
        }

        const commitment = {
          commitmentId: `COMM_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          promiseKey,
          promiserAgent,
          beneficiaryAgent,
          resourceType,
          quantity,
          status: 'ACTIVE',
          expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };

        this.inMemoryCommitments.unshift(commitment);
        return {
          committed: true,
          status: 'COMMITTED',
          commitmentId: commitment.commitmentId,
          promiseKey,
          resourceType,
          allocatedQuantity: quantity,
          capacityRemaining: available - quantity,
          totalCapacity: capacity,
          expiresAt: commitment.expiresAt,
          attempt: 1,
          latencyMs: Date.now() - startMs,
          isolationLevel: 'SERIALIZABLE (SIMULATED)'
        };
      } catch (err) {
        if (attempt >= maxRetries) {
          return { committed: false, status: 'ERROR', error: err.message, attempts: attempt };
        }
      }
    }
  }

  async listCommitments() {
    if (dbClient.isLive) {
      try {
        const res = await dbClient.query(`
          SELECT commitment_id, promise_key, promiser_agent, beneficiary_agent, resource_type, allocated_quantity, status, expires_at, created_at
          FROM agent_commitments
          ORDER BY created_at DESC
          LIMIT 20;
        `);
        return res.rows.map(r => ({
          commitmentId: r.commitment_id,
          promiseKey: r.promise_key,
          promiserAgent: r.promiser_agent,
          beneficiaryAgent: r.beneficiary_agent,
          resourceType: r.resource_type,
          quantity: r.allocated_quantity,
          status: r.status,
          expiresAt: r.expires_at,
          createdAt: r.created_at
        }));
      } catch (e) {
        console.warn('[Commitment Read Note]', e.message);
      }
    }
    return this.inMemoryCommitments;
  }
}

module.exports = new CommitmentKernel();
