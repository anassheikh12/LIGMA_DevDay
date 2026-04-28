import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
};

export function signSession(payload: SessionPayload): string {
  // Use non-null assertion or cast since we checked it at the module level
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as SessionPayload;
  } catch {
    return null;
  }
}
