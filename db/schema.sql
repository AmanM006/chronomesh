-- ============================================================================
-- ChronoMesh: Distributed Multi-Agent State & Memory OS Schema
-- CockroachDB Serverless / Dedicated Multi-Region Specification
-- ============================================================================

-- 1. Working Memory Distributed Leases (SERIALIZABLE Row-Level Locks)
CREATE TABLE IF NOT EXISTS memory_leases (
    lease_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_key STRING NOT NULL UNIQUE,
    agent_id STRING NOT NULL,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    expires_at TIMESTAMPTZ NOT NULL,
    version INT8 NOT NULL DEFAULT 1,
    status STRING NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'RELEASED', 'PREEMPTED'))
);

-- 2. Native Working Memory Scratchpad with CockroachDB Row-Level TTL
-- Automatically expired and GC-reclaimed by CockroachDB range engine without cron jobs
CREATE TABLE IF NOT EXISTS working_scratchpad (
    scratchpad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id STRING NOT NULL,
    task_id STRING NOT NULL,
    scratch_key STRING NOT NULL,
    scratch_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp() + INTERVAL '10 minutes'
) WITH (ttl_expiration_expression = 'expires_at');

-- 3. Episodic Vector Memory (CockroachDB Native VECTOR(1536) + Cosine Distance)
CREATE TABLE IF NOT EXISTS episodic_vectors (
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id STRING NOT NULL,
    domain STRING NOT NULL,
    content STRING NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    sovereignty_region STRING NOT NULL DEFAULT 'us-east-1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 4. Bi-Temporal State Frames (Historical AS OF SYSTEM TIME Replay Engine)
CREATE TABLE IF NOT EXISTS state_frames (
    frame_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id STRING NOT NULL,
    step_number INT8 NOT NULL,
    agent_id STRING NOT NULL,
    cognitive_state JSONB NOT NULL,
    state_hash STRING NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 5. Swarm Distributed Task Coordination Machine
CREATE TABLE IF NOT EXISTS swarm_tasks (
    task_id STRING PRIMARY KEY,
    parent_task_id STRING,
    title STRING NOT NULL,
    assigned_agent STRING NOT NULL,
    status STRING NOT NULL DEFAULT 'PENDING',
    retry_count INT8 DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 6. Immutable Merkle Audit Ledger
CREATE TABLE IF NOT EXISTS audit_ledger (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id STRING NOT NULL,
    action STRING NOT NULL,
    entity_key STRING NOT NULL,
    merkle_root STRING NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 7. Write-Gate Quarantine Ledger (Memory Poisoning & Contradiction Defense)
CREATE TABLE IF NOT EXISTS memory_quarantine (
    quarantine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposing_agent STRING NOT NULL,
    candidate_content STRING NOT NULL,
    contradicting_memory_id UUID,
    verifier_verdict STRING NOT NULL DEFAULT 'HELD_FOR_REVIEW',
    verifier_reason STRING NOT NULL,
    confidence_score FLOAT8 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_verdict CHECK (verifier_verdict IN ('HELD_FOR_REVIEW', 'QUARANTINED', 'REJECTED', 'APPROVED_OVERRIDE'))
);

-- 8. Distributed Serializable Commitments & Resource Reservations (Styx/Promise Kernel)
CREATE TABLE IF NOT EXISTS agent_commitments (
    commitment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promise_key STRING NOT NULL,
    promiser_agent STRING NOT NULL,
    beneficiary_agent STRING NOT NULL,
    resource_type STRING NOT NULL,
    allocated_quantity INT8 NOT NULL DEFAULT 1,
    status STRING NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_commitment_status CHECK (status IN ('ACTIVE', 'FULFILLED', 'EXPIRED', 'CONFLICT_REJECTED'))
);

-- 9. Bi-Temporal Fact Ledger (World Valid Time vs Transaction Assertion Time)
CREATE TABLE IF NOT EXISTS bi_temporal_facts (
    fact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject STRING NOT NULL,
    predicate STRING NOT NULL,
    object_value JSONB NOT NULL,
    confidence FLOAT8 NOT NULL DEFAULT 1.0,
    source_agent STRING NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    valid_to TIMESTAMPTZ,
    asserted_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    invalid_at TIMESTAMPTZ,
    invalidated_by UUID
);
