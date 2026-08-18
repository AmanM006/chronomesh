import { NextResponse } from 'next/server';
const ccloudAgent = require('../../../../integrations/ccloudAgent');

export async function GET() {
  const health = await ccloudAgent.getClusterHealth();
  return NextResponse.json(health);
}
