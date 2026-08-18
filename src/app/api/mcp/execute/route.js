import { NextResponse } from 'next/server';
const mcpServer = require('../../../../../integrations/mcpServer');

export async function POST(req) {
  try {
    const { toolName, args } = await req.json();
    const result = await mcpServer.executeTool(toolName, args);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
