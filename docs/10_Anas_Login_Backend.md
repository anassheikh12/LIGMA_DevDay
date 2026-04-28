# LIGMA — Anas's Guide: Login System (Backend)

**For:** Anas (Backend / API)
**Tools:** Antigravity (or any AI coding assistant). Prompts work the same.
**Goal:** Build email/password auth APIs + room membership endpoints.
**Time estimate:** ~5–6 hours of focused work.
**Coordination with Hamza:** He's building UI in parallel using mocked responses. When your endpoints work, he flips a flag.

---

## What You're Building

Email + password authentication with persistent accounts, plus per-room membership tracking.

### API Contract (what Hamza expects — match exactly)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/auth/signup` | Create account, set session cookie, return user |
| `POST /api/auth/login` | Verify password, set session cookie, return user |
| `POST /api/auth/logout` | Clear session cookie |
| `GET /api/auth/me` | Return current user from session, or 401 |
| `POST /api/rooms` | Create a new room (must be authenticated) |
| `POST /api/rooms/[id]/join` | Join an existing room, returns `{role, color}` |

### Database Schema (MongoDB collections)

```
users           — persistent accounts
  _id, userId, name, email (unique), passwordHash, createdAt

rooms           — collaborative spaces
  _id, roomId, name, creatorUserId, createdAt

room_members    — links users to rooms with roles
  _id, roomId, userId, role ('lead' | 'contributor' | 'viewer'), color, joinedAt
  Compound unique index on (roomId, userId)
```

---

## How Antigravity Works (vs Claude Code)

Antigravity is Google's IDE-integrated agent. It uses Gemini under the hood. Two practical differences:

1. **Be explicit about file paths.** Always say `apps/web/lib/db.ts`, not just `db.ts`. Gemini sometimes guesses wrong directories in monorepos.
2. **Show, don't tell.** When pasting prompts, prefer showing exact code blocks over describing them in prose. Gemini matches structure better than it interprets descriptions.

The prompts below follow these conventions. They'll work in Antigravity, Cursor, Cline, or anything else.

---

## STEP 0: Pre-flight

In your terminal:

```bash
cd path/to/LIGMA_DevDay
git pull
git checkout -b feat/login-backend
cd apps/web
npm install
```

You also need:
- MongoDB Atlas connection string ready
- A long random `JWT_SECRET` (run `openssl rand -base64 32` or just type 40 random chars)

Open Antigravity in the repo.

---

## STEP 1: Install Dependencies

**Concept:** Each library has one job.
- `mongodb` — talks to MongoDB (raw driver, not Mongoose, simpler for hackathon)
- `jsonwebtoken` — sign/verify session tokens
- `bcryptjs` — hash passwords (you NEVER store plain passwords — security 101)
- `uuid` — generate unique IDs
- Plus their TypeScript types

### Prompt:

```
Inside apps/web/, install these packages with npm:

Production:
- mongodb
- jsonwebtoken
- bcryptjs
- uuid

Dev dependencies:
- @types/jsonwebtoken
- @types/bcryptjs
- @types/uuid

After install, show me the dependencies and devDependencies sections of apps/web/package.json.
```

### Verify
- All packages appear in `package.json`
- No install errors

---

## STEP 2: Set Up Environment Variables

**Concept:** Secrets stay out of git. `.env.local` is auto-loaded by Next.js in dev. `.env.example` is committed so others know what they need.

### Prompt:

```
Create apps/web/.env.local with these placeholder values (I'll fill the real ones manually):

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/ligma?retryWrites=true&w=majority
JWT_SECRET=REPLACE_WITH_LONG_RANDOM_STRING
NEXT_PUBLIC_WS_URL=ws://localhost:4000

Then create apps/web/.env.example with the same keys but empty values:

MONGODB_URI=
JWT_SECRET=
NEXT_PUBLIC_WS_URL=ws://localhost:4000

Verify apps/web/.gitignore includes .env.local. Add it if missing.
```

### Manual step
After this prompt, edit `apps/web/.env.local` yourself:
- Replace MongoDB URI with your real Atlas connection string
- Replace JWT_SECRET with a random string. Generate: `openssl rand -base64 32`

### Verify
- `git status` should NOT show `.env.local`
- It SHOULD show `.env.example`

---

