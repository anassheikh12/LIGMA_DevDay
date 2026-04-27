# LIGMA — Product Requirements Document

**Project:** LIGMA (Let's Integrate Groups, Manage Anything)
**Event:** DevDay '26 Hackathon — Web Development Track
**Team:** Hamza (Frontend) · Hammad (Backend) · Anas (Backend)
**Document version:** 1.0
**Status:** Draft — pre-build

---

## 1. Executive Summary

LIGMA is a real-time collaborative workspace that bridges the gap between brainstorming and execution. Teams ideate on a shared infinite canvas, and an AI layer automatically extracts action items, decisions, open questions, and references from canvas content — populating a live task board in real time. The product is intentionally scoped: it is not a Figma clone. It is a purpose-built brainstorming tool that produces structured, actionable output the moment a session ends.

The target outcome for the hackathon is a deployed, demo-able MVP on Render that satisfies the rubric's five categories (Real-Time Collaboration, Core Features, Architecture, UI/UX, Innovation) and earns full marks on at least three of them.

---

## 2. The Problem

Modern remote teams operate across fragmented toolchains:

- A whiteboard for ideation (Miro, FigJam)
- A task manager for execution (Linear, Notion, Jira)
- A chat tool for decisions (Slack, Discord)

The cognitive cost of context-switching during a live brainstorm kills momentum. A great idea scribbled on a sticky note becomes a lost action item because nobody transferred it to the project tracker. Existing tools either solve the canvas problem or the task management problem — none bridge the gap in real time, at the moment the idea is born.

LIGMA exists to remove this gap.

---

## 3. Goals and Non-Goals

### Goals

1. Allow distributed teams to brainstorm together on a shared infinite canvas in real time.
2. Automatically extract intent (action items, decisions, questions, references) from canvas content using AI.
3. Maintain a single source of truth between the canvas and the task board — no copy-paste, no duplication.
4. Enforce per-node access control so leads can lock critical content while contributors keep working.
5. Preserve every interaction as an immutable event so sessions can be audited and replayed.
6. Ship a deployed, working version on Render's free tier.

### Non-Goals

- Becoming a full Figma alternative (no plugin system, components panel, design library, or pixel-perfect tooling).
- Becoming a full Linear/Jira alternative (no sprints, custom workflows, integrations with GitHub, etc.).
- Persistent multi-organization SaaS infrastructure (single-tenant rooms are sufficient).
- Mobile-first experience (desktop is the primary target).
- Enterprise-grade auth (SSO, SCIM, audit exports).

---

## 4. Target Users and Personas

### Primary Persona — Aisha (Lead / Facilitator)

A senior engineer or PM running a sprint planning, design jam, or retrospective. Needs to facilitate without losing track of decisions. Needs to lock specific canvas content (e.g., the architecture diagram) so contributors don't accidentally edit it. Wants a clean handoff document at the end of the session.

**Pain point:** "After every brainstorm I spend 30 minutes copying notes into Linear."

### Secondary Persona — Bilal (Contributor)

An engineer or designer joining the session. Wants to add ideas freely without permission friction. Wants their action items to be auto-tracked so they don't have to remember them.

**Pain point:** "I forget half the things I commit to in meetings."

### Tertiary Persona — Sara (Viewer / Stakeholder)

A manager, client, or external stakeholder who joins to observe. Should see the canvas evolving in real time but not edit it. May leave comments on locked nodes.

**Pain point:** "I just want to know what was decided without sitting through a 90-minute meeting."

---

## 5. User Stories

### Authentication and rooms

- As a Lead, I can create a new room and get a shareable link, so I can invite my team.
- As a Contributor, I can join a room via the link by entering my display name, so I don't waste time on signup.
- As any user, I can see who else is currently in the room.

### Canvas

- As a Contributor, I can add sticky notes anywhere on the canvas by double-clicking.
- As a Contributor, I can drag, edit, and delete sticky notes I have permission to modify.
- As a Contributor, I can add text blocks for headings or longer notes.
- As any user, I can pan and zoom the canvas freely.
- As any user, I can see other users' cursors moving in real time, labeled with their name.

### Real-time sync

- As any user, when I make a change, others see it within ~500ms.
- As any user, if I lose internet briefly, my client reconnects and replays only the events I missed — without a full reload.
- As two users editing the same text node, our edits merge correctly without one overwriting the other.

### Intent extraction and task board

- As a Contributor, when I write an action item on a sticky note, a task automatically appears on the Task Board within 3 seconds.
- As any user, I can click a task in the Task Board and the canvas scrolls and zooms to the originating node.
- As any user, I can see who authored each task and when it was created.
- As any user, I can filter the Task Board by intent type (action item, decision, open question, reference).

### Access control (RBAC)

- As a Lead, I can lock a specific node so only Leads can edit it.
- As a Lead, I can demote a Contributor to Viewer mid-session, and the change takes effect without a reload.
- As a Viewer, when I attempt to edit a locked node, the UI prevents it and the server rejects any bypass attempt.

### Event log

- As any user, I can open a side panel that shows the full event history of the session.
- As any user, I can see who did what and when.

### Bonus — Time-Travel Replay (target bonus feature)

- As a Lead, after a session ends, I can drag a slider to scrub through the session history and see how the canvas evolved.

---

## 6. Feature List

### MVP (must-ship, in build order)

| # | Feature | Owner | Priority |
|---|---------|-------|----------|
| 1 | Room creation + join via link, name-only auth | Backend | P0 |
| 2 | Infinite canvas with pan/zoom | Frontend | P0 |
| 3 | Sticky note node — create, edit text, drag, delete | Frontend | P0 |
| 4 | Text block node — create, edit, drag | Frontend | P0 |
| 5 | WebSocket sync of all canvas mutations | Backend | P0 |
| 6 | CRDT-based conflict resolution for text and position | Both | P0 |
| 7 | Cursor presence with name labels | Both | P0 |
| 8 | Append-only event log persisted to MongoDB | Backend | P0 |
| 9 | Reconnect-and-replay (replay missed events on reconnect) | Backend | P0 |
| 10 | AI intent classification on node text (Gemini API) | Backend | P0 |
| 11 | Live Task Board panel — appears on action-item classification | Frontend | P0 |
| 12 | Task → canvas node link (click task scrolls to node) | Frontend | P0 |
| 13 | Per-node RBAC — server-enforced via WebSocket auth | Both | P0 |
| 14 | Live role demotion taking effect without reload | Both | P0 |
| 15 | Event log side panel (read-only viewer) | Frontend | P0 |
| 16 | Render deployment of frontend + backend | Both | P0 |

### Nice-to-Have (build if time permits, in priority order)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 17 | Time-Travel Replay (event log scrubber) | Medium | Bonus rubric — falls naturally out of event log |
| 18 | AI Summary Export (one-click Markdown brief) | Low | Bonus rubric — easy wins on Gemini |
| 19 | Freehand drawing tool | Medium | Rubric mentions it |
| 20 | Shape nodes (rectangles, circles, arrows) | Medium | Rubric mentions it |
| 21 | Comments on locked nodes | Medium | Lead persona needs this |
| 22 | Connection lines between nodes | Medium | Useful for diagramming |
| 23 | Presence Heatmap | High | Bonus, complex |
| 24 | Presence Zones | High | Bonus, complex |

### Explicitly Out of Scope

- Persistent user accounts with passwords
- Email invitations / SMTP
- Mobile app
- Offline-first mode
- Plugin/integration ecosystem
- Multi-room / dashboard / room browser
- Export to formats other than Markdown
- File uploads / image attachments

---

## 7. Core User Flows

### Flow A — Starting a session

1. Aisha (Lead) visits the LIGMA homepage and clicks "Create Room."
2. The app generates a unique room ID and redirects her to `/room/{id}`.
3. She enters her display name; she is automatically assigned the Lead role.
4. She copies the share link from a corner button and sends it to her team.
5. Bilal opens the link, enters his name, and joins as a Contributor.
6. Both see each other's cursors moving on a blank infinite canvas.

### Flow B — Brainstorm to task

1. Bilal double-clicks the canvas to create a sticky note.
2. He types: "Hamza to finish auth module by Friday."
3. After ~1.5 seconds of idle time, the client sends the text to the backend for classification.
4. Gemini classifies it as `action_item`.
5. The backend writes a `TASK_CREATED` event referencing the node ID.
6. The Task Board panel updates live for all users.
7. Anyone can click the task; the canvas pans and zooms to the originating sticky note.

### Flow C — Locking a critical node

1. Aisha right-clicks the sticky containing the architecture decision.
2. She selects "Lock to Lead-only."
3. The node now shows a lock icon. Bilal's UI grays out the edit affordance.
4. If Bilal tries to bypass the UI by sending a raw WebSocket mutation, the server rejects it with a permission error.

### Flow D — Reconnect and replay

1. Bilal's wifi drops while he is viewing event #45.
2. The session continues; events #46 through #67 are appended to the log.
3. Bilal's wifi returns. His client automatically reconnects and sends `lastSeenEventId: 45`.
4. The server replays events #46 through #67 over the WebSocket.
5. Bilal's canvas catches up. No full reload occurs.

### Flow E — Time-travel replay (bonus)

1. After the session, Aisha clicks "Replay" in the event log panel.
2. A timeline slider appears at the bottom of the canvas.
3. She drags the slider; the canvas re-renders the state at that point in the event log.
4. She can play it back at variable speed to share with stakeholders who missed the live session.

---

## 8. Success Metrics

### Demo-day metrics (what judges will test)

| Metric | Target | Test method |
|--------|--------|-------------|
| Cross-tab sync latency | < 500ms median | Open two tabs, draw a shape in A, time appearance in B |
| AI classification time | < 3s from idle | Type an action item, time until task appears |
| Cursor presence smoothness | < 100ms perceived lag | Move cursor in tab A, observe in tab B |
| RBAC server enforcement | 100% rejection rate | Send raw WebSocket mutation as Viewer, expect rejection |
| Reconnect recovery | Full state catches up in < 2s | Disable network, re-enable, observe replay |
| Render uptime during demo | 100% during the judging slot | Wake URL 1 minute before demo |

### Functional checkpoints (internal)

- [ ] Two browser tabs sync stickies without manual reload
- [ ] Concurrent text edits in the same node converge to the same string
- [ ] Event log persists across server restart
- [ ] Action item written → task appears on board with author, timestamp, and clickable link
- [ ] Viewer cannot mutate via raw WebSocket (server returns 403-equivalent)
- [ ] Lead demote → Contributor cannot edit on next mutation attempt, no reload required
- [ ] App is publicly accessible at a Render URL

### Stretch metrics

- [ ] Time-Travel Replay scrubs through full session
- [ ] AI Summary Export generates a coherent Markdown brief
- [ ] At least one bonus feature works flawlessly during live demo

---

## 9. Constraints

- **Cost:** Zero. All tools and services must be free or have a generous free tier with no expiry.
- **Hosting:** Must be deployed on Render (rubric requirement).
- **No paid third-party integrations** (per problem statement — immediate disqualification).
- **Server-side enforcement** is mandatory for security criteria. Client-only guards earn zero on RBAC.
- **Live demo required.** Screenshots and videos do not substitute.

---

## 10. Risks and Open Questions

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Yjs/CRDT integration is harder than expected | Medium | Spike a 30-line Yjs prototype on Day 1 before committing |
| Gemini free-tier rate limits hit during demo | Medium | Debounce classification; cache results; have Groq as backup |
| Render free service sleeps mid-demo | High | UptimeRobot monitor + manual warmup before demo |
| Frontend canvas performance with many nodes | Medium | Use react-konva with virtualization; limit demo to ~30 nodes |
| Team can't get WebSocket auth right | Medium | Define the auth contract on Day 1, not Day 2 |

### Open Questions

1. Should anonymous users get persistent identities across reconnects, or is a fresh name required each time?
2. Do we support multiple Leads in a single room?
3. What happens when the only Lead leaves? (Auto-promote next user? Lock the room?)
4. Are AI classifications visible to all users, or just to the author of the node?
5. Should the event log be downloadable as JSON?

---

## 11. Appendix — Rubric Mapping

This is a quick mapping from rubric criteria to features so we can self-check during the build.

| Rubric criterion | Pts | LIGMA feature(s) |
|-----------------|-----|------------------|
| Multi-user canvas sync | 10 | Features 5, 6 |
| Conflict resolution | 10 | Feature 6 (CRDT via Yjs) |
| Cursor presence | 5 | Feature 7 |
| AI intent extraction | 10 | Feature 10 |
| Task Board integration | 8 | Features 11, 12 |
| Node-level RBAC | 7 | Features 13, 14 |
| Event-sourced architecture | 8 | Feature 8 |
| API design and quality | 7 | (cross-cutting code organization) |
| README and docs | 5 | Architecture diagram + tech choice rationale |
| Canvas usability | 8 | Features 2, 3, 4 |
| Responsiveness | 4 | (CSS layout work) |
| Visual consistency | 3 | (Design Doc enforcement) |
| Bonus feature | 8 | Feature 17 (Time-Travel Replay) |
| Approach uniqueness | 7 | Stage 1 architecture presentation |

**Total achievable with MVP:** 100 points.

---

*End of PRD.*
