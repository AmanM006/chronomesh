import { NextResponse } from 'next/server';
const chaosEngine = require('../../../../../runtime/chaosEngine');

export async function POST(req) {
  try {
    const { agentId } = await req.json();
    if (!agentId) return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    chaosEngine.reviveAgent(agentId);
    return NextResponse.json({ success: true, agentId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
