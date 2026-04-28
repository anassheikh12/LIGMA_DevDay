import { NextRequest } from 'next/server';
import { verifySession, SessionPayload } from './jwt';

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get('ligma-session')?.value;
  if (!token) return null;
  return verifySession(token);
}
