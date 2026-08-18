import { NextResponse } from 'next/server';
const skillsAgent = require('../../../../integrations/skillsAgent');

export async function GET() {
  const fingerprints = await skillsAgent.profileStatementFingerprints();
  const antiPatterns = await skillsAgent.detectSchemaAntiPatterns();
  const deadlock = await skillsAgent.diagnoseDeadlockRisks();
  return NextResponse.json({ fingerprints, antiPatterns, deadlock });
}
