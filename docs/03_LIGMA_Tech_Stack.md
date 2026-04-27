# LIGMA — Tech Stack Document

**Project:** LIGMA (Let's Integrate Groups, Manage Anything)
**Document version:** 1.0
**Status:** Locked for build (changes require team agreement)
**Cost commitment:** Zero. Every tool below is open-source or has a permanent free tier with no expiry.

---

## 1. Architecture Overview

LIGMA is split into **two deployed services** plus one managed database. This separation matters because Next.js's serverless model does not natively handle long-lived WebSocket connections — running real-time sync inside Next.js is painful and limits scale. We split it cleanly:

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   Next.js App            │         │   Realtime Service       │
│   (Render Web Service)   │         │   (Render Web Service)   │
│                          │  WS     │                          │
│  - Pages (App Router)    │ ◄─────► │  - Socket.IO server      │
│  - REST API routes       │         │  - Yjs sync (y-websocket)│
│  - SSR / SSG             │         │  - RBAC enforcement      │
│  - Auth (JWT cookie)     │         │  - Event log writes      │
│  - AI orchestration      │         │  - Cursor presence relay │
└──────────────────────────┘         └──────────────────────────┘
            │                                     │
            │              REST/HTTP              │
            └─────────────┬───────────────────────┘
                          ▼
              ┌────────────────────────┐
              │   MongoDB Atlas        │
              │   (Free M0 cluster)    │
              │                        │
              │   - rooms              │
              │   - events (append)    │
              │   - tasks              │
              │   - yjs-snapshots      │
              └────────────────────────┘
```

**Why two services:**

- The Next.js app handles HTTP, rendering, auth, and AI orchestration — its strengths.
- The realtime service handles long-lived WebSockets and CRDT sync — the WebSocket service's strength.
- Each can crash/restart without taking the other down.
- Each scales independently (we won't actually need to scale during a hackathon, but architectural cleanliness helps in Stage 1 presentation marks).

**The single alternative:** a custom Next.js server (`server.js`) with Socket.IO mounted. Avoid this for LIGMA. It works for toy demos but tangles concerns, makes deployment fragile, and the Stage 1 judges will ask why the realtime layer is glued to the rendering layer.

---

## 2. Frontend Stack

### 2.1 Next.js 14+ (App Router)

- **What it is:** React framework with file-based routing, server components, API routes, and built-in optimizations.
- **Why we chose it:** Production-grade routing out of the box (no React Router setup), server components for the marketing/landing pages, API routes for non-realtime backend logic (auth, AI calls, REST endpoints for tasks), excellent DX, native Render support.
- **Free?** Yes. Open-source, MIT license. Self-hosted on Render. Vercel hosting is also free for hobby use, but the rubric requires Render — we deploy on Render.
- **Version pin:** 14.x (App Router). If 15.x is stable at build time, fine to upgrade.

### 2.2 React 18

- **What it is:** UI library, comes with Next.js.
- **Why:** Standard. Hamza already knows it.
- **Free?** Yes. MIT.

### 2.3 Tailwind CSS

- **What it is:** Utility-first CSS framework.
- **Why:** Hamza already uses it. Pairs cleanly with the Design Doc tokens. Speeds up styling dramatically vs. handwritten CSS.
- **Free?** Yes. MIT.

### 2.4 Framer Motion

- **What it is:** Declarative animation library for React.
- **Why:** Smooth UI animations (modal open, task slide-in, lock icon appear). Hamza's wheelhouse from the Brazuca project.
- **Free?** Yes. MIT.

### 2.5 Zustand

- **What it is:** Lightweight state management library (5kb).
- **Why:** Way simpler than Redux for canvas state. We need a global store for cursor positions, current tool, selected node, role state. Zustand's API is ~10 lines to set up.
- **Free?** Yes. MIT.

### 2.6 react-konva

- **What it is:** React bindings for the Konva 2D canvas library.
- **Why this over alternatives:**
  - **vs. raw Canvas API:** way more productive for shapes, drag, zoom, layers.
  - **vs. tldraw SDK:** tldraw's licensing has tightened around commercial use; reading their license takes time we don't have. Konva is plain MIT.
  - **vs. Excalidraw library:** opinionated, harder to customize, and harder to wire to our own CRDT layer.
- **Free?** Yes. MIT.

### 2.7 Yjs + y-websocket (client)

- **What it is:** CRDT library for text and structured data, with a WebSocket transport.
- **Why:** Solves Challenge 01 (conflict resolution) for free. We use Y.Text for sticky note content and Y.Map for canvas-level structure. Concurrent edits converge mathematically.
- **Free?** Yes. MIT.
- **Critical:** Spike a Yjs-only prototype on Day 1 (two browser tabs syncing a single text input). If this breaks, we know early.

### 2.8 Socket.IO client

- **What it is:** WebSocket client with rooms, reconnection, and fallback.
- **Why:** Used for non-CRDT messages — cursor presence, RBAC events, task board updates, presence.
- **Free?** Yes. MIT.
- **Note:** Yjs has its own WebSocket protocol. We run two parallel connections from the client: one for Yjs (CRDT), one for Socket.IO (everything else). This is intentional — keeps protocols clean.

### 2.9 Lucide React

- **What it is:** Free icon library, ~1500 icons, consistent stroke.
- **Why:** Matches the Design Doc spec. Standard choice.
- **Free?** Yes. ISC license.

---

## 3. Backend (Realtime Service)

### 3.1 Node.js 20 + Express

- **What it is:** Standard Node web framework.
- **Why:** Team knows it. Runs Socket.IO and Yjs server. Health-check endpoint for Render.
- **Free?** Yes.

### 3.2 Socket.IO server

- **What it is:** Server side of the same library used in 2.8.
- **Why:** Battle-tested room/namespace/broadcast model, automatic reconnection negotiation, fallback to long-polling if WebSocket blocked.
- **Free?** Yes. MIT.

### 3.3 y-websocket (server) + y-mongodb-provider

- **What it is:** Server-side Yjs sync over WebSocket, with persistence to MongoDB.
- **Why:** Persists CRDT state between sessions. Without it, reloading the page wipes the document.
- **Free?** Yes. MIT.

### 3.4 Mongoose

- **What it is:** ODM for MongoDB.
- **Why:** Schemas for `rooms`, `events`, `tasks`. Familiar from MERN.
- **Free?** Yes. MIT.

### 3.5 jsonwebtoken

- **What it is:** JWT sign/verify library.
- **Why:** Validates the JWT cookie issued by the Next.js auth route on every WebSocket connection. This is **how we enforce RBAC server-side** — judges will test this.
- **Free?** Yes. MIT.

### 3.6 dotenv

- **What it is:** Loads `.env` files.
- **Why:** Standard. Used for Mongo URI, JWT secret, allowed origin.
- **Free?** Yes. BSD.

---

## 4. Auth

### Decision: **JWT in HTTP-only cookie, no third-party auth provider.**

For a hackathon-scoped collaborative tool with name-only "auth," we don't need OAuth, magic links, or NextAuth. We need:

1. User enters a display name when joining a room.
2. Server issues a JWT signed with `JWT_SECRET` containing `{ userId, name, roomId, role }`.
3. JWT is set as an HTTP-only cookie.
4. Every API call and WebSocket connection validates the JWT.
5. RBAC role lives in the JWT — server reads it on every mutation.

**Why not NextAuth.js?**
Excellent library, but overkill. Would add a session DB table, callbacks, and configuration overhead for a feature we don't need (persistent identities across rooms). The `jsonwebtoken` approach is ~40 lines total.

**Why not Clerk / Auth0?**
Both have free tiers, but Clerk's free tier is 10K MAU and Auth0's is 7.5K. They're free, but they're external services with availability risk during demo. Self-issued JWT has zero external dependencies.

**Free?** Yes. JWT is free. Cookies are free.

---

## 5. Database

### Decision: **MongoDB Atlas — M0 free cluster.**

- **What it is:** Managed MongoDB. M0 is the permanent free tier.
- **Capacity:** 512MB storage, shared CPU/RAM, no credit card required, no expiry.
- **Why over alternatives:**
  - vs. **PostgreSQL on Render:** Render's free Postgres expires after 90 days. Avoid.
  - vs. **Supabase free tier:** Generous, but pauses after 7 days of inactivity; project is deleted after long inactivity. Risk of waking up to nothing on demo day.
  - vs. **PlanetScale:** Killed their free tier in 2024.
  - vs. **Neon (Postgres):** Genuinely free with branching, but team is MERN-comfortable, not Postgres. Saves us 4 hours of schema work.
- **Free?** Yes, permanently. M0 is "free forever," not a trial.

### Collections

- `rooms` — `{ _id, name, createdAt, createdBy }`
- `events` — `{ _id, roomId, type, payload, authorId, ts, seq }` — append-only, indexed on `(roomId, seq)`
- `tasks` — `{ _id, roomId, sourceNodeId, intent, text, authorId, ts }`
- `yjs-snapshots` — managed by `y-mongodb-provider`

---

## 6. AI Layer

### Decision: **Google Gemini API (`gemini-2.5-flash`).**

- **What it is:** Google's hosted LLM.
- **Why:** Hamza already knows the API. The Flash model is fast (sub-second classification) and the free tier is generous: rate limits in the 15 RPM / 1M TPM range — fine for hackathon demo scale.
- **What we use it for:**
  1. Intent classification on node text (Challenge 03).
  2. Optional: AI Summary Export bonus feature.
- **Free?** Yes. Gemini's free tier requires no credit card and does not expire.
- **Backup:** Groq API (free, runs Llama models extremely fast). Worth signing up early as a fallback in case Gemini hits a rate limit during the demo.

### Calling pattern

- Debounce intent classification: only fire when a node text is idle for 1.5 seconds, or on blur.
- Cache classification per `(nodeId, textHash)` so re-saving the same text doesn't re-call the API.
- Batch where possible: the AI Summary Export sends all nodes in one call.

### What we explicitly do NOT use

- **OpenAI API** — no real free tier; the $5 starter credit expires.
- **Anthropic / Claude API** — paid only.
- **Hugging Face Inference API** — has rate limits that crash unpredictably; quality on small models is lower than Gemini Flash.

---

## 7. Deployment

### Decision: **Render Web Services for both Next.js and the realtime service. MongoDB Atlas separate.**

| Component | Where | Plan | Notes |
|-----------|-------|------|-------|
| Next.js app | Render Web Service | Free | Auto-deploys from GitHub `main` |
| Realtime service | Render Web Service | Free | Separate repo or monorepo subfolder |
| MongoDB | Atlas M0 | Free forever | External to Render |

### Render free tier — known gotchas

1. **Sleep after 15 min idle.** Free web services sleep when idle and take ~30 seconds to wake on the next request. Mitigation: use a free **UptimeRobot** monitor pinging both services every 5 minutes. Also manually warm both URLs 1 minute before the demo starts.
2. **750 hours/month limit per workspace.** Two services running 24/7 = 1440 hours, would exceed the limit. With the auto-sleep behavior, real usage stays well under. Don't worry about it for a hackathon.
3. **No persistent disk on free tier.** All persistence must go to MongoDB Atlas. Don't write files to local disk.
4. **No free Postgres for new projects.** (Already covered — we use Mongo.)

### Deployment pipeline

- GitHub push to `main` → Render auto-deploys both services.
- Environment variables set in Render dashboard:
  - Next.js: `JWT_SECRET`, `MONGODB_URI`, `GEMINI_API_KEY`, `REALTIME_URL`
  - Realtime: `JWT_SECRET` (same), `MONGODB_URI`, `ALLOWED_ORIGIN`

---

## 8. Dev Tools (all free)

| Tool | Use |
|------|-----|
| **GitHub** | Code hosting, free private repos |
| **Claude Code / v0.dev** | Hamza's existing AI workflow |
| **Bruno** (open source) or **Postman** free | API testing |
| **MongoDB Compass** | Free GUI for the database |
| **Excalidraw** | Free, open source — for the Stage 1 architecture diagram |
| **UptimeRobot** | Free 50-monitor tier — keeps Render warm |
| **Vercel v0.dev** | Free generations of UI scaffolding |

---

## 9. Cost Confirmation Table

This is the bottom line. Every line item below is verified to be **free for the duration of the hackathon and beyond**, with no trial expiry, no surprise paywall, and no credit card required (except where noted).

| Service | Plan | Cost | Trial expiry? | CC required? |
|---------|------|------|---------------|--------------|
| Next.js (self-hosted) | Open-source | $0 | None | No |
| React, Tailwind, Framer Motion, Zustand, Konva, Yjs, Socket.IO, Lucide | Open-source libs | $0 | None | No |
| Node.js, Express, Mongoose, jsonwebtoken | Open-source libs | $0 | None | No |
| MongoDB Atlas | M0 cluster | $0 | None (forever free) | No |
| Render | Free Web Service ×2 | $0 | None (free tier permanent) | No |
| Gemini API | Free tier | $0 | None | No |
| Groq API (backup) | Free tier | $0 | None | No |
| GitHub | Free public/private repos | $0 | None | No |
| UptimeRobot | Free 50-monitor | $0 | None | No |

**Total monthly cost during build, demo, and post-hackathon:** **$0**.

---

## 10. What We Considered and Rejected

| Considered | Why rejected |
|-----------|--------------|
| Vite SPA | User asked for Next.js, also: no SSR for landing/marketing routes, weaker prod story |
| tldraw SDK | License complexity for non-trivial use; Konva is plain MIT |
| Vercel hosting | Rubric requires Render |
| NextAuth.js | Overkill for name-only session-based "auth" |
| Supabase | Free tier auto-pauses inactive projects; risk of demo-day surprise |
| Firebase | Free Spark plan exists but lock-in is severe; pricing flips fast at scale; Firestore real-time has its own conflict model that fights Yjs |
| PlanetScale | No free tier anymore |
| Render Postgres | Free tier expires at 90 days |
| OpenAI / Anthropic APIs | Paid (no real free tier) |
| Pusher / Ably (managed WebSocket) | Free tiers exist but tight; we already need to run a Node service for Yjs persistence anyway, so self-hosted Socket.IO is simpler |
| Liveblocks (managed CRDT) | Excellent product but free tier is small and the rubric explicitly rewards us building the CRDT layer ourselves |
| Convex / Hocuspocus Cloud | Same reasoning as Liveblocks — free tiers, but managed CRDT removes the points we should be earning by hand-rolling |

---

## 11. First-Day Setup Checklist

Tasks to do **before** starting actual feature work:

- [ ] Create GitHub repo (or two — one per service if not monorepo)
- [ ] Create MongoDB Atlas account, M0 cluster, get connection string, allow IP `0.0.0.0/0` for hackathon convenience
- [ ] Create Render account, link GitHub
- [ ] Create Gemini API key at Google AI Studio, save in shared secrets doc
- [ ] Create Groq API key as backup
- [ ] Create UptimeRobot account
- [ ] Bootstrap Next.js: `npx create-next-app@latest ligma --ts --tailwind --app`
- [ ] Bootstrap realtime service: minimal Express + Socket.IO + Yjs server scaffold
- [ ] Deploy "hello world" to both Render services on Day 1 (don't wait until the end)
- [ ] **Spike Yjs sync** with two browser tabs and a single text input — confirm CRDT works before building anything else

---

## 12. Repo Structure (recommended)

Single monorepo with two app folders is simplest:

```
ligma/
├── apps/
│   ├── web/                    # Next.js app
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   └── realtime/               # Node + Socket.IO + Yjs
│       ├── src/
│       └── package.json
├── packages/
│   └── shared/                 # Shared types (Event, Node, Role)
├── package.json                # Workspaces root
└── README.md
```

Each app has its own `package.json` and Render service. Shared types live in `packages/shared` and both apps import them — this keeps the WebSocket message contract typed end-to-end.

---

*End of Tech Stack Document. Lock in by team agreement before starting build.*
