import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const rooms = await db
      .collection('rooms')
      .find({ ownerId: session.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Failed to list rooms:', error);
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 });
  }
}
