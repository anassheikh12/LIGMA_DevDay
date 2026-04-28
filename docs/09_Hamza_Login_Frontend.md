# LIGMA — Hamza's Guide: Login System (Frontend)

**For:** Hamza
**Goal:** Build login + signup pages and rewire the room flow to require an account.
**Time estimate:** ~5–6 hours of focused work.
**Coordination with Anas:** He's building auth API routes. You'll mock his endpoints, build the UI, then swap to real APIs when he's done.

---

## What's Changing From the JoinGate Plan

We're moving from session-only auth to a **two-layer auth model**:

1. **Account auth** (NEW) — User signs up with email + password → gets a session cookie. Persistent identity.
2. **Room auth** (KEEP) — When entering a room, server checks the account session AND the user's role in that room → issues a room-scoped JWT.

**Old flow (rewind this):**
Landing → Click "Create Room" → JoinGate (name input) → Canvas

**New flow:**
Landing → Click "Get Started" → Signup OR Login → Dashboard (your rooms) → Create or Join Room → Canvas

You're keeping the JoinGate component but now it's automatic — it uses the logged-in user's name; no manual entry.

---

## Step 0: Rewind the JoinGate Work

Before building anything new, undo what you did:

```bash
cd path/to/LIGMA_DevDay
git checkout main
git pull
git checkout -b feat/login-frontend
```

If you already merged the JoinGate to main, that's fine — we'll modify it, not delete it. If it's still on `feat/joingate-flow`, just don't merge that branch and start fresh from main.

**Files we'll modify or remove later:**
- `apps/web/components/landing/CreateRoomButton.tsx` (will move to dashboard, not landing)
- `apps/web/components/room/JoinGate.tsx` (will simplify — no manual name entry)
- `apps/web/app/room/[id]/RoomClient.tsx` (auth check now redirects to login if no session)

Don't delete them yet. We'll modify them in place.

---

## What You're Building

```
apps/web/
├── app/
│   ├── (auth)/                          ← route group, doesn't show in URL
│   │   ├── login/page.tsx               ← /login
│   │   └── signup/page.tsx              ← /signup
│   ├── dashboard/page.tsx               ← /dashboard (after login)
│   ├── room/[id]/RoomClient.tsx         ← MODIFY: redirect to /login if not authed
│   └── page.tsx                         ← MODIFY: landing page CTA → /signup
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                ← email + password form
│   │   ├── SignupForm.tsx               ← name + email + password form
│   │   └── AuthLayout.tsx               ← shared centered card layout
│   ├── dashboard/
│   │   ├── CreateRoomCard.tsx           ← inline create-room (moved from landing)
│   │   ├── RoomList.tsx                 ← list of rooms user is in
│   │   └── DashboardTopbar.tsx          ← topbar with user avatar + logout
│   └── room/
│       └── JoinGate.tsx                 ← MODIFY: no name input, auto-join from session
└── lib/
    └── auth-client.ts                   ← helper functions: login(), signup(), logout()
```

---

## How Antigravity / Claude Code Workflow Works

You'll be in the repo root with Claude Code open. Each step has:

1. **What you're doing** — read first
2. **Concept to learn** — short explainer (because you said you want to learn)
3. **Prompt** — paste into Claude Code
4. **Verify** — confirm it worked

For Anas using Antigravity: same pattern, same prompts work. He should make sure Antigravity has access to `apps/web/` (his backend work is all inside that folder).

**Don't paste all prompts at once.** One step at a time. Read the diff. Commit. Move on.

---

## STEP 1: Set Up the Auth Layout Component

**Concept to learn — Route Groups in Next.js App Router:**
Folders wrapped in `(parens)` don't appear in the URL. So `app/(auth)/login/page.tsx` is at `/login`, not `/auth/login`. We use this to share a layout between login and signup pages without polluting URLs.

**What you're building:** A reusable centered card that login and signup both sit inside.

### Prompt:

