/**
 * Chaos & Self-Healing Engine for ChronoMesh
 * Proves zero-state-loss failover under simulated AWS node/container crashes
 */
const { engine } = require('../db/client');
const leaseManager = require('./leaseManager');
const EventEmitter = require('events');

class ChaosEngine extends EventEmitter {
  constructor() {
    super();
    this.killedAgents = new Set();
    this.chaosLogs = [];
  }

  // Inject Agent Container Crash (Simulates ECS / Lambda kill)
  async killAgent(agentId, reason = 'AWS_CONTAINER_SIGKILL') {
    this.killedAgents.add(agentId);
    
    // Stop all active heartbeats for this agent
    for (const [key, lease] of engine.leases.entries()) {
      if (lease.agentId === agentId && lease.status === 'ACTIVE') {
        leaseManager.stopHeartbeat(key);
        // Force immediate expiration to simulate abrupt death
        lease.expiresAt = new Date(Date.now() - 1000).toISOString();
        lease.status = 'EXPIRED_CRASHED';
      }
    }

    const log = {
      event: 'CHAOS_INJECTION_AGENT_KILLED',
      agentId,
      reason,
      timestamp: new Date().toISOString()
    };
    this.chaosLogs.push(log);
    
    engine.recordAudit({
      eventType: 'CHAOS_AGENT_CRASHED',
      agentId,
      details: { reason }
    });

    this.emit('agentKilled', log);

    // Trigger immediate self-healing election
    return this.triggerSelfHealingElection(agentId);
  }

  // Autonomous Self-Healing: Standby agent detects dead lease, claims state, resumes task
  async triggerSelfHealingElection(crashedAgentId) {
    const recoveryLog = {
      event: 'AUTONOMOUS_FAILOVER_TRIGGERED',
      crashedAgent: crashedAgentId,
      standbyAgent: 'AGENT_STANDBY_GUARDIAN',
      recoveredTasks: [],
      timestamp: new Date().toISOString()
    };

    // Find tasks that were in-flight for crashed agent
    const allTasks = engine.getAllTasks();
    const orphanedTasks = allTasks.filter(t => t.assignedAgent === crashedAgentId && t.status === 'IN_PROGRESS');

    for (const task of orphanedTasks) {
      // Re-claim lease atomically with standby agent
      const leaseResult = await leaseManager.acquire({
        resourceKey: `task_lock:${task.taskId}`,
        agentId: 'AGENT_STANDBY_GUARDIAN',
        agentRole: 'Standby Failover Guardian',
        priority: 10,
        payload: { failoverFrom: crashedAgentId, originalStep: task.currentStep }
      });

      if (leaseResult.success) {
        task.status = 'RECOVERED';
        task.assignedAgent = 'AGENT_STANDBY_GUARDIAN';
        task.checkpointState = {
          ...task.checkpointState,
          recoveredAt: new Date().toISOString(),
          recoveredFromAgent: crashedAgentId,
          resumedAtStep: task.currentStep
        };
        engine.saveTask(task);
        recoveryLog.recoveredTasks.push(task.taskId);
      }
    }

    engine.recordAudit({
      eventType: 'FAILOVER_COMPLETED',
      agentId: 'AGENT_STANDBY_GUARDIAN',
      details: recoveryLog
    });

    this.emit('failoverCompleted', recoveryLog);
    return recoveryLog;
  }

  // Restore a killed agent
  reviveAgent(agentId) {
    this.killedAgents.delete(agentId);
    this.emit('agentRevived', { agentId, timestamp: new Date().toISOString() });
  }

  isAgentAlive(agentId) {
    return !this.killedAgents.has(agentId);
  }

  getChaosLogs() {
    return this.chaosLogs;
  }
}

module.exports = new ChaosEngine();
