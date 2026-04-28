import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { title } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const roomId = uuidv4().slice(0, 8);
    const db = await getDb();

    const room = {
      roomId,
      title,
      ownerId: session.userId,
      createdAt: new Date(),
    };

    await db.collection('rooms').insertOne(room);

    return NextResponse.json(room);
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
