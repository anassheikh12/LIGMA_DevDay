import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { colorForIndex } from '@/lib/cursor-colors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id: roomId } = await params;
    const db = await getDb();

    const room = await db.collection('rooms').findOne({ roomId });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const existing = await db
      .collection('room_members')
      .findOne({ roomId, userId: session.userId });
    if (existing) {
      return NextResponse.json({ role: existing.role, color: existing.color });
    }

    const existingCount = await db
      .collection('room_members')
      .countDocuments({ roomId });
    const color = colorForIndex(existingCount);
    const role = room.ownerId === session.userId ? 'owner' : 'member';

    await db.collection('room_members').insertOne({
      roomId,
      userId: session.userId,
      role,
      color,
      joinedAt: new Date(),
    });

    return NextResponse.json({ role, color });
  } catch (error) {
    console.error('Failed to join room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
