import { NextResponse } from 'next/server';
const vectorMemory = require('../../../../../runtime/vectorMemory');

export async function POST(req) {
  try {
    const { query, domain, topK } = await req.json();
    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    const results = await vectorMemory.search({ query, domain, topK: topK || 5 });
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
