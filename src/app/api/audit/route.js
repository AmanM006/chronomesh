import { NextResponse } from 'next/server';
const { engine } = require('../../../../db/client');

export async function GET() {
  return NextResponse.json({ logs: engine.getAuditLogs(30) });
}
