import { NextResponse } from 'next/server';
const swarm = require('../../../../../runtime/agents');

export async function POST() {
  swarm.runIncidentScenario();
  return NextResponse.json({ started: true, message: 'Global Multi-Region Incident Scenario initiated.' });
}
