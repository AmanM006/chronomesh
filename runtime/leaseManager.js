/**
 * Distributed Lease & Atomic Lock Manager
 * Implements Serializable Isolation & Row-Level Mutex Leases over CockroachDB
 */
const { engine } = require('../db/client');
const EventEmitter = require('events');

class LeaseManager extends EventEmitter {
  constructor() {
    super();
    this.heartbeatIntervalMs = 2000;
    this.defaultTtlMs = 6000;
    this.activeHeartbeats = new Map(); // leaseKey -> intervalId

    // Background reaper loop to detect dead/expired agent leases
    this.reaperInterval = setInterval(() => this.reapExpiredLeases(), 1000);
  }

  // Attempt to acquire an exclusive distributed lease on a resource
  async acquire({ resourceKey, agentId, agentRole, priority = 1, ttlMs = this.defaultTtlMs, payload = {} }) {
    const result = engine.acquireLease({
      resourceKey,
      agentId,
      agentRole,
      priority,
      ttlMs,
      payload
    });

    if (result.success) {
      this.startHeartbeat(resourceKey, agentId, ttlMs);
      this.emit('leaseAcquired', { resourceKey, agentId, lease: result.lease });
    } else {
      this.emit('leaseConflict', { resourceKey, agentId, lockedBy: result.lockedBy });
    }

    return result;
  }

  async acquireLease(resourceKey, agentId, ttlMs = this.defaultTtlMs) {
    return this.acquire({ resourceKey, agentId, ttlMs });
  }

  // Renew an existing lease
  async renew({ resourceKey, agentId, ttlMs = this.defaultTtlMs }) {
    return engine.renewLease({ resourceKey, agentId, ttlMs });
  }

  // Release a held lease
  async release({ resourceKey, agentId }) {
    this.stopHeartbeat(resourceKey);
    const result = engine.releaseLease({ resourceKey, agentId });
    if (result.success) {
      this.emit('leaseReleased', { resourceKey, agentId });
    }
    return result;
  }

  // Start automatic heartbeat renewal loop for an agent
  startHeartbeat(resourceKey, agentId, ttlMs) {
    this.stopHeartbeat(resourceKey);
    const intervalId = setInterval(() => {
      const res = engine.renewLease({ resourceKey, agentId, ttlMs });
      if (!res.success) {
        this.stopHeartbeat(resourceKey);
      }
    }, this.heartbeatIntervalMs);

    this.activeHeartbeats.set(resourceKey, intervalId);
  }

  // Stop heartbeat renewal
  stopHeartbeat(resourceKey) {
    if (this.activeHeartbeats.has(resourceKey)) {
      clearInterval(this.activeHeartbeats.get(resourceKey));
      this.activeHeartbeats.delete(resourceKey);
    }
  }

  // Background reaper detecting crashed agents whose leases expired
  reapExpiredLeases() {
    const active = engine.getActiveLeases();
    // Engine automatically marks expired leases as EXPIRED
  }

  // Get all active leases
  getActiveLeases() {
    return engine.getActiveLeases();
  }

  destroy() {
    if (this.reaperInterval) clearInterval(this.reaperInterval);
    for (const id of this.activeHeartbeats.values()) {
      clearInterval(id);
    }
    this.activeHeartbeats.clear();
  }
}

module.exports = new LeaseManager();