```
Create apps/web/components/auth/AuthLayout.tsx as a client-friendly component (no 'use client' needed unless used).

Props:
- title: string (heading)
- subtitle: string (description below heading)
- children: React.ReactNode (the form)
- footer?: React.ReactNode (optional bottom link, e.g. "Already have an account? Log in")

Layout:
- Full viewport, cream background (bg-surface-0)
- Centered card on the page
- Card: white background (bg-surface-1), 20px border radius (rounded-lg), 40px padding (p-10), max width 420px
- Title: Bricolage Grotesque, 30px, weight 700, line-height 1.0 (font-display text-3xl font-bold text-ink leading-[1.0] mb-2)
- Subtitle: Geist 15px, ink-muted (text-ink-muted text-[15px] mb-8)
- Children render below subtitle
- Footer (if provided): mt-8, centered, text-sm, ink-muted

Show me the file when done.
```

### Verify
- File exists at the right path
- TypeScript types compile

---

## STEP 2: Build the Signup Form

**Concept to learn — Controlled forms in React:**
A "controlled" form means React owns every input value via state. You read it from state, update via onChange. This is what you'll do everywhere — it makes validation easy and submission predictable.

**What you're building:** The signup form that handles name + email + password, validates, and calls the API.

### Prompt:

```
Create apps/web/components/auth/SignupForm.tsx as a client component ('use client' at top).

Imports:
- useState from 'react'
- useRouter from 'next/navigation'

State (all strings, all start empty):
- name, email, password, confirmPassword
- error: string (for validation/server errors)
- loading: boolean

Mock flag at the top:
const USE_MOCK_API = true;

Validation (run on submit):
- name: at least 2 characters
- email: must include '@' and '.'
- password: at least 6 characters
- confirmPassword: must match password
- If any fail, setError with a clear message and return

On submit (button click or Enter key):
1. Validate
2. setLoading(true), setError('')
3. If USE_MOCK_API:
   - Wait 600ms (simulate network)
   - Mock success: { userId: 'mock-' + random, name, email }
   - router.push('/dashboard')
4. If not mock:
   - POST /api/auth/signup with { name, email, password }
   - On 200: router.push('/dashboard')
   - On 409 (email taken): setError('Email already registered')
   - On other errors: setError('Signup failed. Please try again.')
5. setLoading(false)

Form fields (all standard Tailwind styles using design tokens):
- Each field has a label (text-sm font-medium text-ink mb-2 block) and an input
- Input style: w-full bg-surface-1 border border-border text-ink px-4 py-3 rounded-md text-[15px] focus:outline-none focus:border-ink focus:border-2 placeholder:text-ink-subtle mb-5
- Password fields: type="password"
- Email field: type="email"
- All inputs have appropriate placeholders

Error display (when error is non-empty):
- text-danger text-sm mb-4 (red, before the submit button)

Submit button:
- w-full bg-accent-yellow hover:bg-accent-yellow-hover text-ink font-semibold py-3.5 rounded-pill transition-all duration-120 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
- Disabled when loading or any required field is empty
- Text: 'Creating account...' when loading, 'Create account' otherwise

Form should submit on Enter key in any field.

Show me the file when done.
```

### Verify
- File exists, no TypeScript errors
- Tailwind classes match design tokens

---

## STEP 3: Build the Login Form

**What you're building:** Same shape as signup but with just email + password.

### Prompt:

```
Create apps/web/components/auth/LoginForm.tsx as a client component.

Same patterns as SignupForm.tsx, but with these differences:

State:
- email, password
- error, loading

Validation:
- email: must include '@' and '.'
- password: at least 1 character (we don't enforce length on login — they may have legacy passwords)

Mock flag:
const USE_MOCK_API = true;

Mock behavior:
- Wait 600ms
- If email contains 'fail' (e.g., 'fail@test.com'): setError('Invalid email or password')
- Else: success, router.push('/dashboard')

Real API call:
- POST /api/auth/login with { email, password }
- On 200: router.push('/dashboard')
- On 401: setError('Invalid email or password')
- On other: setError('Login failed. Please try again.')

Two fields (email, password) with same styling as SignupForm.

Submit button text: 'Logging in...' when loading, 'Log in' otherwise.

Show me the file when done.
```

### Verify
- File exists, compiles

---

## STEP 4: Build the Login and Signup Pages

**Concept to learn — Pages vs Components in App Router:**
A `page.tsx` file is a Next.js page (a route). It's wired automatically based on its folder path. A component file (anywhere else) is just a React component you import. Pages are usually thin — they import and render components, plus optional metadata.

