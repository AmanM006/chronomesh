import { NextResponse } from 'next/server';

const commitmentKernel = require('../../../../runtime/commitmentKernel');
const dbClient = require('../../../../db/client');

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      promiseKey = `PROMISE_${Date.now()}`,
      promiserAgent = 'AGENT_ORCHESTRATOR',
      beneficiaryAgent = 'AGENT_SRE_FORENSICS',
      resourceType = 'GPU_CLUSTER_A100',
      quantity = 1,
      ttlSeconds = 60
    } = body;

    const result = await commitmentKernel.makeCommitment({
      promiseKey,
      promiserAgent,
      beneficiaryAgent,
      resourceType,
      quantity: parseInt(quantity, 10),
      ttlSeconds: parseInt(ttlSeconds, 10)
    });

    const activeList = await commitmentKernel.listCommitments();

    return NextResponse.json({
      success: true,
      result,
      commitments: activeList,
      isLiveDb: dbClient.isLive,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Commitment API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const activeList = await commitmentKernel.listCommitments();
    return NextResponse.json({
      success: true,
      commitments: activeList,
      isLiveDb: dbClient.isLive
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
