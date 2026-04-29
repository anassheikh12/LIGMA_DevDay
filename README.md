# LIGMA — Collaborative AI Canvas (DevDay '26)

**Let's Integrate Groups, Manage Anything**

A high-performance, real-time collaborative workspace engineered for DevDay 2026. This project demonstrates advanced CRDT synchronization, Gemini-driven workflow automation, and a hardened Lead-Authority security model.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (Turbopack) | Server-side rendering + lightning-fast builds |
| **Canvas Engine** | tldraw SDK | Professional-grade infinite whiteboarding |
| **Real-time Sync** | Yjs + y-websocket | Conflict-free Replicated Data Types (CRDTs) |
| **AI Engine** | Gemini 1.5 Flash | Context-aware task generation and intent mapping |
| **Infrastructure** | Node.js + Socket.IO | Awareness, cursor tracking, and RBAC signaling |

---

## 🛡️ The "Lead Authority" Protocol

Designed to solve the "Collaborative Chaos" problem in remote teams.

- **Protected States:** AI-generated tasks are tagged with immutable metadata.
- **Ghost Lock:** Non-Lead users are physically restricted from selecting or modifying "Authority" shapes via an event-interception layer (`editor.selectNone()`).
- **Zero-Latency Enforcement:** Permissions are validated locally on the client to ensure the UI remains snappy while maintaining strict access control.
- **Visual Cues:** Locked shapes are automatically colored `grey` and non-leads receive `COMMAND LEVEL INSUFFICIENT` alerts upon interaction attempts.

---

## 📜 Real-Time Event Log

Integrated a shared event logging system that tracks:
- **Who:** Attribution via Yjs awareness.
- **What:** Shape creation, deletion, and text updates.
- **When:** High-precision timestamps synced across all clients.
- **Performance:** Capped history (last 100 entries) to ensure the Yjs document remains lightweight.

---

## 🚀 Deployment & Environments

LIGMA utilizes a decoupled architecture for maximum scalability:
- **Web:** Hosted on Render (Next.js)
- **Realtime:** Dedicated Node.js WebSocket server
- **Key Env:** `NEXT_PUBLIC_REALTIME_URL` handles the handshake between the client and the sync engine.

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
# From the repo root
npm install
```

### 2. Launch Services
```bash
# Terminal 1: Sync Server
cd apps/realtime && npm run dev

# Terminal 2: Web Client
cd apps/web && npm run dev
```

---

## 🎨 LIGMA Brand Identity

- **Warm Cream (`#F5F1E4`):** Reduced eye strain for long sessions.
- **Traffic Yellow (`#FFD702`):** Visual cues for action-oriented UI.
- **Neo-Brutalist Ink:** Heavy borders (4px) and hard shadows for a bold developer aesthetic.

---

## ✅ DevDay '26 Progress

- [x] **Core:** Yjs CRDT Text & Canvas Sync
- [x] **Security:** Lead Authority Selection Interceptor (Ghost Lock)
- [x] **Intelligence:** Gemini Task Generation Integration
- [x] **Presence:** Awareness-based Cursor & Presence tracking
- [x] **Audit:** Shared Real-Time Event Logging
- [ ] **Future:** Time-Travel Replay & MongoDB Persistence

---

**Built for DevDay '26 @ FAST-NUCES.**  
**Engineers:** Anas Sheikh, Hamza, Tahir, and Hammad.