**What you're building:** The actual `/login` and `/signup` URLs.

### Prompt:

```
Create two page files using the (auth) route group:

FILE 1: apps/web/app/(auth)/login/page.tsx

import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Continue your work."
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-ink font-medium underline hover:text-ink-muted">
            Sign up
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}

FILE 2: apps/web/app/(auth)/signup/page.tsx

import AuthLayout from '@/components/auth/AuthLayout';
import SignupForm from '@/components/auth/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating in seconds."
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/login" className="text-ink font-medium underline hover:text-ink-muted">
            Log in
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}

Show me both files when done.
```

### Verify
- Visit `http://localhost:3000/signup` — see the signup card
- Visit `http://localhost:3000/login` — see the login card
- Both forms render correctly
- Click links between them — they navigate
- Try submitting with mocks — should redirect to `/dashboard` (which 404s for now, that's fine)

---

## STEP 5: Update the Landing Page CTA

**What you're doing:** The landing page currently has "Create a Room" → that flow is going away. Replace with "Get Started" → goes to `/signup`. Add a "Log in" link in the topbar/nav.

### Prompt:

```
Find the landing page Hero component (apps/web/components/landing/Hero.tsx or similar) and the navbar/topbar if it exists.

Show me both files first.

Then make these changes:

1. In the Hero, replace the primary CTA button with a Link to '/signup' styled as the yellow pill:
   <Link href="/signup" className="...same yellow pill styles as before...">
     Get Started
   </Link>

2. Keep the secondary CTA ("See how it works") as is.

3. If there's a navbar/topbar on the landing page:
   - Add a "Log in" link in the right side, styled minimally:
     <Link href="/login" className="text-ink font-medium hover:underline">Log in</Link>
   - And a "Sign up" yellow pill button next to it

4. If there's NO navbar yet, create one at apps/web/components/landing/Navbar.tsx:
   - Sticky to top, transparent bg
   - Logo on left ("LIGMA" in font-display, weight 700)
   - "Log in" + "Sign up" on right (right-aligned with gap-3)
   - Then import and render it at the top of the landing page (above Hero)

Show me the diff of all changes.
```

### Verify
- Landing page CTA goes to `/signup`
- Top of landing has "Log in" and "Sign up" links
- Both navigate correctly

---

## STEP 6: Create an Auth-Client Helper

**Concept to learn — Why centralize API calls:**
Right now your forms each call fetch directly. That's fine for two forms, but adds up. A `lib/auth-client.ts` file centralizes the calls so you have one place to swap mock/real, handle errors, etc.

### Prompt:

```
Create apps/web/lib/auth-client.ts with these functions:

const USE_MOCK_API = true;

export type User = {
  userId: string;
  name: string;
  email: string;
};

export async function signup(name: string, email: string, password: string): Promise<User> {
  if (USE_MOCK_API) {
    await new Promise(r => setTimeout(r, 600));
    if (email.includes('exists')) {
      throw new Error('Email already registered');
    }
    return { userId: 'mock-' + Math.random().toString(36).slice(2, 8), name, email };
  }

  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (res.status === 409) throw new Error('Email already registered');
  if (!res.ok) throw new Error('Signup failed. Please try again.');
  return res.json();
}

export async function login(email: string, password: string): Promise<User> {
  if (USE_MOCK_API) {
    await new Promise(r => setTimeout(r, 600));
    if (email.includes('fail')) {
      throw new Error('Invalid email or password');
    }
    return { userId: 'mock-' + Math.random().toString(36).slice(2, 8), name: 'Mock User', email };
  }

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 401) throw new Error('Invalid email or password');
  if (!res.ok) throw new Error('Login failed. Please try again.');
  return res.json();
}

export async function logout(): Promise<void> {
  if (USE_MOCK_API) {
    await new Promise(r => setTimeout(r, 200));
    return;
  }
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<User | null> {
  if (USE_MOCK_API) {
    await new Promise(r => setTimeout(r, 200));
    return null; // simulate not logged in
  }

  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  const data = await res.json();
  return data.authenticated ? data.user : null;
}

Then update SignupForm.tsx and LoginForm.tsx to import and call signup() and login() from this file instead of calling fetch directly. Remove their internal USE_MOCK_API flags — the helper handles it.

Show me the auth-client.ts and the updated forms.
```

### Verify
- One mock flag now lives in `lib/auth-client.ts` only
- Forms still work with mocks
- When you swap to real APIs later, you only change the flag in one file

---

## STEP 7: Build the Dashboard Page

**Concept to learn — Why a dashboard:**
After login, users need somewhere to land. The dashboard shows their rooms (created or joined) and lets them create a new one. It's basic for MVP — no settings, no profile editing.

**What you're building:** `/dashboard` page with topbar, "Create new room" card, list of recent rooms.

### Prompt:

```
Create three files:

FILE 1: apps/web/components/dashboard/DashboardTopbar.tsx (client component)

A topbar at the top of the dashboard:
- Sticky to top, surface-0 (cream) background, hairline bottom border
- Height 64px, horizontal padding 32px (px-8), flex items-center justify-between
- Left: "LIGMA" logo in font-display text-2xl font-bold text-ink
- Right: User avatar (40px circle with first letter, deterministic color for now use #FFD702) + "Log out" button (ghost style, text-ink-muted hover:text-ink)
- On Log out click: call logout() from lib/auth-client, then router.push('/')

Props:
- userName: string

FILE 2: apps/web/components/dashboard/CreateRoomCard.tsx (client component)

A card with:
- Bg surface-1, 20px border radius (rounded-lg), padding 32px (p-8)
- Heading "Start a new room" (font-display text-2xl font-bold text-ink mb-2)
- Subtitle "Create a fresh canvas for your team" (text-ink-muted text-[15px] mb-6)
- Inline form (text input + Go button, similar to the old CreateRoomButton):
  - Input: room name, "e.g. Sprint Planning Oct 24"
  - Yellow "Create" button
- Mock flag at top, USE_MOCK_API = true, mock returns { roomId: 'demo-' + random }
- On success: router.push(`/room/${roomId}`)
- Real API: POST /api/rooms with { name }, expects { roomId } back

FILE 3: apps/web/app/dashboard/page.tsx (client component, since it fetches data)

This is the dashboard route at /dashboard.

On mount:
- Call getMe() from lib/auth-client
- If null (not logged in), router.push('/login')
- Else, set user state

Layout:
- Cream bg (bg-surface-0), min-h-screen
- DashboardTopbar at top with user.name
- Main content area: max-w-4xl mx-auto, padding 48px (p-12)
- Heading: "Welcome back, {firstName}" (font-display text-4xl font-bold leading-[1.0] mb-8)
- Then <CreateRoomCard /> as the main content
- Below it, a section "Your recent rooms" — for now show "No rooms yet" placeholder text in text-ink-muted (we'll wire this to real data later)

Show me all three files.
```

### Verify
- Visit `/dashboard` — should redirect to `/login` since mock returns null user
- Manually navigate to `/signup` → fill in mock signup → redirected to `/dashboard`
- But wait — mock signup doesn't actually persist a session, so on refresh you'd be redirected back to login. That's expected with mocks. Will work properly once Anas's API is real.

For now, to test the dashboard: temporarily change `getMe()` mock to return `{ userId: 'test', name: 'Hamza', email: 'h@test.com' }` instead of `null`. You can revert before commit.

---

## STEP 8: Modify the Room Page to Require Login

**What you're doing:** The old RoomClient showed JoinGate to anyone with the URL. Now it should redirect to `/login` if no session.

### Prompt:

```
Show me the current contents of apps/web/app/room/[id]/RoomClient.tsx and apps/web/components/room/JoinGate.tsx.

Then modify RoomClient.tsx with these changes:

1. On mount, call getMe() from lib/auth-client
2. If user is null (no session), router.push(`/login?redirect=/room/${roomId}`) — pass the redirect param so login can return them here
3. If user exists, call POST /api/rooms/[id]/join with { roomId } to get a room-scoped JWT/role assignment. This is a NEW endpoint Anas is building.
4. Mock for this new endpoint:
   - USE_MOCK_API at top
   - Return { role: 'lead', color: '#E63946' } (mock always lead)
5. Combine the user (from getMe) and roomMembership (from /join) into a roomUser object
6. Pass roomUser to JoinGate or directly to the canvas placeholder

Modify JoinGate.tsx:
- Remove the name input completely
- Remove the form and "Join" button
- Replace with a brief loading state: "Joining {roomName}..." (text-ink-muted, centered)
- This component is now just a transient state shown for ~500ms while the room JWT is being issued

Actually rethink JoinGate's role: it's no longer a gate (login is the gate now). Maybe rename to `RoomLoadingState.tsx` for clarity? Suggest the cleaner approach.

Show me the diff and your reasoning on JoinGate's new role.
```

### Verify
- Visit `/room/abc12345` directly without being "logged in" → redirects to `/login?redirect=/room/abc12345`
- After login (mock), redirects back to `/room/abc12345`
- Brief loading state, then placeholder canvas

Note: Since login uses redirect param, also update `LoginForm.tsx` to read `searchParams.get('redirect')` and use that as the post-login destination instead of `/dashboard`.

### Prompt (small follow-up):

```
In LoginForm.tsx and SignupForm.tsx, after successful auth:
- Read the 'redirect' search param from URL using useSearchParams() from next/navigation
- If redirect exists and starts with '/' (security: only relative paths), router.push(redirect)
- Else router.push('/dashboard')

Show me the diff.
```

---

## STEP 9: Test the Full Frontend Flow With Mocks

Run through this scenario end-to-end:

1. Open `/` → see landing page with "Get Started" and "Log in" in topbar
2. Click "Log in" → see login page
3. Click "Sign up" link in footer → see signup page
4. Fill in mock signup → click "Create account" → redirects to `/dashboard`
5. On dashboard, see welcome message, "Start a new room" card, "No rooms yet"
6. Type "Test Room" → click "Create" → redirects to `/room/demo-xxxxxx`
7. See brief "Joining..." state, then "You're in!" placeholder
8. Open another tab, paste the room URL → redirects to `/login?redirect=/room/demo-xxxxxx`
9. Mock login → redirects back to `/room/demo-xxxxxx` → "You're in!"

If all of this works, the frontend is solid.

---

## STEP 10: Commit

```bash
git add apps/web/app/(auth)/
git add apps/web/app/dashboard/
git add apps/web/app/room/
git add apps/web/components/auth/
git add apps/web/components/dashboard/
git add apps/web/components/room/
git add apps/web/components/landing/
git add apps/web/lib/auth-client.ts

git commit -m "feat(frontend): login + signup + dashboard (mocked APIs)"
git push origin feat/login-frontend
```

Open a PR. Tag Anas. Tell him you're using mocks in `lib/auth-client.ts` and one mock flag in `RoomClient.tsx`.

---

## STEP 11: Swap Mocks for Real APIs (When Anas Is Done)

When Anas tells you his APIs are merged:

```
In apps/web/lib/auth-client.ts and apps/web/app/room/[id]/RoomClient.tsx, change USE_MOCK_API from true to false.

Then also remove the mock fallback in apps/web/components/dashboard/CreateRoomCard.tsx and switch it to fetch /api/rooms.

Test the full flow end-to-end and show me any errors.
```

---

## What's Next After This

Once login works end-to-end with real APIs:
- The placeholder in `RoomClient.tsx` ("You're in!") gets replaced with the canvas
- Account-aware features come "for free" — like showing recent rooms on the dashboard, knowing who created which room, etc.

Tell me when login works and I'll write the canvas guide.

---

## Common Issues + Fixes

**"Cookies set but getMe() returns null"**
With mocks, getMe always returns null. After swapping to real API, ensure same-origin (`localhost:3000` everywhere, not switching ports/hosts).

**"Redirect loops"**
If `/dashboard` redirects to `/login` and login redirects back to `/dashboard`, getMe() isn't returning a user after successful login. Check that the auth cookie is being set in the response from `/api/auth/login`.

**"useSearchParams must be wrapped in Suspense"**
Next.js 14 requires Suspense wrappers around `useSearchParams`. Wrap the form component:
```tsx
<Suspense fallback={null}>
  <LoginForm />
</Suspense>
```

**Tailwind classes not applying**
Check that the new files are inside `apps/web/`, which is where the Tailwind config scans. If the file is somewhere else, Tailwind won't pick up the classes.
