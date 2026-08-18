import { NextResponse } from 'next/server';
const timeTravel = require('../../../../../runtime/timeTravel');

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const asOf = searchParams.get('asOf');
  if (!asOf) return NextResponse.json({ error: 'asOf timestamp is required' }, { status: 400 });
  const snapshot = timeTravel.replayAtTimestamp(asOf);
  return NextResponse.json(snapshot);
}
