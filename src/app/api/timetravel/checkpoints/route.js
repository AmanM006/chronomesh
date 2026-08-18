import { NextResponse } from 'next/server';
const timeTravel = require('../../../../../runtime/timeTravel');

export async function GET() {
  return NextResponse.json({ checkpoints: timeTravel.getTimelineCheckpoints() });
}
