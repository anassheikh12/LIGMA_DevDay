# LIGMA — Hamza's Guide: Multi-User Cursor Presence (tldraw)

**For:** Hamza (Frontend + Backend, since you're handling both)
**Stack:** tldraw v3 + Socket.IO client + Zustand + Next.js API routes
**Goal:** Render every connected user's cursor on the canvas in real time, with a themed name tag in their assigned color.
**Time estimate:** ~3–4 hours of focused work.

Each step has a copy-paste **Claude Code prompt** at the bottom. Run the prompts in order. Verify the output of each one before moving to the next — it's much faster to catch a mistake at step 3 than to debug it after step 11.

---

## What You're Building

When two or more users are in the same room, every user sees every other user's cursor moving live on the canvas. Each cursor matches the LIGMA reference design:

- A filled arrow pointer in the user's assigned color with a **2px white outline** and a soft drop shadow
- A **pill-shaped name tag** sitting just below-right of the arrow, filled with the same color, white bold text
- Smooth interpolation between updates (50ms transform transition)
- Fades out / disappears 5 seconds after the user goes idle or disconnects

Every user gets a different color from a deterministic 6-color palette. The color is assigned by the `/api/rooms/[id]/join` endpoint and stored on `room_members.color`.

### Why tldraw makes this easier than Konva

tldraw owns the canvas event system and gives us pointer position in page space. We render cursors as a DOM overlay that uses tldraw's camera math to stay aligned during pan and zoom.

We are NOT using tldraw's native sync (`@tldraw/sync`). The team runs custom Yjs + Socket.IO. We just use tldraw's editor APIs for input and coordinate conversion, and route presence over Hammad's Socket.IO server.

---

## API Contract (already implemented on the server)

Hammad's realtime server now handles these. Verify the names match before you start — if he changed any, use his.

| Event (direction) | Payload | When |
|---|---|---|
| `room:join` (client → server) | `{ roomId }` | Once on canvas mount |
| `room:join:ok` (server → client) | `{ role, color }` | Server confirms membership |
| `cursor:move` (client → server) | `{ roomId, x, y }` | On local cursor move (throttled to 30Hz) |
| `cursor:update` (server → clients) | `{ userId, name, color, x, y }` | Server rebroadcasts to other clients in room |
| `cursor:leave` (server → clients) | `{ userId }` | When a user disconnects |

`x` and `y` are in **page space** (canvas coordinates), NOT screen pixels. tldraw exposes `editor.inputs.currentPagePoint` which already accounts for pan/zoom — use it.

---

## Pre-flight

Make sure your local repo is clean and up to date:

```bash
cd "E:\Frontend Practice\LIGMA_DevDay"
git checkout main
git pull origin main
git status
```

Create your branch:

```bash
git checkout -b feat/cursor-presence
```

Announce in Discord:

> Starting on cursor presence — branch `feat/cursor-presence`. Touching the canvas component, adding hooks/store/socket helpers, and updating the join endpoint to assign colors. Anas, ping me before adding deps to `apps/web/package.json`.

---

## STEP 1: Confirm Dependencies

In `apps/web`:

```bash
npm ls tldraw socket.io-client
```

You should see both. If `socket.io-client` is missing:

```bash
cd apps/web
npm install socket.io-client
```

Also install the throttle helper if not already there:

```bash
npm install lodash.throttle
npm install -D @types/lodash.throttle
```

If `tldraw` is missing, something is very wrong — talk to whoever set up the canvas.

### Claude Code prompt

```
In apps/web, verify that tldraw and socket.io-client are both installed by running `npm ls tldraw socket.io-client`. If socket.io-client is missing, install it with `npm install socket.io-client`. Also install the throttle helper if not already present: `npm install lodash.throttle` and `npm install -D @types/lodash.throttle`. Show me the final dependency list and confirm all four packages (tldraw, socket.io-client, lodash.throttle, @types/lodash.throttle) are present in package.json. Do not modify any source code in this step — only package installation.
```

---

## STEP 2: Add the Shared Cursor Color Palette and Wire Up the Join Endpoint

Cursor colors come from a deterministic 6-color palette. The `/api/rooms/[id]/join` endpoint cycles through it so every member of a single room gets a distinct color.

Important: existing members rejoining should keep their original color, not get a new one assigned.

### Claude Code prompt

```
Add a shared cursor color palette and wire it into the room-join flow so each member of a room gets a distinct, deterministic color.

## Files to create

Create apps/web/src/lib/cursor-colors.ts with this exact content:

    export const CURSOR_PALETTE = [
      '#7C3AED', // muted purple
      '#1F4E9D', // decision blue
      '#16A34A', // success green
      '#E6C100', // muted yellow (not full brand yellow — that's reserved for action items)
      '#C8302D', // danger red
      '#3D8FBC', // question blue
    ] as const;

    export type CursorColor = (typeof CURSOR_PALETTE)[number];

    export function colorForIndex(index: number): CursorColor {
      return CURSOR_PALETTE[index % CURSOR_PALETTE.length];
    }

## Files to modify

Find the room-join API route. It is likely at apps/web/src/app/api/rooms/[id]/join/route.ts but if not, search for the handler that inserts into the `room_members` collection. Read the existing file first so you understand the current flow before changing anything.

The current handler probably either (a) hardcodes a color, (b) picks a random one, or (c) doesn't set a color at all. Replace whatever it does with deterministic palette assignment:

1. Import: `import { colorForIndex } from '@/lib/cursor-colors';`

2. IMPORTANT: if the user is ALREADY a member of this room (rejoining), do NOT reassign their color. Look up the existing membership first; if it exists, return it as-is.

3. Only assign a new color when creating a brand-new membership row. Count existing members:

       const existingCount = await db.collection('room_members').countDocuments({ roomId });
       const color = colorForIndex(existingCount);

4. Use that `color` value when inserting the new `room_members` document.

Pseudo-flow:

    const existing = await db.collection('room_members').findOne({ roomId, userId });
    if (existing) {
      return NextResponse.json({ role: existing.role, color: existing.color });
    }
    const count = await db.collection('room_members').countDocuments({ roomId });
    const color = colorForIndex(count);
    // ... insert new member with color ...
    return NextResponse.json({ role: newRole, color });

## What NOT to do

- Do not change the response shape of the join endpoint beyond ensuring `color` is included.
- Do not touch any other API routes.
- Do not modify apps/realtime/server.js.
- Do not add color logic to the frontend cursor rendering yet. That's a separate change.

## After making changes

Show me the new cursor-colors.ts file, a diff of the join route, and the full updated join route file so I can sanity-check the surrounding logic. Note whether the existing-member rejoin case was already handled or whether you added it.
```

---

## STEP 3: Add the RemoteCursor Type

Add the type to your shared types file. It's likely at `apps/web/src/types/index.ts` — Claude Code can find it.

### Claude Code prompt

```
Add a RemoteCursor TypeScript type to the shared types file in apps/web. First locate the existing types file (likely apps/web/src/types/index.ts or apps/web/src/types.ts — search for it). Append this type:

    export interface RemoteCursor {
      userId: string;
      name: string;
      color: string;
      x: number;          // page-space x
      y: number;          // page-space y
      lastUpdate: number; // Date.now() — used for stale detection
    }

Do not modify any other types. Do not duplicate it if it already exists. Show me the file path you appended to and the final contents of that file.
```

---

## STEP 4: Add a Cursor Slice to Zustand

We mirror only **remote** cursors in Zustand — not our own. We never need to read our own cursor back from React.

Critical Zustand gotcha: the slice returns a **new** Map on every update. Mutating the existing Map and calling `set` will not trigger re-renders because Zustand uses reference equality.

### Claude Code prompt

```
Add a cursor slice to the Zustand store in apps/web. First locate the store file (likely apps/web/src/store/index.ts or apps/web/src/store.ts — search for `create` from `zustand`). Read it before making changes.

Add the following to the existing store:

State:
- `cursors: Map<string, RemoteCursor>` initialized to `new Map()`

Actions:
- `upsertCursor(cursor: RemoteCursor)` — adds or replaces a cursor in the map
- `removeCursor(userId: string)` — removes a cursor by userId
- `clearCursors()` — clears the map entirely

CRITICAL: every update must return a NEW Map, not mutate the existing one. Zustand uses reference equality to detect changes. Example:

    upsertCursor: (cursor) =>
      set((state) => {
        const next = new Map(state.cursors);
        next.set(cursor.userId, cursor);
        return { cursors: next };
      }),

    removeCursor: (userId) =>
      set((state) => {
        const next = new Map(state.cursors);
        next.delete(userId);
        return { cursors: next };
      }),

    clearCursors: () => set({ cursors: new Map() }),

Import RemoteCursor from the types file you updated in the previous step.

If the store is split into multiple slice files, add a new file `apps/web/src/store/cursorSlice.ts` and combine it in the root store. Otherwise add directly to the existing store object.

Do not change any other slices. Show me the diff and the full updated store file.
```

---

## STEP 5: Build the Socket.IO Client Helper

Singleton socket client that lazily connects. `withCredentials: true` is critical — without it the `ligma-session` cookie won't be sent and the realtime server's auth middleware will reject the connection.

### Claude Code prompt

```
Create a Socket.IO client helper at apps/web/src/lib/socket.ts. First check if a socket helper already exists in apps/web/src/lib/ — if yes, show it to me and stop; do not overwrite it. If it does not exist, create it with this content:

    import { io, Socket } from 'socket.io-client';

    let socket: Socket | null = null;

    export function getSocket(): Socket {
      if (!socket) {
        const url = process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4000';
        socket = io(url, {
          withCredentials: true,
          autoConnect: false,
        });
      }
      return socket;
    }

    export function connectSocket() {
      const s = getSocket();
      if (!s.connected) s.connect();
      return s;
    }

    export function disconnectSocket() {
      if (socket?.connected) socket.disconnect();
    }

Then check if apps/web/.env.local exists. If it does, read it and tell me whether NEXT_PUBLIC_REALTIME_URL is already set. If not set, add this line:

    NEXT_PUBLIC_REALTIME_URL=http://localhost:4000

If apps/web/.env.local does not exist, create it with that single line.

CRITICAL: do not commit .env.local. Verify that .env.local is in the repo's .gitignore (check both apps/web/.gitignore and the root .gitignore). If it is not, add it.

Show me the final contents of socket.ts, the relevant lines from .env.local, and confirmation that .env.local is gitignored.
```

---

## STEP 6: Build the `useCursorPresence` Hook

This is the heart of the feature. It:
- Connects the socket on mount
- Joins the room via `room:join`
- Listens for `cursor:update` and `cursor:leave`
- Throttles local pointer movement to 30Hz and emits `cursor:move`
- Cleans up on unmount

`useEditor()` only works inside a child of `<Tldraw>`. Step 8 wires that up correctly.

### Claude Code prompt

```
Create a React hook at apps/web/src/hooks/useCursorPresence.ts that handles cursor presence subscription and broadcast.

The hook signature:

    interface Args {
      roomId: string;
      user: { userId: string; name: string; color: string } | null;
    }

    export function useCursorPresence({ roomId, user }: Args): void

Behavior:

1. Use `useEditor()` from 'tldraw' to get the tldraw editor instance.
2. Use the existing Zustand store (which now has cursors, upsertCursor, removeCursor, clearCursors).
3. On mount, if user and editor are both truthy:
   - Call connectSocket() from @/lib/socket
   - Emit `room:join` with `{ roomId }` once after connection
   - Listen for `cursor:update`. On receive, IGNORE the event if payload.userId equals user.userId (so we don't render our own cursor as remote). Otherwise call upsertCursor with `{ ...payload, lastUpdate: Date.now() }`.
   - Listen for `cursor:leave`. On receive, call removeCursor(payload.userId).
   - Subscribe to tldraw's editor event system: on event with name 'pointer_move', read `editor.inputs.currentPagePoint` (page space, accounts for pan/zoom) and call a throttled emitter that sends `cursor:move` with `{ roomId, x, y }` at 30Hz. Use lodash.throttle with 33ms.
4. On unmount, remove all socket listeners, remove the editor event listener, cancel the throttle, and call clearCursors().

Use `import throttle from 'lodash.throttle';`.

Imports needed:
- useEffect, useRef from 'react'
- useEditor from 'tldraw'
- throttle from 'lodash.throttle'
- connectSocket from '@/lib/socket'
- the store hook (likely useStore from '@/store' — verify the actual export name)
- RemoteCursor type from '@/types' (or wherever you put it)

Mark the file with 'use client' at the top.

Do not import or render any UI in this file — it is a side-effect-only hook. Show me the complete file.
```

---

## STEP 7: Build the Themed Cursor Component

This matches the reference design exactly: filled arrow with white outline and drop shadow, pill name tag below-right.

### Claude Code prompt

```
Create a presentational component at apps/web/src/components/canvas/CursorPointer.tsx that renders a single themed cursor matching the LIGMA design system.

Props:

    interface Props {
      color: string;
      name: string;
    }

Visual spec (this is non-negotiable — match exactly):

- A wrapper div with `position: relative`.
- An SVG arrow pointer:
  - width 22, height 24, viewBox "0 0 22 24"
  - path d="M3 2.5L18.5 11.2L11.2 13.4L8.4 21L3 2.5Z"
  - fill = the color prop
  - stroke = "#FFFFFF"
  - strokeWidth = "2"
  - strokeLinejoin = "round", strokeLinecap = "round"
  - The SVG itself has style filter: 'drop-shadow(0 2px 4px rgba(35, 31, 32, 0.18))' and display: 'block'
- A pill-shaped div for the name tag, positioned absolutely at left-[14px] top-[18px] (below-right of the arrow tail):
  - className includes: absolute, whitespace-nowrap, rounded-full, px-2.5, py-[3px], text-[11px], font-semibold, text-white
  - inline style: backgroundColor = the color prop, fontFamily: '"Geist", system-ui, sans-serif', letterSpacing: '0.01em', boxShadow: '0 2px 6px rgba(35, 31, 32, 0.18)'
  - Inner content: the name prop

Mark the file with 'use client' at the top.

Do not add any logic, hooks, or state. This is a pure presentational component. Show me the complete file.
```

---

## STEP 8: Build the Overlay Component That Renders All Remote Cursors

This is the layer that maps page coords → screen coords using tldraw's camera, listens for camera changes so cursors stay aligned during pan/zoom, and purges stale cursors as a safety net.

### Claude Code prompt

```
Create apps/web/src/components/canvas/RemoteCursors.tsx that renders all remote cursors as a DOM overlay above the tldraw canvas.

Behavior:

1. Use `useEditor()` from 'tldraw'.
2. Read `cursors` from the Zustand store.
3. Read `removeCursor` from the store for stale purging.
4. Set up a useState `[, setTick]` and force a re-render whenever tldraw fires events with name 'pinch', 'wheel', or 'pointer_move' — this keeps cursor screen positions correct during pan/zoom even when no network update arrives. Subscribe via `editor.on('event', handler)` and clean up with `editor.off('event', handler)` in the effect cleanup.
5. Set up a setInterval (every 1000ms) that purges any cursor where `Date.now() - cursor.lastUpdate > 5000`. Clean up the interval on unmount.
6. Render a wrapper div with className "pointer-events-none absolute inset-0 overflow-hidden". This is critical — pointer-events-none prevents the overlay from intercepting clicks meant for the canvas.
7. Inside the wrapper, map over `Array.from(cursors.values())`. For each cursor:
   - Convert page coords to screen coords with `editor.pageToScreen({ x: cursor.x, y: cursor.y })`.
   - Render a div positioned with `transform: translate(${screen.x}px, ${screen.y}px)` and inline style `transition: 'transform 50ms linear'` (this matches the design doc's cursor interpolation spec).
   - Inside that div, render `<CursorPointer color={cursor.color} name={cursor.name} />`.
   - Use `cursor.userId` as the React key.

Imports:
- useEditor from 'tldraw'
- useEffect, useState from 'react'
- the store hook
- CursorPointer from './CursorPointer'

Mark the file with 'use client' at the top.

If editor is null, return null.

Show me the complete file.
```

---

## STEP 9: Wire It Into the Canvas Component

`useCursorPresence` and `RemoteCursors` both call `useEditor()`, which only works inside a child of `<Tldraw>`. So we split the canvas into a wrapper and an inner component.

### Claude Code prompt

```
Wire cursor presence into the existing canvas component. First find the canvas component file — likely apps/web/src/components/canvas/Canvas.tsx but search for the file that imports and renders <Tldraw>. Read it before making changes.

Refactor the component so it accepts these props:

    interface Props {
      roomId: string;
      user: { userId: string; name: string; color: string };
    }

The Canvas component should render the existing <Tldraw> component (preserve any existing children, configuration, or props it already has) but add a child component called CanvasInner that runs inside <Tldraw>.

CanvasInner should:
1. Call `useCursorPresence({ roomId, user })` — this is a side-effect hook that returns nothing.
2. Render `<RemoteCursors />`.

Both useCursorPresence and RemoteCursors call useEditor() under the hood, which is why they must be inside a child of <Tldraw>, not at the same level.

Imports:
- useCursorPresence from '@/hooks/useCursorPresence'
- RemoteCursors from './RemoteCursors'

Do not break any existing tldraw configuration, theming, or persistence setup that's already in the canvas component. Preserve all existing imports and props.

Show me the diff and the full updated file.
```

---

## STEP 10: Pass User Info Into the Canvas

The room page that loads the canvas already calls `getMe()` and the `/api/rooms/[id]/join` endpoint. We need it to pass `userId`, `name`, and `color` (from the join response) into `<Canvas>`.

### Claude Code prompt

```
Update the room page that renders the Canvas component to pass user identity and assigned color through. The file is likely at apps/web/src/app/room/[id]/page.tsx or apps/web/src/app/room/[id]/RoomClient.tsx — search for the file that imports and renders the Canvas component. Read it before changing.

The page should already be:
1. Fetching the current user (probably via `getMe()` or similar — check existing code).
2. Calling /api/rooms/[id]/join (which now returns `{ role, color }` after the previous step's work).

Modify the page so it passes the following to <Canvas>:

    <Canvas
      roomId={roomId}
      user={{
        userId: user.userId,
        name: user.name,
        color: roomMembership.color,
      }}
    />

If the user or color is not yet loaded (still fetching), render a loading state — do NOT render <Canvas> with null user, since the cursor hook would short-circuit but it's cleaner to gate at this level.

If the page is structured as a server component fetching data and a client component rendering the canvas, make sure the join response (with color) flows through to the client component. Pass it as a prop, not via fetch on the client side.

Do not change auth logic, room loading logic, or any other parts of the page. Only thread user/color through to <Canvas>. Show me the diff and the full updated file.
```

---

## STEP 11: Test It

Start both servers:

```bash
# Terminal 1
cd apps/web && npm run dev

# Terminal 2
cd apps/realtime && npm run dev
```

Open two browser windows side by side:

1. **Window A:** normal Chrome. Sign up as user 1, create a room, join it.
2. **Window B:** Chrome incognito (different cookie jar). Sign up as user 2, paste the room URL, join.

Visual checklist (matching the reference design):

- [ ] Each user's cursor is a filled arrow in a different palette color.
- [ ] Arrow has a clean white outline and a subtle drop shadow.
- [ ] Pill name tag sits below-right of the arrow, NOT centered or above.
- [ ] Pill is the same color as the arrow with bold white text.
- [ ] Cursor moves smoothly (no choppy stepping) — 50ms transition working.

Functional checklist:

- [ ] You do NOT see your own cursor as a "remote" cursor (no duplicate).
- [ ] Pan the canvas in window A — remote cursors stay attached to canvas content.
- [ ] Zoom in window A — cursors still align correctly.
- [ ] Close window B — its cursor disappears in window A within ~5 seconds.
- [ ] Refresh window A — your cursor reconnects, you see B's cursor again.
- [ ] DevTools → Network → WS — `cursor:move` going out at ~30Hz when moving, 0Hz when still.

Color verification with 3+ users:

- [ ] First user joining gets palette color [0] (purple).
- [ ] Second user joining gets palette color [1] (blue).
- [ ] Third user gets [2] (green).

If any visual or functional check fails, debug in this order:

1. Are both clients connected? Check the WebSocket frame log.
2. Did `room:join` succeed? Look for `room:join:ok` in the WS frames.
3. Is `cursor:move` firing? Add `console.log` inside the throttled emitter.
4. Is the server rebroadcasting? Check the realtime server terminal logs.
5. Is the receiver getting `cursor:update`? `console.log` in the handler.
6. Is the cursor in the Zustand store? Open React DevTools.
7. Cursor in wrong place? Check `editor.pageToScreen` output.

### Claude Code prompt

There's no Claude Code prompt for this step — testing is a manual two-browser exercise. But here's a prompt for if something fails:

```
Cursor presence is misbehaving. Help me debug by adding strategic console.log statements (with a clear `[cursor-debug]` prefix) at these points:

1. In apps/web/src/hooks/useCursorPresence.ts:
   - When the socket connects
   - When `room:join` is emitted
   - When `room:join:ok` is received
   - Inside the throttled cursor emitter (log just every 30th call to avoid spam)
   - Inside the `cursor:update` handler — log the payload userId
   - Inside the `cursor:leave` handler

2. In apps/web/src/components/canvas/RemoteCursors.tsx:
   - Log the size of the cursors map on every render

Do not change behavior, only add logs. Show me the diff. After I verify the bug, I'll ask you to remove these logs.
```

---

## STEP 12: Commit and PR

Commit in small chunks. Suggested commit graph:

```bash
git add apps/web/src/lib/cursor-colors.ts apps/web/src/app/api/rooms/
git commit -m "add cursor color palette and assign on room join"

git add apps/web/src/types/
git commit -m "add RemoteCursor type"

git add apps/web/src/store/
git commit -m "add cursor slice to zustand store"

git add apps/web/src/lib/socket.ts apps/web/.env.local
git commit -m "add socket.io client helper"

git add apps/web/src/hooks/useCursorPresence.ts
git commit -m "add useCursorPresence hook"

git add apps/web/src/components/canvas/CursorPointer.tsx
git commit -m "add themed cursor pointer component"

git add apps/web/src/components/canvas/RemoteCursors.tsx
git commit -m "add remote cursor overlay"

git add apps/web/src/components/canvas/Canvas.tsx apps/web/src/app/room/
git commit -m "wire cursor presence into canvas"
```

Final rebase before PR:

```bash
git fetch origin
git rebase origin/main
```

If conflicts: resolve, `git add`, `git rebase --continue`. If overwhelmed: `git rebase --abort`.

Push:

```bash
git push -u origin feat/cursor-presence
```

### Claude Code prompt

```
Help me prepare a PR for the cursor-presence feature.

1. Run `git status` and `git diff main...HEAD --stat` so I can see what changed.
2. Run `git log main..HEAD --oneline` so I can see the commits I'm about to ship.
3. Run `git fetch origin && git rebase origin/main`. If there are conflicts, stop and show me the conflicted files — do NOT auto-resolve them. If clean, continue.
4. Generate a PR description in markdown that includes:
   - "What" — one sentence summary
   - "Visual design" — bullet points describing the cursor look
   - "Color assignment" — explanation of the palette + deterministic indexing
   - "How" — implementation summary
   - "Server side dependency" — note that this requires Hammad's already-merged auth/room-join/cursor-relay handlers
   - "Tested" — checklist of verifications I ran
   - "Touched files" — list of files changed
5. Suggest a `git push` command to push the branch.

Do not actually push or open the PR — just give me the description text and the push command.
```

---

## Common Issues

**Cursors are visible but jittery.** Throttle is too aggressive, or the CSS transition got dropped. Confirm the 50ms transition on the absolute-positioned wrapper in `RemoteCursors.tsx`.

**Cursors are in completely wrong positions.** You're using screen coordinates instead of page coordinates. Use `editor.inputs.currentPagePoint` for sending, `editor.pageToScreen()` for rendering.

**The arrow has no white outline.** Check the SVG `path` — it needs `stroke="#FFFFFF"` and `strokeWidth="2"`. Without these, the arrow blends into white sticky notes.

**The name pill is in the wrong place.** The pill is positioned with `absolute left-[14px] top-[18px]` relative to the SVG. If you tweaked the SVG dimensions, retune those offsets.

**All users have the same cursor color.** The join endpoint isn't cycling through the palette. Either the existing-member branch is firing for new users (bug), or `colorForIndex` is being called with the same number twice (race condition — countDocuments isn't atomic with insert; for a hackathon it's fine, but if you see duplicates, switch to a `findOneAndUpdate` upsert pattern).

**Cursors don't disappear when a user leaves.** Either Hammad's server isn't emitting `cursor:leave` on disconnect, or the stale-timeout fallback isn't firing. The 5-second purge interval is a safety net — the proper fix is the server `cursor:leave` event.

**You see your own cursor as a remote cursor.** Two possible causes: (a) the `if (payload.userId === user.userId) return;` guard is wrong, or (b) the server is using `io.to(roomId)` instead of `socket.to(roomId)` and echoing back. Check the realtime server.

**`useEditor()` returns null.** You're calling the hook outside the `<Tldraw>` provider. The hook must be inside a child component rendered inside `<Tldraw>`.

**Hot reload breaks the socket connection.** Expected. Saving a file in dev triggers Next.js HMR which can disconnect/reconnect the socket. Refresh the page; in production this won't happen.

---

## Out of Scope (Don't Build These Now)

- Real interpolation between events (Lerp). The CSS transition is good enough.
- Showing what other users have selected.
- Cursor on top of UI panels (overlay only covers canvas).
- Mobile touch presence — desktop only per PRD.
- Replacing your own native OS cursor with a themed one.

---

## Done Criteria

- [x] Two users in the same room see each other's cursors live, themed to match the reference.
- [x] Each cursor has its own palette color from the 6-color set.
- [x] Pill name tag sits below-right of the arrow with white bold text.
- [x] Pan and zoom don't break cursor positions.
- [x] Disconnects clean up cursors within 5 seconds.
- [x] Local cursor doesn't render as remote.
- [x] No `cursor:move` writes to the events log.
- [x] Branch merged to `main` via PR.

Estimated time: 3–4 hours including testing. Ping in Discord when you merge.
