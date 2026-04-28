import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/passwords';
import { signSession } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection('users');

    // Ensure unique index on email
    await users.createIndex({ email: 1 }, { unique: true });

    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    try {
      await users.insertOne({
        userId,
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date(),
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      throw err;
    }

    const token = signSession({ userId, name: trimmedName, email: normalizedEmail });

    const response = NextResponse.json({ userId, name: trimmedName, email: normalizedEmail });
    response.cookies.set('ligma-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup failed:', error);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