## STEP 3: Create the MongoDB Connection Utility

**Concept — Connection pooling in dev:**
Next.js dev mode hot-reloads modules on every change. Without caching, every change opens a new MongoDB connection until you hit Atlas's connection limit. We cache the client promise on `globalThis` so it survives reloads.

### Prompt:

```
Create the file apps/web/lib/db.ts with this exact content:

import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const c = await clientPromise;
  return c.db();
}

Show me the file when done.
```

### Verify
- File exists at `apps/web/lib/db.ts`
- TypeScript compiles

---

## STEP 4: Create JWT Helpers

**Concept — Stateless sessions:**
Instead of storing sessions in MongoDB, we encode user identity into a signed token. Every request, we verify the signature. Stateless = no DB lookup per request = fast.

### Prompt:

```
Create apps/web/lib/jwt.ts with this content:

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

Show me the file.
```

### Verify
- File exists, TypeScript compiles

---

## STEP 5: Create Password Helpers

**Concept — Why bcrypt:**
Plain SHA256 is too fast — attackers can brute-force a billion guesses per second. bcrypt is intentionally slow (we configure how slow with the "cost factor"). Cost 10 = ~100ms per check, which is invisible to legitimate users but kills brute-force attacks.

### Prompt:

```
Create apps/web/lib/passwords.ts with this content:

import bcrypt from 'bcryptjs';

const COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

Show me the file.
```

### Verify
- File exists, TypeScript compiles

---

## STEP 6: Create a Helper to Read the Session in API Routes

**Concept — DRY auth:**
Every protected route needs to do the same thing: read the cookie, verify the JWT. Centralize this so route handlers stay clean.

### Prompt:

```
Create apps/web/lib/auth-helpers.ts with this content:

import { NextRequest } from 'next/server';
import { verifySession, SessionPayload } from './jwt';

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get('ligma-session')?.value;
  if (!token) return null;
  return verifySession(token);
}

Show me the file.
```

---

## STEP 7: Build POST /api/auth/signup

**Concept — Email uniqueness:**
We use a MongoDB unique index on `email`. If two people try to register with the same email, the database itself rejects the second one. We catch the error code (11000 = duplicate key) and return a clean 409 to the client.

### Prompt:

```
Create apps/web/app/api/auth/signup/route.ts with this content:

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

    // Ensure unique index on email (idempotent — runs every signup but Mongo skips if exists)
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

Show me the file.
```

### Verify with curl

```bash
# Make sure dev server is running: cd apps/web && npm run dev

# Successful signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Anas","email":"anas@test.com","password":"secret123"}' \
  -i
# Should return 200 with user data and Set-Cookie: ligma-session=...

# Duplicate email
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Anas2","email":"anas@test.com","password":"secret123"}'
# Should return 409: {"error":"Email already registered"}

# Bad password
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123"}'
# Should return 400: {"error":"Password must be at least 6 characters"}
```

Then check MongoDB Compass — `users` collection should have one document with hashed password (NOT plain text).

---

## STEP 8: Build POST /api/auth/login

### Prompt:

```
Create apps/web/app/api/auth/login/route.ts with this content:

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/passwords';
import { signSession } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: normalizedEmail });

    if (!user) {
      // Use same error message for missing user and wrong password to prevent user enumeration
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signSession({
      userId: user.userId,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({
      userId: user.userId,
      name: user.name,
      email: user.email,
    });

    response.cookies.set('ligma-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

Show me the file.
```

### Verify with curl

```bash
# Login as the user you signed up
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anas@test.com","password":"secret123"}' \
  -c /tmp/anas-session.txt
# Should return 200 with user data, save cookie

# Wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anas@test.com","password":"wrong"}'
# Should return 401: {"error":"Invalid email or password"}

# Non-existent email
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ghost@test.com","password":"whatever"}'
# Should ALSO return 401 (same message — security by obscurity)
```

---

## STEP 9: Build POST /api/auth/logout and GET /api/auth/me

### Prompt:

```
Create two files:

FILE 1: apps/web/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('ligma-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

FILE 2: apps/web/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      name: session.name,
      email: session.email,
    },
  });
}

Show me both files.
```

### Verify

