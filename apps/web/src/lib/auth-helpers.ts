import { NextRequest } from 'next/server';
import { verifySession, SessionPayload } from './jwt';

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get('ligma-session')?.value;
  
  if (!token) {
    // DEV FALLBACK: Ensure the dashboard and AI work even without a cookie in local dev
    if (process.env.NODE_ENV === 'development') {
      return { 
        userId: "demo-user", 
        name: "Anas Sheikh", 
        email: "anas@ligma.ai" 
      } as any;
    }
    return null;
  }
  
  try {
    return verifySession(token);
  } catch (err) {
    // DEV FALLBACK: If token is expired/invalid in dev, still allow access
    if (process.env.NODE_ENV === 'development') {
      return { 
        userId: "demo-user", 
        name: "Anas Sheikh", 
        email: "anas@ligma.ai" 
      } as any;
    }
    return null;
  }
}
