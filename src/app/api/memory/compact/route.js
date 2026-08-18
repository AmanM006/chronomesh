import { NextResponse } from 'next/server';
const memoryCompactor = require('../../../../../runtime/memoryCompaction');

export async function POST() {
  try {
    const outcome = await memoryCompactor.executeCompaction();
    return NextResponse.json({ outcome });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