```bash
# Test /me with the cookie from login
curl http://localhost:3000/api/auth/me -b /tmp/anas-session.txt
# Should return 200 with user data

# Test /me without cookie
curl http://localhost:3000/api/auth/me
# Should return 401: {"authenticated":false}

# Test logout
curl -X POST http://localhost:3000/api/auth/logout -b /tmp/anas-session.txt -c /tmp/after-logout.txt
# Should return {"ok":true} and set ligma-session to empty

# Now /me should fail
curl http://localhost:3000/api/auth/me -b /tmp/after-logout.txt
# Should return 401
```

---

## STEP 10: Build POST /api/rooms (now requires auth)

**What's different from before:** This endpoint now requires the user to be logged in. It records who created the room.

### Prompt:

```
Create apps/web/app/api/rooms/route.ts with this content:

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Room name too long (max 100)' }, { status: 400 });
    }

    const roomId = uuidv4().slice(0, 8);
    const trimmedName = name.trim();
    const db = await getDb();

    await db.collection('rooms').insertOne({
      roomId,
      name: trimmedName,
      creatorUserId: session.userId,
      createdAt: new Date(),
    });

    // Auto-add creator as Lead in room_members
    await db.collection('room_members').createIndex(
      { roomId: 1, userId: 1 },
      { unique: true }
    );

    await db.collection('room_members').insertOne({
      roomId,
      userId: session.userId,
      role: 'lead',
      color: '#E63946',
      joinedAt: new Date(),
    });

    return NextResponse.json({ roomId, name: trimmedName });
  } catch (error) {
    console.error('Create room failed:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

Show me the file.
```

### Verify

```bash
# Without session — should fail
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room"}'
# 401

# With session
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint Planning"}' \
  -b /tmp/anas-session.txt
# 200 with roomId
```

Check MongoDB:
- `rooms` collection has the room with `creatorUserId`
- `room_members` collection has Anas linked to the room with role 'lead'

---

## STEP 11: Build POST /api/rooms/[id]/join

**Concept — Idempotent join:**
If the user is already a member of the room, return their existing role instead of creating a duplicate record. This is what "idempotent" means — calling the endpoint twice produces the same result as calling it once.

### Prompt:

```
Create apps/web/app/api/rooms/[id]/join/route.ts with this content:

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-helpers';

const USER_COLORS = [
  '#E63946',
  '#1E3A8A',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#0EA5E9',
];

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
      return NextResponse.json({
        roomId,
        userId: session.userId,
        name: session.name,
        role: existing.role,
        color: existing.color,
      });
    }

    const memberCount = await db
      .collection('room_members')
      .countDocuments({ roomId });

    const color = USER_COLORS[memberCount % USER_COLORS.length];

    await db.collection('room_members').insertOne({
      roomId,
      userId: session.userId,
      role: 'contributor',
      color,
      joinedAt: new Date(),
    });

    return NextResponse.json({
      roomId,
      userId: session.userId,
      name: session.name,
      role: 'contributor',
      color,
    });
  } catch (error) {
    console.error('Join room failed:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}

Show me the file.
```

### Verify

```bash
# Anas is creator — joining his own room returns role 'lead' (already a member)
curl -X POST http://localhost:3000/api/rooms/PASTE_ROOM_ID/join \
  -b /tmp/anas-session.txt

# Sign up a second user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Hamza","email":"hamza@test.com","password":"secret123"}' \
  -c /tmp/hamza-session.txt

# Hamza joins the same room — should get role 'contributor'
curl -X POST http://localhost:3000/api/rooms/PASTE_ROOM_ID/join \
  -b /tmp/hamza-session.txt
# Returns role 'contributor'

# Hamza joins again (idempotent)
curl -X POST http://localhost:3000/api/rooms/PASTE_ROOM_ID/join \
  -b /tmp/hamza-session.txt
# Returns same role 'contributor', no new record

# Try joining a non-existent room
curl -X POST http://localhost:3000/api/rooms/doesnotexist/join \
  -b /tmp/hamza-session.txt
# 404
```

Check MongoDB — `room_members` should have exactly two records (Anas as lead, Hamza as contributor).

---

## STEP 12: Test Everything Once More

Run a clean end-to-end test from scratch:

