import { NextResponse } from 'next/server';

const merkleEngine = require('../../../../../runtime/merkleEngine');
const dbClient = require('../../../../../db/client');

export async function POST() {
  try {
    const proof = await merkleEngine.buildAndVerifyMerkleChain();
    return NextResponse.json({
      success: true,
      proof,
      isLiveDb: dbClient.isLive
    });
  } catch (error) {
    console.error('[Merkle Verify API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
