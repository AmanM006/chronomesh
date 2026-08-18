# 🎬 ChronoMesh Video Demo Script
**Target Duration:** `2m 45s` (Optimal for judges)  
**URL to have open in browser:** `https://chronomesh.vercel.app` (or `http://localhost:3050`)

---

### **[0:00 - 0:25] The Killer Hook & The Problem**

| ⏱️ Timestamp | 🖥️ What to Show on Screen | 🎙️ Voiceover (What to Say) |
| :--- | :--- | :--- |
| **0:00 - 0:10** | Start on the **Landing Page** (`/`). Scroll smoothly over the headline: *"The Distributed Memory & Consensus OS for Autonomous AI Swarms"*. | *"AI agent swarms are moving into mission-critical infrastructure and finance. But today, they suffer from four fatal vulnerabilities: memory race conditions, silent hallucination poisoning, irreversible cognition, and catastrophic container crashes."* |
| **0:10 - 0:25** | Click the **"Enter Mission Control Console"** button. The dashboard opens showing the live cluster status `sage-manatee (GCP Mumbai)`. | *"To solve this, we built **ChronoMesh**—a distributed neural operating system that transforms CockroachDB into the resilient system of record for autonomous agent swarms."* |

---

### **[0:25 - 0:55] Feature 1: Autonomous Multi-Agent DAG & Leases**

| ⏱️ Timestamp | 🖥️ What to Show on Screen | 🎙️ Voiceover (What to Say) |
| :--- | :--- | :--- |
| **0:25 - 0:40** | Stay on **Agent Flow Canvas**. In the custom goal bar, leave or type: *"Investigate high CPU deadlock on payment-gateway shard-2"*. Click **"Execute Goal"**. | *"Here on the Agent Flow Canvas, judges can type any custom incident prompt. In real time, ChronoMesh coordinates four specialized agents in sequence:"* |
| **0:40 - 0:55** | Point your mouse at the 4 steps appearing in green and the agent cards: **Atlas**, **Sentinel**, **Veritas**, **Aegis**. | *"Atlas decomposes the goal and secures a `SERIALIZABLE` distributed row lease with active heartbeats. Sentinel retrieves episodic vector memories and writes to working scratchpad with native Row-Level TTL. Veritas verifies regional data locality and computes a Merkle state hash, while Aegis monitors heartbeat continuity with zero deadlocks."* |

---

### **[0:55 - 1:30] Feature 2: Memory-Grounded Q&A (`pgvector` + Bedrock)**

| ⏱️ Timestamp | 🖥️ What to Show on Screen | 🎙️ Voiceover (What to Say) |
| :--- | :--- | :--- |
| **0:55 - 1:10** | Click on the **"Memory Q&A"** tab in the sidebar. Click the preset button: *"What caused the PostgreSQL deadlock?"* and click **"Ask"**. | *"Next, let's look at retrieval-augmented agent cognition. When an agent or operator asks a natural language question, ChronoMesh embeds it via Amazon Titan into a 1536-dimensional vector."* |
| **1:10 - 1:30** | Scroll down to show the **Retrieved Memories** cards (with $94\%$ match badges) and the **Grounded Answer** powered by Claude on Bedrock. | *"It runs a native cosine similarity search (`<=>`) directly on CockroachDB's `episodic_vectors` table in under 2ms. Claude 3.5 Sonnet on AWS Bedrock then generates a grounded, factual answer citing the exact memory records and the SQL statement executed."* |

---

### **[1:30 - 1:55] Feature 3: Write-Gate & Contradiction Defense**

| ⏱️ Timestamp | 🖥️ What to Show on Screen | 🎙️ Voiceover (What to Say) |
| :--- | :--- | :--- |
| **1:30 - 1:40** | Click on the **"Write-Gate Defense"** tab. Click the red button: *"😈 Try Hallucination / Poison"*. | *"To prevent memory poisoning and hallucination drift, we built an automated Write-Gate. Let's try injecting an unsafe or contradictory claim into memory."* |
| **1:40 - 1:55** | Click **"Evaluate & Commit"**. Show the red verdict box: `VERDICT: REJECTED / QUARANTINED` and the entry in the `memory_quarantine` table. | *"Instantly, CockroachDB’s cosine contradiction engine and our adversarial verifier flag the conflict and quarantine the fact into CockroachDB's `memory_quarantine` table with complete causal reasons—protecting the swarm from poisoned state."* |

---

### **[1:55 - 2:25] Feature 4: Chaos Lab & Instant 14ms Failover**

| ⏱️ Timestamp | 🖥️ What to Show on Screen | 🎙️ Voiceover (What to Say) |
| :--- | :--- | :--- |
| **1:55 - 2:05** | Click on the **"Chaos & Failover"** tab in the sidebar. | *"Now, what happens if an agent container dies abruptly mid-task?"* |
| **2:05 - 2:25** | Click the red button: **"Kill SRE (Inject Red)"** (or click **"30-Second Judge Proof"**). Watch Sentinel turn RED and Aegis Standby Guardian turn LIME GREEN (`⚡ HEALED & CLAIMED`). | *"We inject a `SIGKILL` terminating the SRE worker container. Within 14 milliseconds, the Aegis Standby Guardian detects the expired lease in CockroachDB, reclaims the task checkpoint, and finishes execution with **zero data loss and zero RTO**."* |

---

### **[2:25 - 2:45] Feature 5: Bi-Temporal Time Travel & Live EXPLAIN Plan**

| ⏱️ Timestamp | 🖥️ What to Show on Screen | 🎙️ Voiceover (What to Say) |
| :--- | :--- | :--- |
| **2:25 - 2:35** | Click on **"Time-Travel Replay"**. Drag the slider backwards to `75%`. Show the reconstructed JSON state matrix. | *"With CockroachDB's native `AS OF SYSTEM TIME`, we can scrub back on the timeline to reconstruct the exact cognitive state and active mutex locks of every agent at any historical millisecond."* |
| **2:35 - 2:45** | Click on **"EXPLAIN Plan Visualizer"**. Click **"Vector Search Plan"** and point out the vectorized scan and low cost metrics. | *"And using our EXPLAIN Plan Visualizer, judges can inspect the actual CockroachDB vectorized execution tree, cosine distance pushdowns, and distributed routing."* |

---

### **[2:45 - 2:55] Conclusion & Call to Action**

| ⏱️ Timestamp | 🖥️ What to Show on Screen | 🎙️ Voiceover (What to Say) |
| :--- | :--- | :--- |
| **2:45 - 2:55** | Switch back to the **Hero Page** or top of **Dashboard** showing the live URL: `https://chronomesh.vercel.app`. | *"ChronoMesh unites CockroachDB distributed ACID locks, pgvector indexing, and Bedrock intelligence into the definitive operating system for AI agent swarms. Try it live right now at **chronomesh.vercel.app**. Thank you!"* |