```bash
# 1. Signup creates session
SIGNUP=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"E2E User","email":"e2e@test.com","password":"testtest"}' \
  -c /tmp/e2e.txt)
echo "Signup: $SIGNUP"

# 2. /me returns user
curl -s http://localhost:3000/api/auth/me -b /tmp/e2e.txt

# 3. Create room
ROOM=$(curl -s -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Room"}' \
  -b /tmp/e2e.txt)
echo "Room: $ROOM"

# 4. Join (returns lead since they created it)
ROOM_ID=$(echo $ROOM | grep -o '"roomId":"[^"]*"' | cut -d'"' -f4)
curl -s -X POST http://localhost:3000/api/rooms/$ROOM_ID/join -b /tmp/e2e.txt

# 5. Logout
curl -s -X POST http://localhost:3000/api/auth/logout -b /tmp/e2e.txt -c /tmp/e2e-after.txt

# 6. /me returns 401
curl -s http://localhost:3000/api/auth/me -b /tmp/e2e-after.txt
```

Each response should match the contract from Step 0. If anything's off, fix it before pushing.

---

## STEP 13: Commit and Push

```bash
git add apps/web/lib/db.ts
git add apps/web/lib/jwt.ts
git add apps/web/lib/passwords.ts
git add apps/web/lib/auth-helpers.ts
git add apps/web/app/api/auth/
git add apps/web/app/api/rooms/
git add apps/web/.env.example
git add apps/web/package.json apps/web/package-lock.json

# DO NOT add .env.local — confirm it's not staged
git status
# .env.local should be untracked, not staged

git commit -m "feat(api): email/password auth + room membership"
git push origin feat/login-backend
```

Open a PR. Tag Hamza. Tell him to flip his `USE_MOCK_API` flags in `lib/auth-client.ts` and `RoomClient.tsx`.

---

## STEP 14: Integration Test With Hamza

After your PR merges:

1. Hamza pulls main, flips mock flags to false
2. Both of you start `apps/web` with `npm run dev`
3. Walk through the full flow:
   - Land on `/`, click "Sign up"
   - Create account → redirected to `/dashboard`
   - Create a room → redirected to `/room/abc12345`
   - "You're in!" placeholder
   - Open second browser (e.g., Firefox)
   - Visit same `/room/abc12345` URL → redirects to `/login?redirect=/room/abc12345`
   - Sign up a different account → redirected back to `/room/abc12345`
   - Should join as contributor
4. Open MongoDB Compass — verify:
   - `users`: 2 docs (with hashed passwords, NEVER plain)
   - `rooms`: 1 doc with creator
   - `room_members`: 2 docs (one lead, one contributor)

If everything passes, you're done with the auth phase.

---

## What's Next After This

Once login works end-to-end:

1. **Adding session validation to the realtime server** — when WebSocket connects, read the `ligma-session` cookie, verify the JWT, attach user info to the socket. This is what makes RBAC work for the canvas.
2. **Gemini classification endpoint** (`/api/classify`) — takes node text, returns intent.
3. **Events endpoint** (`/api/events?roomId=`) — for time-travel replay.

I'll write guides for those when you're ready.

---

## Common Issues + Fixes

**MongoDB connection timeout from your laptop**
Atlas blocks IPs by default. Atlas dashboard → Network Access → Add IP Address → "Allow Access from Anywhere" (`0.0.0.0/0`). Hackathon-acceptable.

**"Cannot find module '@/lib/db'"**
Check `apps/web/tsconfig.json` has the path alias:
```json
"paths": { "@/*": ["./*"] }
```

**"E11000 duplicate key error"**
That's MongoDB's unique index doing its job — usually means email is already taken. The signup route handles this and returns 409. If you see this in another context, check what unique indexes you've created.

**bcryptjs is slow in dev**
First signup might take 200ms. That's intentional (security). It won't matter at hackathon scale.

**Cookie set but `/api/auth/me` returns 401**
Most common causes:
- JWT_SECRET differs from when the token was signed (restart the dev server after editing `.env.local`)
- Cookie expired (7 days for sessions)
- Testing across different ports/hosts (cookies don't share)

**TypeScript errors on `req.json()`**
Make sure you import `NextRequest` from `next/server`, not `next/types`.

**Antigravity says "file not found" or guesses wrong path**
Be explicit: always say `apps/web/lib/db.ts` not just `lib/db.ts`. The repo is a monorepo and Gemini sometimes assumes single-package layout.
