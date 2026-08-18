'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Play, 
  Sparkles, 
  Lock, 
  Clock, 
  Shield, 
  Cpu, 
  Database, 
  ArrowRight, 
  ArrowUpRight, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  Activity,
  Layers,
  Server
} from 'lucide-react';

export default function ChronoMeshHeroPage() {
  return (
    <div className="min-h-screen w-full bg-black text-neutral-200 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between selection:bg-[#bef264]/30 selection:text-[#bef264]">
      {/* ================= TOP NAVIGATION ================= */}
      <nav className="h-16 border-b border-neutral-800 bg-[#08080a]/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#bef264]/15 border border-[#bef264]/40 flex items-center justify-center">
            <Database className="w-4 h-4 text-[#bef264]" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              ChronoMesh
              <span className="w-2 h-2 rounded-full bg-[#bef264] shadow-[0_0_8px_#bef264]" />
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">Distributed Multi-Agent State & Memory OS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/AmanM006/chronomesh"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-neutral-400 hover:text-white px-3 py-1.5 transition-all flex items-center gap-1"
          >
            GitHub <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <Link
            href="/dashboard"
            className="bg-[#bef264] hover:bg-[#a3e635] text-black font-extrabold text-xs px-4 py-2 rounded-lg transition-all shadow-md shadow-[#bef264]/15 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch Mission Control
          </Link>
        </div>
      </nav>

      {/* ================= HERO MAIN CONTENT ================= */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center space-y-8">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-[#bef264]">
          <Sparkles className="w-3.5 h-3.5 text-[#bef264]" />
          <span>CockroachDB × AWS Hackathon • Build with Agentic Memory</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight max-w-3xl leading-tight">
          The Distributed Memory & Consensus OS for <span className="text-[#bef264]">Autonomous AI Swarms</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-neutral-400 max-w-2xl leading-relaxed">
          Eliminates multi-agent race conditions, state drift, and split-brain failures with SERIALIZABLE distributed row leases, bi-temporal <code className="text-white bg-neutral-900 px-1.5 py-0.5 rounded font-mono text-sm">AS OF SYSTEM TIME</code> forensic replay, and native <code className="text-white bg-neutral-900 px-1.5 py-0.5 rounded font-mono text-sm">VECTOR(1536)</code> recall.
        </p>

        {/* Primary Call to Action */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard"
            className="bg-[#bef264] hover:bg-[#a3e635] text-black font-extrabold text-sm px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-[#bef264]/20 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Enter Mission Control Console (Live Demo)
          </Link>

          <a
            href="https://github.com/AmanM006/chronomesh"
            target="_blank"
            rel="noreferrer"
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm px-6 py-3.5 rounded-xl border border-neutral-700 flex items-center justify-center gap-2 transition-all"
          >
            <Terminal className="w-4 h-4 text-neutral-400" />
            View Architecture & Schema
          </a>
        </div>

        {/* Live Cloud Status Banner */}
        <div className="w-full max-w-2xl p-4 rounded-2xl bg-[#0c0c0e] border border-neutral-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-[#bef264] shadow-[0_0_8px_#bef264]" />
            <span>Connected Cluster: <strong className="text-white">sage-manatee</strong></span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400">
            <span>GCP Mumbai</span>
            <span className="text-[#bef264] font-bold">~46ms Latency</span>
            <span className="px-2 py-0.5 rounded bg-[#bef264]/10 text-[#bef264] border border-[#bef264]/30 font-bold">SERIALIZABLE</span>
          </div>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left w-full">
          <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-neutral-800 space-y-2.5 hover:border-[#bef264]/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#bef264]/10 border border-[#bef264]/30 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#bef264]" />
            </div>
            <h3 className="text-sm font-bold text-white">Distributed Row Leases</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Atomic row-level mutex with CockroachDB <code className="text-neutral-300">SELECT ... FOR UPDATE</code>. Prevents agents from colliding on shared state.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-neutral-800 space-y-2.5 hover:border-cyan-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Bi-Temporal Time Travel</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Native historical replay with <code className="text-neutral-300">AS OF SYSTEM TIME</code>. Inspect past cognition frames and debug hallucinatory decisions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-neutral-800 space-y-2.5 hover:border-purple-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Chaos & Zero-Loss Failover</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Autonomous standby recovery in 14ms (0.00s RTO). Survives container SIGKILL and multi-region network partitions with zero data loss.
            </p>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-neutral-800 py-6 px-8 flex items-center justify-between text-xs text-neutral-500 font-mono">
        <span>ChronoMesh • Built with CockroachDB Cloud & AWS Bedrock</span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-neutral-400 hover:text-[#bef264] transition-all">Open Console →</Link>
          <a href="https://github.com/AmanM006/chronomesh" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-all">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
