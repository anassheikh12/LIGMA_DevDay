import { NextResponse } from 'next/server';

export async function GET() {
  const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL || process.env.REALTIME_URL || 'http://localhost:4000';
  return NextResponse.json({ realtimeUrl });
}
