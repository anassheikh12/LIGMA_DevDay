# LIGMA — Monorepo

**Let's Integrate Groups, Manage Anything**

A real-time collaborative workspace. This repo contains the technical spike proving Yjs CRDT sync over WebSockets.

---

## Repository Structure

```
ligma/
├── apps/
│   ├── web/          # Next.js 14 (App Router, Tailwind, TypeScript)
│   └── realtime/     # Node.js + Express + Socket.IO + y-websocket
├── package.json      # Workspaces root
└── README.md
```

## Quick Start

### Prerequisites

- **Node.js 20+** and **npm**

### 1. Install Dependencies

```bash
# From the repo root — installs both apps
cd apps/realtime && npm install
cd ../web && npm install
```

### 2. Start the Realtime Server (port 4000)

```bash
cd apps/realtime
npm run dev
```

You should see:

```
🚀  LIGMA Realtime running on http://localhost:4000
    Yjs WebSocket:  ws://localhost:4000/<room-name>
    Socket.IO:      http://localhost:4000/socket.io/
```

### 3. Start the Next.js Frontend (port 3000)

In a **separate terminal**:

```bash
cd apps/web
npm run dev
```

### 4. Test Real-Time Sync

1. Open **http://localhost:3000** in two browser windows side by side.
2. Type in one — it appears instantly in the other.
3. The green **Connected** badge confirms the Yjs WebSocket link is active.

---

## How It Works

| Layer | Technology | Role |
|-------|-----------|------|
| CRDT Engine | **Yjs** (`Y.Text`) | Conflict-free merging of concurrent text edits |
| Transport | **y-websocket** | Syncs Yjs documents over WebSocket |
| Backend | **Express** + **ws** | HTTP health-check + WebSocket upgrade handler |
| Frontend | **Next.js 14** (App Router) | React client with Yjs binding |
| Styling | **Tailwind CSS** + custom tokens | LIGMA brand: Warm Cream `#F5F1E4`, Traffic Yellow `#FFD702` |

### Conflict Resolution Strategy

We use Yjs's **Y.Text** CRDT, which implements the YATA (Yet Another Transformation Approach) algorithm. Unlike Operational Transformation (OT), CRDTs achieve convergence through mathematically commutative, associative, and idempotent operations — meaning concurrent edits **always** merge correctly regardless of network ordering. No central authority is needed.

### Architecture (Spike)

```
┌──────────────────────┐       WebSocket        ┌──────────────────────┐
│  Next.js Frontend    │  ◄──────────────────►   │  Realtime Service    │
│  (port 3000)         │    y-websocket proto    │  (port 4000)         │
│                      │                         │                      │
│  Y.Doc + Y.Text      │                         │  y-websocket server  │
│  ↕ bound to textarea │                         │  + Express health    │
└──────────────────────┘                         └──────────────────────┘
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Realtime server port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS origin for Express |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:4000` | WebSocket URL used by the frontend |

---

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Warm Cream | `#F5F1E4` | Background |
| Traffic Yellow | `#FFD702` | Accent, buttons, focus rings |
| Ink | `#1A1A1A` | Primary text |
| Muted | `#6B6B6B` | Secondary text |

---

## Next Steps (Post-Spike)

- [ ] Canvas with react-konva (sticky notes, connections)
- [ ] Socket.IO for cursor presence + RBAC events
- [ ] Event-sourced mutation log (MongoDB)
- [ ] AI intent classification (Gemini API)
- [ ] Task Board panel
- [ ] Time-Travel Replay
- [ ] Deploy to Render
