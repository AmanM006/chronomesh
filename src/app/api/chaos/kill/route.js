import { NextResponse } from 'next/server';
const chaosEngine = require('../../../../../runtime/chaosEngine');

export async function POST(req) {
  try {
    const { agentId, reason } = await req.json();
    if (!agentId) return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    const outcome = await chaosEngine.killAgent(agentId, reason);
    return NextResponse.json({ outcome });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
