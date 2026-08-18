import { NextResponse } from 'next/server';

const writeGate = require('../../../../../runtime/writeGate');
const dbClient = require('../../../../../db/client');

export async function POST(request) {
  try {
    const body = await request.json();
    const { proposingAgent = 'AGENT_SRE_FORENSICS', content, domain = 'INFRASTRUCTURE_INCIDENT', confidence = 0.95 } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });
    }

    const result = await writeGate.submitFact({
      proposingAgent,
      content,
      domain,
      confidence: parseFloat(confidence)
    });

    const ledger = await writeGate.getQuarantineLedger();

    return NextResponse.json({
      success: true,
      decision: result,
      quarantineLedger: ledger,
      isLiveDb: dbClient.isLive,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[WriteGate API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const ledger = await writeGate.getQuarantineLedger();
    return NextResponse.json({
      success: true,
      quarantineLedger: ledger,
      isLiveDb: dbClient.isLive
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
