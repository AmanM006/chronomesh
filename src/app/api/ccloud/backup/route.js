import { NextResponse } from 'next/server';
const ccloudAgent = require('../../../../../integrations/ccloudAgent');

export async function POST(req) {
  try {
    const { reason } = await req.json();
    const backup = await ccloudAgent.triggerPointInTimeBackup(reason);
    return NextResponse.json(backup);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
