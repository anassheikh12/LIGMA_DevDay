# LIGMA — DevDay '26 Battle Plan

**For:** Hamza (read this tonight, refer to it during the build)
**Confidential:** Sections 2 and 5 in particular — do not share with the competitor team.
**Document length:** Long. This is your 4-hour prep doc, not a memo.
**Time assumption:** I'm modeling ~30 hours of effective event time (Stage 1 architecture pitch up front, ~24–28 hours of build, then demo). If your event runs longer or shorter, scale the roadmap proportionally.

---

# SECTION 1 — FULL DECONSTRUCTION OF THE PROBLEM STATEMENT

I'm going section by section through the PDF. For each meaningful sentence or concept I'll give you literal meaning, implied meaning, domain context, hidden constraints, ambiguities, user expectations, and edge cases.

---

## 1.1 The Note to Participants (top of the PDF)

> "You are completely free to use any AI tool for support. Although, the evaluation (excluding frontend) will be based on your design knowledge and the architectural design decisions."

**Literal meaning.** AI is allowed. Backend evaluation will focus on architecture and design knowledge, not on whether the code looks AI-generated.

**Implied meaning.** The judges expect you to be able to **defend your architectural choices verbally**. If your backend is "whatever Claude wrote," and you can't explain why a CRDT was chosen over OT, why event sourcing over CRUD, why Socket.IO over raw `ws` — you'll bleed points. Frontend gets a pass on this because it's about pixels and UX. Backend doesn't.

**Hidden constraint.** This is permission AND a warning at the same time. Use AI to write code; don't use AI to make architectural decisions for you, because you'll be cross-examined on those decisions and an LLM hallucinating reasons won't help in real-time questioning.

**User expectation.** Judges will ask things like: "Why CRDT and not OT?" "What happens on reconnect — walk me through the protocol." "Why MongoDB and not Postgres?" Every backend decision needs a defensible reason. Hammad and Anas need to be able to answer these without you.

> "USE OF PAID 3RD PARTY INTEGRATIONS WILL RESULT IN IMMEDIATE DISQUALIFICATION."

**Literal meaning.** Don't use anything that costs money.

**Implied meaning.** Free tiers of paid services are a gray area. The safest reading: anything that *can* charge you (Liveblocks, Pusher, Convex, Firebase paid features, OpenAI API) is risky even on free tier. Stick to fully open-source software you self-host, or fully free APIs (Gemini's free tier).

**Hidden constraint.** This rules out a LOT of "easy mode" services that hackathon teams typically reach for. Liveblocks (managed CRDT) — out. Pusher (managed WebSockets) — risky. Vercel KV (Redis) — risky. Supabase paid features — out. Anything where there's a "Pricing" page on the website should be treated as suspect even if there's a free tier, because the rule says "paid integrations" not "paid usage."

**Edge case.** Render itself is a paid service with a free tier. The problem statement *requires* deployment on Render. So the implicit understanding is "free tiers of services where Render-equivalents are required" are okay. MongoDB Atlas free tier is similarly okay because the alternative is "no database." But Liveblocks free tier is *not* okay because the alternative is "build it yourself with Yjs," which is exactly what the rubric is testing.

---

## 1.2 The Background (Section 01 of the PDF)

> "Modern remote teams operate across fragmented toolchains — a whiteboard for ideation, a task manager for execution, a chat tool for decisions."

**Literal meaning.** Remote teams use multiple tools.

**Implied meaning.** The pain isn't using multiple tools. The pain is the *seam between them*. Anyone who's worked remotely knows the moment: someone says "I'll do that," it goes on a sticky note, and ten minutes later it's lost forever because nobody copied it into Linear/Jira. This is THE pain LIGMA solves.

**Domain context.** This is the "tool sprawl" problem in productivity software. Adam Grant and similar productivity researchers have written about this. Tools like Notion exist explicitly to fight this fragmentation, but they fight it by being a *bigger* tool — they don't bridge ideation and execution at the moment of capture. Coda has a similar story. None of them solve the live brainstorm problem.

**User expectation hint.** The judges, if they're remote workers (and most modern engineers are), will *feel* this pain when you describe it. Lead your demo with this story. "Have you ever lost an action item because nobody transferred it from the whiteboard?" — yes, everyone has.

> "The cognitive cost of context-switching during a live brainstorm kills momentum."

**Literal meaning.** Switching tools mid-brainstorm is bad.

**Domain context.** "Context switching" in productivity literature has measurable costs — Gloria Mark's research shows it takes ~23 minutes to fully refocus after a context switch. In a live group brainstorm, the cost is even higher because the *group* loses momentum, not just the individual.

**Hidden insight.** This is the moral case for LIGMA's existence. Lean on it in your pitch.

> "Existing tools either solve the canvas problem (Figma, Miro) or the task management problem (Notion, Linear) — but none bridge the gap in real time, at the moment the idea is born."

**Literal meaning.** No tool does both.

**Implied meaning.** "At the moment the idea is born" is a key phrase. Post-hoc transcription tools exist (Otter.ai, Fireflies, Granola). The novelty LIGMA proposes is **synchronous extraction**, not post-meeting summarization. This means the AI must be running while users are typing, not after the session ends.

**Hidden constraint.** This rules out "we'll just summarize at the end" implementations. The judges literally have a 3-second SLA on AI extraction in the rubric (Category 2, AI intent extraction: "Within 3 seconds, Task Board shows new task"). Real-time, not batched.

**Competitor implication.** A naive team will implement intent extraction as a batch step ("Extract Tasks" button). They'll lose 10 points on this criterion. We must do it streaming/debounced as users type.

---

## 1.3 The Challenge (Section 02 of the PDF)

> "Build LIGMA — a real-time collaborative workspace that bridges ideation and execution. Teams brainstorm on a shared infinite canvas; the platform automatically extracts intent from canvas content and populates a live task board — no copy-paste, no context switching."

**Literal meaning.** Build the thing described.

**Key phrases to internalize:**
- "real-time collaborative" — multi-user, sub-second sync
- "infinite canvas" — pan/zoom, no fixed viewport
- "automatically extracts intent" — AI runs without user clicking a button
- "no copy-paste" — tasks reference canvas nodes, don't duplicate them
- "no context switching" — the task board lives alongside the canvas, not in a separate page

> "LIGMA is intentionally scoped: it is not a full Figma clone. It is a purpose-built brainstorming tool that produces structured, actionable output the moment a session ends."

**Literal meaning.** Don't try to build Figma.

**Implied meaning.** The judges have explicitly told you what NOT to spend time on: layers panel, design tokens, plugin system, components library, color picker, alignment tools, smart guides, asset library, comment threads, version history *as a panel*, prototyping, etc. Every minute you spend on Figma-clone features is a minute lost on the actual rubric.

**Hidden insight.** This is also a hint about what they DO want: "structured, actionable output the moment a session ends." This is a setup for the **AI Summary Export** bonus feature. They're literally telling you "we want a brief at the end of the session." That's an AI Summary Export. Build it.

**Competitor trap.** Many teams will see "infinite canvas" and start building zoom controls, alignment guides, multi-select, copy-paste, undo/redo, color pickers. None of that is in the rubric. Don't get pulled in.

---

## 1.4 Core Requirement: The Canvas

> "Infinite canvas with sticky notes, freehand drawing, shapes, and text blocks."

**Literal meaning.** Four node types.

**Hidden ambiguity.** "Freehand drawing" and "shapes" are mentioned but absent from the rubric. The rubric only tests "add/move sticky notes, connect nodes, and assign tags." This means **freehand drawing and shapes are not scored directly** — they're only relevant to "Canvas usability" (8 pts) which is satisfied by sticky notes alone.

**Strategic interpretation.** Freehand and shapes are decoys. Build sticky notes and text blocks well; skip the rest unless you have time at the very end.

**Edge case.** "Connect nodes" is in the rubric but is NOT in the requirements list. This is a discrepancy. To be safe, implement basic node connections (a line/arrow between two nodes) — it's worth 8 points if missed.

> "Multiple users can edit simultaneously in real time (no page refresh)."

**Literal meaning.** Multiple users, simultaneous, no refresh.

**Hidden constraint.** "No page refresh" is repeated multiple times in the document. The judges will *test by refreshing*. Specifically the rubric says "Live role demotion takes effect without reload" — they will literally be looking for the reload button to be unnecessary. Architect for live state propagation from the start.

> "Each canvas element (node) is an independently addressable object."

**Literal meaning.** Every node has a unique ID.

**Implied meaning.** This is setting up for per-node RBAC and event sourcing. Every mutation must reference a node ID, every event must carry a node ID, every permission check must run against a node ID.

**Domain context.** This is content-addressable design. Same model as Git (every blob has a SHA), or Notion (every block has an ID). Design every API around node IDs from day one — don't pass node objects around, pass IDs.

> "Cursor presence — each user's cursor is visible to all participants."

**Literal meaning.** Show other people's cursors.

**Edge case.** Cursor positions update at very high frequency (60fps if you're naive). If you broadcast every mousemove to every client, you'll saturate your WebSocket. **Throttle cursor updates to ~20–30Hz on the sender side**, and use a separate transient channel (don't write cursors to the event log — they're ephemeral).

**Hidden requirement (rubric).** "Cursors delay more than 2 seconds" = zero points. So your cursor sync needs to be fast. If you're throttling, throttle on the *sender*, not the receiver, so all clients see updates at the same cadence.

---

## 1.5 Core Requirement: Intent-Aware Task Extraction

> "As users write on canvas nodes, an AI layer classifies intent: action item, decision, open question, or reference."

**Literal meaning.** Four-class classifier on node text.

**Hidden ambiguity.** "As users write" — is this every keystroke, every word, every pause? Calling Gemini on every keystroke would burn your free-tier rate limit in seconds. The right interpretation: **debounced** classification — fire after ~1.5s of idle time, or on blur, or after the user clicks elsewhere.

**Edge case.** What if the user edits a node from "Buy milk" to "Buy milk and eggs"? Re-classify? The naive answer is yes. The smart answer: only re-classify if the classification might change (skip if both texts are clearly action items; cache by text hash so unchanged text doesn't re-trigger).

**Domain context.** This is intent classification, a basic NLP task. Modern LLMs (Gemini Flash) do this trivially with a structured prompt. The "trick" is making it feel instant and not blowing your rate limit.

> "Nodes tagged as action items automatically appear in a structured Task Board panel."

**Literal meaning.** Action items go on the board automatically.

**Implied meaning.** "Action items" is the privileged class. Decisions, questions, references don't go on the board (or do they?). The rubric only tests action items: "Type an action item. Within 3 seconds, Task Board shows new task." So the Task Board is specifically for action items. Other intents are tagged on the canvas but don't appear on the board.

**Differentiation opportunity.** What if your Task Board has *tabs* for all four intents? "Actions / Decisions / Questions / References." That's a UX win competitors won't think of. It's also extremely cheap to build once you have classification working. **Strong recommendation: do this.**

> "Tasks carry the original author, timestamp, and a link back to the canvas node — no data is duplicated."

**Literal meaning.** Tasks are *references*, not copies.

**Implied meaning.** Single source of truth. If you edit the sticky note, the task should update. Architecturally this means the Task Board reads task TEXT from the source node, not from a duplicated `task.text` field. The task only stores `{nodeId, intent, ts, authorId}`.

**Hidden requirement.** When the source node is edited, the task text on the board must also update live. The rubric explicitly says "Task Board is live for all users." Live = reactive to source changes.

**Edge case.** What if the source node is deleted? Soft-delete the task or hide it? Recommended: keep the task with a "[deleted]" indicator (since events are immutable, you should never *lose* the historical action item, just mark it as deleted).

---

## 1.6 Core Requirement: Node-Level Access Control

> "Individual canvas nodes can be locked to specific roles (e.g., Lead, Contributor, Viewer)."

**Literal meaning.** Three roles. Per-node locks.

**Domain context.** RBAC = Role-Based Access Control. Standard pattern in enterprise software. The unusual part here is **per-node** RBAC, not per-room. Most apps lock at the room level (everyone in the room has the same role). LIGMA requires per-element ACLs. This is closer to Google Docs comment-mode-on-specific-paragraphs than to typical SaaS RBAC.

**Hidden complexity.** A node's ACL needs to be:
- Stored with the node (`node.lockedTo: ["lead"]`)
- Checked on every mutation (server-side, on every WebSocket message)
- Reflected in the UI (lock icon, disabled affordances)
- Updatable in real time (lock/unlock without reload)

**Hidden requirement from rubric.** "RBAC enforced only in UI (WebSocket bypass possible), or permissions require reload" = zero points. Judges will test this with `wscat` or the browser DevTools console. They'll send a raw mutation as a Viewer and see if the server rejects it.

> "A 'Lead' can lock the architecture diagram while contributors can still comment on it."

**Implied feature.** Comments on locked nodes. This is mentioned in passing but not in the rubric. Still, the wording suggests judges expect at least the *idea* of comments, even if you don't fully implement them. **Trade-off:** comments are a real feature with real complexity. If you implement them halfway, it'll look broken. Either build them properly (post-MVP) or skip mentioning them.

**Recommended interpretation.** Ignore the comment hint. Focus on lock/unlock working perfectly. If asked, say "comments are designed but out of scope for MVP — see the design doc."

---

## 1.7 Core Requirement: Append-Only Event Log

> "Every mutation to the canvas is stored as an immutable event."

**Domain context.** This is **event sourcing** — a software architecture pattern where the source of truth is a log of immutable events, and current state is *derived* by replaying those events. The pattern is famous for:
- Banking systems (every transaction is logged; balance is derived)
- Git (every commit is an event; working tree is derived)
- Databases like Kafka, EventStore
- Redux (every action; state is derived)

**Why this matters for LIGMA.** It means:
- You never DELETE rows. A delete is `{type: "DELETE_NODE", nodeId, ts}`.
- You never UPDATE rows. An update is `{type: "UPDATE_NODE_TEXT", nodeId, text, ts}`.
- Current state at any point in time = `events.filter(e => e.ts <= T).reduce(applyEvent, {})`.

**Domain knowledge to drop in your Stage 1 pitch.** Mention Martin Fowler's article "Event Sourcing." Mention that Git uses this pattern (commits = events, working tree = derived state). Mention that you chose this over CRUD because (a) the rubric requires it, and (b) it makes time-travel replay free.

**Hidden gem.** Event sourcing makes the Time-Travel Replay bonus feature trivial. Just slice the event array to a given timestamp and replay. **Most competitors won't connect these dots.**

> "The logs can be viewed in a bar on the side."

**Literal meaning.** UI requirement: a side panel showing the event log.

**UX hint.** "Bar on the side" suggests a vertical sidebar, like Git's commit history. Make it scrollable, show user, action, timestamp, target node. Click an entry to scroll the canvas to that node (mirror the Task Board interaction pattern).

---

## 1.8 Core Requirement: Real-Time WebSocket Management

> "The system must handle multiple concurrent WebSocket connections, broadcast canvas deltas (not full state) efficiently, and recover gracefully when a client reconnects after a drop — replaying only missed events."

**Three sub-requirements:**

**(a) Multiple concurrent connections.** Per room, you'll have N clients. Each is a long-lived WebSocket. Use Socket.IO's room model: `socket.join(roomId)` and `io.to(roomId).emit(...)`. Standard.

**(b) Broadcast deltas, not full state.** When a sticky moves, send `{op: "MOVE", nodeId, x, y}`, not the entire canvas. **Naive teams will broadcast `JSON.stringify(allNodes)` on every change** — this is bad and the judges will notice in DevTools network tab. Send minimum-viable diffs.

**(c) Recover gracefully on reconnect.** Each client tracks `lastSeenEventId`. On reconnect, it sends this ID; the server replays only newer events. This is the same pattern as Slack (when your Slack reconnects after sleeping, it doesn't reload — it catches up).

**Domain context.** This is "log-based replication" or "event replay." Same pattern Postgres uses for replication, same pattern Redis pub/sub uses with `XREAD`. You can call it that in your Stage 1 pitch and judges will nod.

**Edge case 1.** What if events were never persisted before the server crashed? Lost data. Mitigation: write events to MongoDB *before* broadcasting them. This is the "write-ahead log" pattern.

**Edge case 2.** What if the client's `lastSeenEventId` is ancient (they've been disconnected for hours)? Either replay the entire log, or do a full state snapshot + delta from that snapshot. For hackathon scope: just replay the entire log; rooms won't have enough events to make this slow.

**Edge case 3.** What if events are out of order on the wire (e.g., due to TCP retransmission edge cases)? Use a per-room monotonic sequence number. Client checks for gaps and requests missing IDs.

---

## 1.9 Core Requirement: Deployment of the module on Render

> "In order to be judged it's important to deploy the finished project onto Render."

**Literal meaning.** Must be on Render.

**Hidden requirement.** The URL must be **publicly accessible during the demo**. Not localhost. Not your laptop. Render's free tier sleeps after 15 minutes of inactivity. **Judges will not wait 30 seconds for your service to wake up.** Mitigation:
- Use UptimeRobot to ping every 5 minutes (free, no credit card)
- Manually warm both services 1 minute before your demo slot
- Test the public URL from your phone (not laptop) the morning of the demo to verify it works without your IP

**Operational gotcha.** Render's free Postgres expires after 90 days. We're using MongoDB Atlas instead — verify in your tech stack doc.

---

## 1.10 The Six Technical Challenges (Section 04)

Sections 04 mostly restates 03 with sharper framing. The new bits:

**Challenge 01: Conflict Resolution (CRDT / OT)**
> "When two users simultaneously edit the same canvas node, implement proper merge logic — not 'last write wins.'"

**Domain deep dive.**
- **Last-write-wins (LWW).** Naive. Whoever's update arrives at the server last "wins." User A's text overwrites User B's. Bad UX, judges explicitly call this out.
- **Operational Transformation (OT).** What Google Docs uses. Each edit is an "operation" (insert at position 5, delete from 3-7). When two operations arrive concurrently, the server *transforms* them so order doesn't matter. Hard to implement from scratch. Rich literature, infamous for edge cases.
- **CRDT (Conflict-free Replicated Data Types).** What Figma, Linear, Notion newer features use. Data structures designed so concurrent edits *mathematically always converge* to the same state. Yjs is the dominant JS CRDT library.

**Why CRDT for hackathon.** Yjs is a free library, well-documented, and you don't have to write the merge math yourself. OT requires you to write transform functions for every operation pair — too much in 24 hours.

**Stage 1 talking point.** "We chose CRDTs over OT because OT requires transform functions for every operation pair (O(n²) complexity) while CRDTs achieve convergence through commutative, associative, idempotent operations (CmRDT) or via partial-order metadata (CvRDT). Yjs is a CvRDT-style library using YATA (Yet Another Transformation Approach) for text." — Drop this in your architecture pitch. It will make Hammad and Anas look like seniors.

**Challenge 02: Node-Level RBAC**

Already covered. Key talking point: per-node ACL stored on the node, validated on every mutation server-side.

**Challenge 03: Intent-Aware Task Extraction**

Already covered.

**Challenge 04 & 05.**

Already covered.

**Challenge 06: Render deployment.**

Already covered.

---

## 1.11 Creative Features (Section 05)

> "Note to participants: You are not expected to build all four creative features. One well-implemented bonus feature with a clear architecture is worth more than four half-finished ones."

**Literal meaning.** Pick one. Do it well.

**Strategic ranking** (by ROI = impact / effort):

| Feature | Effort | Wow Factor | Falls out of architecture? | Verdict |
|---------|--------|------------|----------------------------|---------|
| Time-Travel Replay | Low–medium | **Very high** | **Yes — free with event log** | **PICK THIS** |
| AI Summary Export | Low | High | Yes — one Gemini call | Pick as second if time |
| Presence Heatmap | Medium | Medium | No — need extra state | Skip |
| Presence Zones | High | Medium–high | No — major UI work | Skip |

**Recommendation:** Build Time-Travel Replay as your primary bonus. AI Summary Export as a secondary if time permits. Both are essentially free given correct architecture.

**Time-Travel Replay specifically.** The pitch is:
> "Because we built event-sourced architecture, time travel is a one-line feature: `events.filter(e => e.ts <= sliderValue).reduce(applyEvent, emptyState)`. We didn't build replay; we made it inevitable."

That sentence wins points.

---

## 1.12 The Rubric, Line by Line

This is the most important sub-section. Every word here is what judges are looking for. Print it. Tape it to your wall.

### Category 1: Real-Time Collaboration (25 pts)

**Multi-user canvas sync (10 pts).** Test = open two tabs, change in A appears in B without reload.
- **Pass:** Yjs-bound state propagates immediately.
- **Fail:** Manual reload required.
- **Defensive coding:** ensure your client subscribes to Yjs document changes via `ydoc.on('update', ...)` and re-renders on every update.

**Conflict resolution (10 pts).** Test = both users type in the same node simultaneously, both tabs show identical merged text. README explains strategy.
- **Pass:** Yjs's Y.Text merges via YATA. Both views identical.
- **Fail:** One user's text overwrites the other's.
- **Defensive coding:** Use Y.Text for editable text (NOT JSON strings or plain strings). Never `node.text = newValue` — always `nodeYText.delete(0, len); nodeYText.insert(0, newValue)` or use Yjs bindings.
- **Critical:** README must explain the strategy. Add a 200-word section: "Conflict Resolution: We use Yjs's Y.Text CRDT, which uses YATA (Yet Another Transformation Approach) to merge concurrent edits…"

**Cursor presence (5 pts).** Test = cursors visible, labeled, smooth, <2s lag.
- **Pass:** Throttled mousemove broadcast, smooth interpolation on receivers.
- **Fail:** No cursors, or laggy cursors.

### Category 2: Core Features (25 pts)

**AI intent extraction (10 pts).** Test = type action item, task appears within 3 seconds.
- **Pass:** Debounced Gemini call, task on board within SLA.
- **Fail:** Manual click required, or no task appears.

**Task Board integration (8 pts).** Test = Task Board live for all users; clicking task scrolls canvas.
- **Pass:** Task Board reactive to events; click→scroll works.
- **Fail:** Reload required to update; tasks have no link to source.
- **Defensive design:** Make the Task Board click handler emit an event that the Canvas component subscribes to (not direct DOM manipulation).

**Node-level RBAC (7 pts).** Test = Viewer edit blocked in UI AND on server (`wscat` test); live demotion works without reload.
- **Pass:** Server validates every mutation against the user's role. Role updates propagate via WebSocket.
- **Fail:** Server doesn't check role; or role caches at connection time.
- **Defensive coding:** Role is stored on the user *object* in server-side memory, updated on demotion event. Every incoming mutation reads `user.role` fresh.

### Category 3: Architecture (20 pts)

**Event-sourced arch (8 pts).** Test = mutations stored as immutable events; deleting a node inserts a DELETE event, doesn't remove history.
- **Pass:** `events` collection in Mongo. Never UPDATE or DELETE rows. State derived by replay or cached snapshot.
- **Fail:** Mutations overwrite state in place. No event log.

**API design & quality (7 pts).** Test = REST/GraphQL returns structured JSON; clear separation of concerns.
- **Pass:** Routes/services/data layers separated. Endpoints consistent.
- **Fail:** Logic in a single file; inconsistent shapes; endpoints fail outside browser.
- **Defensive coding:** Use a `routes/`, `services/`, `models/` folder structure on the backend. Keep route handlers thin.

**README & docs (5 pts).** Architecture diagram, choice rationale.
- **Pass:** Clear README with diagram, CRDT/event-sourcing rationale.
- **Fail:** Default scaffold README.
- **Critical:** Easy 5 points. Don't skip the README. We'll write it Day 1.

### Category 4: UI/UX (15 pts)

**Canvas usability (8 pts).** Test = add/move stickies, connect, tag without explanation.
- **Pass:** Discoverable controls, no need to explain.
- **Fail:** Hidden behind unlabeled icons.

**Responsiveness (4 pts).** Test = no horizontal scrollbar; key controls reachable.
- **Pass:** Layout doesn't break.
- **Fail:** Layout overlaps or cuts off controls.

**Visual consistency (3 pts).** Test = consistent palette, type, spacing.
- **Pass:** Design Doc tokens used everywhere.
- **Fail:** Mismatched fonts, button styles.

### Category 5: Innovation (15 pts)

**Bonus feature (8 pts).** Test = one creative feature fully functional and demoed live.
- **Pass:** Time-Travel Replay works end-to-end.
- **Fail:** Static screenshot, disabled button, or crash.

**Approach uniqueness (7 pts).** Test = team articulates non-obvious decisions in Stage 1.
- **Pass:** Defensible architecture, articulated reasoning.
- **Fail:** Can't explain choices.

---

## 1.13 Judging Notes (Section 07) — Often Overlooked

> "Partial credit is independent per criterion."

Means: if your conflict resolution works but README is missing, you get the WS points and lose only the README points. **You can't lose the same point twice.** This is good news — every criterion is recoverable independently.

> "Server-side enforcement is mandatory for security criteria. Client-only guards earn zero on RBAC."

This is the BIG one. Already discussed. Will be tested with raw WebSocket or curl. Server must validate every mutation against the user's role.

> "Live demo is required. Screenshots and videos do not substitute."

Plan for live demo failures. Always have: a backup browser tab pre-loaded; a pre-recorded video as fallback IF truly broken; a test data set seeded so the demo doesn't depend on typing perfect input.

> "Stage 1 (Architecture Presentation) scores feed into Category 5."

Stage 1 isn't a freebie. The "Approach uniqueness" 7 points come from how you present the architecture. Prep slides. Practice the pitch.

---

# SECTION 2 — COMPETITIVE STRATEGY

The brutal truth: your competitor has the same PRD, the same rubric, the same problem statement. The first 70 points (the rubric basics) are achievable by both teams. The differentiation lives in the last 30 points and in how you present.

## 2.1 What the Competitor Will Build (the obvious solution)

Based on PRD-following, here's the median build:

- **Frontend:** React + some canvas lib (probably tldraw, possibly Excalidraw, possibly raw Konva). Tailwind. Default UI feel.
- **Backend:** Express + Socket.IO + MongoDB. Maybe Yjs, maybe a hand-rolled "operation" approach with timestamp-based merging.
- **AI:** OpenAI free trial credit (will run out mid-build) or Gemini free tier (smart). One classification call per node text change.
- **RBAC:** Role checked on connect, cached. Live demotion will probably require reload (loses points).
- **Event log:** Best case, a `logs` collection. More likely: separate from the actual mutation handling, becomes a write-only audit trail that doesn't drive the source of truth.
- **Bonus feature:** AI Summary Export (the easiest one). Most won't connect Time-Travel Replay to the event log.
- **UI:** Standard SaaS look. Slate gray, blue accent, white background. Generic.
- **Demo:** "Here's the canvas, here's the task board, here's RBAC."

**This will score around 70–80 points.** That's competitive but not winning. To beat it, we need to win the last 20–30 points decisively.

## 2.2 Five Non-Obvious Insights to Outflank Them

### Insight #1: Event sourcing is the *product*, not just the architecture.

Most teams will treat the event log as a compliance checkbox — "we have an `events` table." We treat it as the **primary state mechanism**: current state is derived from events, not stored separately. This unlocks Time-Travel Replay for free, makes the event log panel inherently meaningful (not just an audit log), and gives Stage 1 a memorable architectural one-liner: *"State is a fold over events."*

**Defensive concern:** doing this purely (no cached current state) is slow for a long event log. Compromise: cache current state in a `nodes` collection, but always derive it from events on cold start, and replay from a snapshot for time-travel. In your pitch, lead with the pure model.

### Insight #2: AI extraction can be richer than classification.

The PRD says "classify into action item, decision, open question, reference." The competitor will literally classify into 4 buckets. We extend the AI to also extract:
- **Assignee** (parse "Hamza to do X" → assignee = Hamza)
- **Due date** (parse "by Friday" → date)
- **Dependencies** ("blocked by the auth module" → link)
- **Confidence** (low confidence → don't auto-create task, just suggest)

This costs the same number of Gemini calls (just a richer prompt) and makes the Task Board dramatically more useful. The judges will see assignees on tasks and immediately understand we've gone beyond the rubric.

**Implementation:** Single structured prompt asking for JSON `{intent, assignee?, dueDate?, blockedBy?, confidence}`. Display assignee + due date as chips on the task card. Massive perceived sophistication for ~20 lines of code.

### Insight #3: Per-node RBAC is a UX pattern, not just a security feature.

The competitor will implement RBAC as "you can or can't edit." We implement it as an **explicit, visible, manipulable affordance**:
- A small lock chip on every node that's clickable (if you have permission)
- Click → opens a tiny popover: "Lock to: [Lead] [Contributors] [Anyone]"
- Real-time visible state: when a Lead locks the architecture diagram, everyone sees a yellow flash + lock icon appear

This makes RBAC a *demoable feature*, not a hidden capability. Judges feel the security model in their hands.

### Insight #4: Cursor presence + intent classification can be combined.

When the AI is classifying (the 1.5s debounce window), show a small "thinking" indicator on the node — a subtle yellow pulse, or a tiny "🤖 classifying…" chip. When done, the chip animates into the intent badge. This is a 10-minute frontend change but signals "AI is working" continuously without it ever feeling magical-and-hidden.

### Insight #5: The event log panel doubles as a "presence narrative."

Most teams will make the event log a flat list of `[user] did [thing]`. We make it richer:
- Group events by user-session-burst (consecutive events by same user within 30s)
- Show as a vertical timeline with avatars (looks like a Slack thread)
- Click an event → canvas jumps to that node + scrubber jumps to that point in time

This turns the event log from a checkbox into a feature. It's the same data, presented as story.

## 2.3 Wow Factors Ranked by ROI

| Wow Factor | Effort | Time | Risk | Verdict |
|------------|--------|------|------|---------|
| Time-Travel Replay (slider scrubs canvas through history) | Medium | 3–4h | Low | **Build it. Headline demo.** |
| Rich AI extraction (assignee, date, dependencies) | Low | 1–2h | Low | **Build it. Easy win.** |
| Live RBAC popover (UX pattern) | Low | 1h | Low | **Build it.** |
| AI Summary Export (one-click brief at session end) | Low | 1–2h | Low | Build it as second bonus |
| "Heatmap" overlay of activity zones | Medium | 3–4h | Medium | Skip unless time |
| Voice-to-sticky (whisper API) | High | 4–5h | High | Skip — Gemini doesn't do voice cheaply |
| Magnetic snapping / auto-layout | Medium | 3–4h | Medium | Skip — Figma-clone trap |
| Comments on locked nodes | High | 4–6h | High | Skip — out of scope |

## 2.4 Architectural Moats (hard to replicate even if seen)

These are decisions that, even if a competitor sees your demo, they can't easily copy in remaining time:

1. **Two-service architecture (Next.js app + dedicated WS service).** If competitors built a single-service Next.js app, they can't trivially split it Day 2. They're locked in.
2. **Yjs + separate semantic event log.** This dual-layer requires thought. A team that started with just Yjs's update log will struggle to add semantic events later because their data flow is wrong.
3. **Rich AI prompt with structured output (JSON schema).** A team using a simple "classify this" prompt will need to redo their UI to support assignee/date once they see it.
4. **Time-travel replay built on event sourcing.** A team that stored mutations as state-overrides instead of events will have to refactor their entire data model.
5. **Server-side RBAC with live role propagation.** A team that did role-on-connect will struggle to make demotion live.

The moat isn't a single feature — it's how the architecture compounds. Each decision unlocks a related one for free.

## 2.5 Reinterpretations (challenging assumptions safely)

The PRD says "real-time collaborative workspace." Most teams will read this as: "everything must be instantly synced." We can reinterpret:

- **Cursor positions: ephemeral, not synced via the event log.** Doesn't count as "data."
- **AI classification: derived, not authored.** It's not an "edit" — it's a server-side annotation. Doesn't need to live in the event log either; it can be a separate `classifications` collection driven by events.
- **Task Board state: derived, not stored.** It's a *view* over events filtered to action items. Don't store it; project it.

These are aggressively correct interpretations of event sourcing that competitors who treat the event log as "just audit" will miss.

---

# SECTION 3 — IMPLEMENTATION ROADMAP

Assumptions:
- ~30 hours of event time
- Stage 1 (architecture pitch) at hour 0–2
- Demo at hour 28–30
- Three people: Hamza (FE), Hammad (BE), Anas (BE)
- Sleep is allowed (and necessary). Plan for it.

## 3.1 Hour-by-Hour Plan

### Hour 0–2: Stage 1 Architecture Pitch
- **All three:** present architecture (you'll have prepared this Tonight)
- **No coding yet**

### Hour 2–4: Repo + scaffolding (parallel)
- **Hamza (FE):** `npx create-next-app@latest`, set up Tailwind config with design tokens, set up Geist + Bricolage Grotesque, create folder structure, push to GitHub
- **Hammad (BE):** scaffold realtime service repo: Express + Socket.IO + Yjs server, MongoDB connection, basic event schema
- **Anas (BE):** scaffold Next.js API routes for auth + room creation, JWT issuing logic, MongoDB models

### Hour 4–5: API contract lock-in (all three)
- **Critical:** stop coding, sit together (or screen-share), agree on the WebSocket message shapes from Section 4.4. Type them up. Commit a `packages/shared/types.ts`. **Do not skip this.**

### Hour 5–8: First spike — two browsers see each other
- **Hamza:** simple canvas with one sticky note, hardcoded
- **Hammad:** Yjs server running, broadcasting updates
- **Anas:** auth route returning a JWT cookie
- **Goal at hour 8:** two browser tabs both see the same hardcoded sticky, can edit it, edits sync. **THIS IS THE KEY MILESTONE.** If you don't hit it by hour 8, panic and re-plan.

### Hour 8–10: Real sticky notes + cursor presence
- **Hamza:** add ability to create stickies by double-clicking; render them from Yjs state; cursor sync via Socket.IO
- **Hammad:** broadcast cursor positions; persist Yjs to Mongo
- **Anas:** room creation + join routes; UI for landing page

### Hour 10–14: Event log + AI classification
- **Hamza:** event log side panel UI; sticky note edit triggers AI classification call
- **Hammad:** `events` collection writes on every mutation; expose `GET /events?roomId=&since=` for replay
- **Anas:** `/api/classify` endpoint that calls Gemini and returns intent + assignee + date

### Hour 14–16: Sleep (forced). 4–6 hours. Don't argue.
You will produce worse code at hour 22 with no sleep than at hour 18 with 4 hours of sleep. Actually sleep.

### Hour 16–20: RBAC + Task Board
- **Hamza:** Task Board panel UI, click→scroll to node; RBAC popover on each node
- **Hammad:** server-side role validation on every WebSocket message; live role demotion event
- **Anas:** `/api/tasks?roomId=` endpoint (derived from events)

### Hour 20–22: Time-Travel Replay (the bonus)
- **Hamza:** scrubber UI at the bottom of the canvas; on scrub, snapshot the event-replay state and render
- **Hammad:** `GET /events?roomId=&until=ts` endpoint for time travel
- **Anas:** README writing — architecture, CRDT rationale, event sourcing rationale, design choices

### Hour 22–24: Deploy to Render + integration testing
- **All three:** push to Render. Test from a different browser/device. Fix the inevitable env-var bugs. Set up UptimeRobot.

### Hour 24–26: Polish + bug bash
- Hunt down rough edges
- Test conflict resolution scenario specifically
- Test RBAC bypass with `wscat`
- Test reconnect-and-replay with DevTools network throttling
- Final README polish

### Hour 26–28: Demo prep
- Decide on demo script (Section 6)
- Pre-record a backup demo video
- Seed demo data into the database
- Practice the demo 3 times

### Hour 28–30: Demo
- Wake up Render services 5 min before
- Do the demo
- Win

## 3.2 Parallelization Map

```
                Hour 0  4  8  12  16  20  24  28
Hamza (FE):     [P][S][C][L][T][R][P][D]
Hammad (BE):    [P][S][Y][E][R][T][P][D]
Anas (BE):      [P][S][A][C][T][D][P][D]

P = pitch / prep  S = scaffold  C = canvas/cursors  L = log+AI  T = RBAC/tasks
Y = Yjs server   E = events    A = auth/REST       R = time travel  D = deploy/demo
```

Roles minimally block each other if the API contract is locked early. The biggest blocker is the WebSocket message contract — if Hamza and Hammad disagree on shape, both lose hours. **Lock contracts before Hour 5.**

## 3.3 Pre-Locked API Contracts (write these tonight, see Section 4.4)

## 3.4 Integration Checkpoints

- **Hour 8: "Two tabs, one sticky, sync works."** If not, kill scope.
- **Hour 14: "AI classification working end-to-end on one user's edit."**
- **Hour 20: "RBAC blocks a forced WebSocket bypass."**
- **Hour 24: "Render deployment publicly accessible."** Non-negotiable.
- **Hour 28: "Full demo runs without crashes 3 times in a row."**

If you miss any checkpoint by 30 minutes, **do a 10-minute scope cut meeting** and remove a feature.

## 3.5 Buffer Strategy

Out of 30 hours, only ~24 are productive. Reserved buffer:
- 4–6 hours for sleep (non-negotiable)
- 2 hours for inevitable bugs (Render env vars, Mongo connection strings, CORS, WebSocket origin issues)
- 1 hour for demo prep
- 1 hour for "the bug we didn't anticipate"

This means your true coding budget is ~17–18 hours per person. Plan accordingly.

## 3.6 Final Hour Game Plan (Hour 28→30)

If you're behind at Hour 28:
1. **Don't add features.** Add nothing.
2. **Make what works visible.** If conflict resolution works but the time-travel slider is broken, hide the slider. Don't risk demo crashes.
3. **Pre-warm Render** at Hour 27:55. Hit the URL.
4. **Pre-load the demo data.** Don't type during the demo if you can help it.
5. **Open all needed tabs in advance.** One tab per role (Lead, Contributor 1, Contributor 2). Resize and arrange them before the demo starts.
6. **Have a "narrator" plan.** One person presents (recommend Hamza — frontend lead, you know the user-facing story). Other two answer technical questions if asked.

---

# SECTION 4 — PRE-FLIGHT CHECKLIST (do tonight)

## 4.1 Environment Setup (Tonight, ~1 hour)

Each team member:

- [ ] Node.js 20+ installed (`node -v`)
- [ ] npm/pnpm working
- [ ] Git installed and configured with GitHub creds
- [ ] VS Code or your IDE of choice
- [ ] MongoDB Compass installed (free GUI for the DB)
- [ ] Postman or Bruno installed
- [ ] A second browser installed (Firefox if you use Chrome, or vice versa) — for testing multi-user scenarios

## 4.2 Accounts & API Keys (Tonight, ~30 min)

All three team members must do these:

- [ ] **GitHub:** Create an org or shared repo. Add all three as maintainers.
- [ ] **MongoDB Atlas:** Sign up (no card). Create M0 free cluster. Allow `0.0.0.0/0` IP access. Create a DB user. Save connection string in shared secrets doc.
- [ ] **Render:** Sign up. Connect GitHub.
- [ ] **Google AI Studio (for Gemini):** Sign in with Google account, generate API key. Save in shared secrets doc.
- [ ] **Groq (backup AI):** Sign up, generate API key, save in shared secrets doc.
- [ ] **UptimeRobot:** Sign up, no card needed. Will configure monitors after Render deploy.

**Shared secrets doc:** create a private Notion / Google Doc / Discord channel with restricted access. Keys go here. Never commit them to git. **Add `.env` to `.gitignore` from minute one.**

## 4.3 Repo Scaffolding (Tonight, ~1 hour, optional but huge)

Set up the monorepo skeleton tonight so you don't waste Day 1 on `npx create-next-app` confusion:

```
ligma/
├── apps/
│   ├── web/                    # Next.js 14+ app
│   │   ├── app/
│   │   │   ├── (marketing)/page.tsx       # Landing
│   │   │   ├── room/[id]/page.tsx         # Room view
│   │   │   ├── api/
│   │   │   │   ├── auth/route.ts          # JWT issuing
│   │   │   │   ├── rooms/route.ts         # Room CRUD
│   │   │   │   ├── classify/route.ts      # Gemini wrapper
│   │   │   │   └── tasks/route.ts         # Read-only task projection
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   ├── task-board/
│   │   │   ├── event-log/
│   │   │   ├── topbar/
│   │   │   └── ui/                        # buttons, inputs
│   │   ├── lib/
│   │   │   ├── tokens.ts                  # design tokens
│   │   │   ├── ws-client.ts               # Socket.IO + Yjs setup
│   │   │   └── store.ts                   # Zustand store
│   │   ├── tailwind.config.ts             # from Design Doc
│   │   └── package.json
│   └── realtime/               # Express + Socket.IO + Yjs
│       ├── src/
│       │   ├── index.ts                   # entry
│       │   ├── socket.ts                  # Socket.IO setup
│       │   ├── yjs.ts                     # Yjs provider
│       │   ├── auth.ts                    # JWT validation
│       │   ├── handlers/                  # event handlers per type
│       │   ├── rbac.ts                    # role check helpers
│       │   └── db.ts                      # Mongo + event log
│       └── package.json
├── packages/
│   └── shared/                 # Shared types + constants
│       ├── types.ts                       # Event, Node, Role, etc.
│       └── constants.ts
├── .gitignore
├── README.md                   # architecture + run instructions
└── package.json                # workspaces root
```

If you can scaffold this tonight, Day 1 morning starts with feature work, not boilerplate. **Strong recommendation.**

## 4.4 API Contracts (lock these tonight)

### REST endpoints (Next.js API routes)

| Method | Path | Body | Returns | Auth |
|--------|------|------|---------|------|
| POST | `/api/auth` | `{name, roomId}` | `{token, userId, role}` (sets cookie) | none |
| POST | `/api/rooms` | `{name}` | `{roomId, name, creatorId}` | required |
| GET | `/api/rooms/:id` | — | `{roomId, name, creatorId, createdAt}` | required |
| GET | `/api/tasks?roomId=&since=` | — | `Task[]` | required |
| POST | `/api/classify` | `{nodeId, text}` | `{intent, assignee?, dueDate?, confidence}` | required |
| GET | `/api/events?roomId=&since=` | — | `Event[]` | required |
| GET | `/api/summary?roomId=` (bonus) | — | `{markdown}` | required |

### WebSocket events (Socket.IO)

**Client → Server:**

| Event | Payload | Purpose |
|-------|---------|---------|
| `join-room` | `{roomId, token}` | Subscribe to a room |
| `node:create` | `{roomId, type, x, y, text?}` | Create new node |
| `node:update-position` | `{roomId, nodeId, x, y}` | Move node |
| `node:update-text` | `{roomId, nodeId, ytext-update}` | Edit text (Yjs delta) |
| `node:delete` | `{roomId, nodeId}` | Soft-delete (logs DELETE event) |
| `node:lock` | `{roomId, nodeId, allowedRoles}` | Lock node to roles |
| `node:unlock` | `{roomId, nodeId}` | Unlock |
| `cursor` | `{roomId, x, y}` | Cursor heartbeat (throttled) |
| `role:demote` | `{roomId, targetUserId, newRole}` | Lead changes someone's role |
| `request-replay` | `{roomId, sinceEventId}` | Reconnect: send missed events |

**Server → Client:**

| Event | Payload |
|-------|---------|
| `event` | `{id, type, payload, authorId, ts, seq}` (an entry from the event log) |
| `events` | `Event[]` (batch, used for replay on reconnect) |
| `cursor` | `{userId, name, color, x, y}` |
| `presence` | `{users: [{id, name, color, role}]}` |
| `error` | `{code, message}` |

**The single most important fact:** the server is the source of truth for events. Clients send INTENTS (e.g., `node:lock`) which the server *validates* (RBAC, schema) and *commits* (writes to Mongo, broadcasts as `event` to all subscribers). Clients NEVER write to the event log directly.

### Standard `Event` shape (in `packages/shared/types.ts`)

```ts
type EventType =
  | 'NODE_CREATED'
  | 'NODE_UPDATED_POSITION'
  | 'NODE_UPDATED_TEXT'
  | 'NODE_DELETED'
  | 'NODE_LOCKED'
  | 'NODE_UNLOCKED'
  | 'TASK_CLASSIFIED'
  | 'ROLE_CHANGED'
  | 'USER_JOINED'
  | 'USER_LEFT';

type Event = {
  id: string;            // UUID v4
  roomId: string;
  seq: number;           // monotonic per-room
  type: EventType;
  payload: any;          // typed per event type, see below
  authorId: string;
  ts: number;            // Date.now()
};
```

### `Node` shape

```ts
type NodeType = 'sticky' | 'text' | 'shape' | 'drawing';

type Node = {
  id: string;
  roomId: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;          // For sticky/text nodes
  authorId: string;
  createdAt: number;
  intent?: 'action' | 'decision' | 'question' | 'reference';
  intentMeta?: {
    assignee?: string;
    dueDate?: string;
    confidence: number;
  };
  lockedTo?: Role[];      // null/undefined = anyone can edit
};

type Role = 'lead' | 'contributor' | 'viewer';
```

## 4.5 Component Tree (frontend)

```
<App>
  <Topbar>
    <Logo />
    <RoomName />
    <ShareButton />
    <PresenceAvatars />
    <RoleBadge />
  </Topbar>
  <RoomLayout>
    <LeftRail>
      <ToolButton tool="pointer" />
      <ToolButton tool="sticky" />
      <ToolButton tool="text" />
    </LeftRail>
    <CanvasContainer>
      <KonvaStage>
        <KonvaLayer> {/* nodes layer */}
          {nodes.map(node => <NodeRenderer node={node} />)}
        </KonvaLayer>
        <KonvaLayer> {/* cursors layer */}
          {cursors.map(c => <CursorFlag {...c} />)}
        </KonvaLayer>
      </KonvaStage>
      <TimeTravelScrubber /> {/* bottom, when active */}
    </CanvasContainer>
    <RightPanel>
      <Tabs>
        <Tab id="tasks"><TaskBoard /></Tab>
        <Tab id="events"><EventLog /></Tab>
      </Tabs>
    </RightPanel>
  </RoomLayout>
  <ModalsRoot />
  <ToastsRoot />
</App>
```

## 4.6 State Management (Zustand)

```ts
// One store, divided into slices for clarity.

interface Store {
  // Auth slice
  user: { id, name, role, color } | null;
  setUser: (u) => void;

  // Room slice
  roomId: string | null;
  presence: User[];
  setRoom: (id) => void;
  setPresence: (users) => void;

  // Canvas slice (DERIVED from Yjs, mirrored here for React reactivity)
  nodes: Map<string, Node>;
  selectedNodeId: string | null;
  cursors: Map<string, Cursor>;
  upsertNode: (node) => void;
  deleteNode: (id) => void;
  setCursor: (userId, c) => void;

  // Tool slice
  tool: 'pointer' | 'sticky' | 'text';
  setTool: (t) => void;

  // Tasks slice (DERIVED from events, projected client-side)
  tasks: Task[];
  setTasks: (t) => void;

  // Time-travel slice
  isTimeTraveling: boolean;
  travelToTs: number | null;
  setTravelToTs: (ts) => void;
}
```

Critical rule: **Yjs is the source of truth for canvas state.** Zustand mirrors Yjs for React reactivity. When Yjs changes, update Zustand. Never write to Zustand directly for canvas state.

## 4.7 Database Schema (Mongo collections)

```js
// rooms
{
  _id: ObjectId,
  name: string,
  creatorId: string,
  createdAt: Date,
}

// users (ephemeral session users)
{
  _id: ObjectId,
  name: string,
  roomId: string,
  role: 'lead' | 'contributor' | 'viewer',
  color: string,                 // assigned for cursor
  joinedAt: Date,
}

// events  -- THE TABLE THAT MATTERS
{
  _id: ObjectId,
  roomId: string,
  seq: number,                   // monotonic per-room
  type: string,                  // see EventType
  payload: object,
  authorId: string,
  ts: Date,
}
// Indexes: { roomId: 1, seq: 1 } unique compound index for ordered reads

// nodes  -- DERIVED CACHE (rebuilt from events on cold start; live-updated otherwise)
{
  _id: string,                   // node id
  roomId: string,
  type: 'sticky' | 'text' | ...,
  x: number, y: number,
  width: number, height: number,
  text: string,
  authorId: string,
  intent: string | null,
  intentMeta: { assignee?, dueDate?, confidence } | null,
  lockedTo: ['lead'] | null,
  createdAt: Date,
  updatedAt: Date,
}

// yjs-snapshots  -- managed by y-mongodb-provider, leave alone
```

## 4.8 Team Role Assignments

### Hamza (Frontend Lead)
- All UI components (canvas, task board, event log, topbar, modals)
- Konva integration (canvas rendering)
- Yjs client integration (binding Yjs to React state)
- Socket.IO client (cursor presence, role changes)
- Tailwind / design system implementation
- Time-Travel Replay UI
- Demo presentation (you've owned the user story)

### Hammad (Backend Realtime)
- Express + Socket.IO server
- Yjs server-side (y-websocket + y-mongodb-provider)
- Event log writes (every mutation → Mongo `events` collection)
- Server-side RBAC validation
- Reconnect-and-replay logic
- Cursor broadcast logic

### Anas (Backend API + AI)
- Next.js API routes
- Auth (JWT issuing + cookie)
- Room creation/join routes
- Gemini API wrapper + classification endpoint
- AI Summary Export endpoint (bonus)
- README writing (architecture diagram + rationale)
- Deployment to Render

These divisions are starting points. After API contracts are locked, swap as needed.

## 4.9 Communication Plan

- **Channel:** Discord voice + a shared text channel. Voice is on for the duration of the build. Text is for "I'm pushing X to branch Y" announcements.
- **Standups:** every 4 hours, 5 minutes. Each person says: what I just finished, what I'm doing next, am I blocked.
- **Blockers:** announced in voice immediately, not held in. "I'm stuck on Yjs binding" — say it.
- **Git workflow:** `main` branch deployable at all times. Each person works on `feat/*` branches. PR → review → merge. **Don't push broken code to main, ever.**
- **Naming:** branches as `feat/canvas-stickies`, `feat/rbac`, `fix/cursor-throttle`. Commits: imperative ("add sticky drag" not "added sticky drag").

## 4.10 Fallback Plans

| If… | Then… |
|-----|-------|
| Yjs server crashes / won't sync | Strip CRDT to last-write-wins for text. Lose 10 pts on conflict resolution. Continue. |
| Gemini rate-limits | Switch to Groq backup. Code paths should be abstracted behind one `classify(text)` function for easy swap. |
| Render deploy fails | Deploy frontend to Vercel free, backend stays on Render. Update one env var. |
| MongoDB Atlas down | Use a local MongoDB during demo; doesn't help judging unless you can reach Render. Real fallback: pre-recorded demo video. |
| Hammad or Anas falls behind | Drop the bonus feature. Compress scope. Get the MVP done. |
| WebSocket connection blocked by hackathon Wi-Fi | Use phone hotspot. (Real risk on hackathon Wi-Fi networks.) |
| Demo crashes | Switch to pre-recorded video. Apologize once, move on. |

---

# SECTION 5 — PITFALLS AND LESSONS

## 5.1 Likely Traps Specific to LIGMA

**Trap 1: The "Figma clone" tar pit.**
You'll feel pressure to add layers, alignment, color picker, multi-select, copy-paste, undo/redo. **None of that is in the rubric.** Resist. Every minute on Figma-clone features is a minute lost on what's scored.

**Trap 2: Overengineering CRDTs.**
You don't need to write your own CRDT. Use Yjs. Don't read the YATA paper at hour 12. Just use `Y.Text` and `Y.Map`. The points come from "Yjs handles this; here's why we chose CRDT," not from "we wrote our own CRDT."

**Trap 3: Building features without persistence.**
Yjs has in-memory state. If you don't wire `y-mongodb-provider`, refreshing the page wipes the document. Wire persistence early. Test it: refresh, see if state survives.

**Trap 4: Deploying late.**
Teams who deploy at hour 24 spend hour 25–28 fighting Render env-var bugs. Deploy a "Hello World" version at hour 4. Encounter every deployment surprise early, when there's time to fix it.

**Trap 5: The "AI is doing my homework" trap.**
You've identified this yourself. More on this below.

**Trap 6: Cursor presence broadcasting too aggressively.**
You'll send mousemove events at 60Hz. Your WebSocket will saturate. Throttle to 20–30Hz on the sender. Use `lodash.throttle`. Test with 3+ tabs open before declaring it works.

**Trap 7: Treating event log as audit log.**
If you build CRUD operations and *also* write to an event log, you have two sources of truth that will drift. Build the event log as THE source of truth. Mutations write events, then derive state from events.

**Trap 8: Ignoring the README.**
5 free points if you write a good README. Don't skip it. Use the time during deploy waits to write it.

**Trap 9: Forgetting to verify RBAC server-side.**
It's easy to feel "RBAC works" because the UI hides the edit button for Viewers. The judges will bypass the UI. Test RBAC with `wscat` or a browser console fetch yourself, before they do.

**Trap 10: Not warming Render before demo.**
Render free services sleep. Cold start is ~30 seconds. Hit your URLs 1 minute before demo. Better, set up UptimeRobot to ping every 5 minutes.

## 5.2 Hidden Cost Hotspots

These are services that look free but can charge you:

- **Vercel paid features** — analytics, edge functions beyond free tier. Stick to vanilla Next.js on Render.
- **Render Postgres** — free tier expires after 90 days. We use Mongo to avoid.
- **Supabase paid features** — free tier auto-pauses on inactivity. Don't rely on it.
- **OpenAI API** — $5 free credit expires fast. Banned from this build. Use Gemini.
- **Pusher / Ably / Liveblocks free tiers** — fine in normal hackathons but the problem statement's "no paid third-party integrations" rule makes them risky. Avoid.
- **Cloudflare Workers AI** — free in a tier, but rate-limited unpredictably. Use Gemini directly.
- **GitHub Actions minutes** — free tier is generous, but a misconfigured CI loop can burn it. Don't set up complex CI.

## 5.3 Where AI is Most Dangerous for THIS Problem

You'll be tempted to ask Claude/Gemini/Cursor to write your CRDT integration, your event sourcing layer, your WebSocket server. Here's where it'll bite you:

**Danger zone 1: CRDT integration.**
Yjs has a specific, slightly unusual API. `Y.Map` and `Y.Text` aren't normal JS Map and string. AI will sometimes write `node.text = "new"` instead of `nodeYText.delete(0, oldLen); nodeYText.insert(0, "new")`. The first version will appear to work in single-tab tests but break conflict resolution silently. **Always read Yjs docs yourself for the binding pattern.** Don't trust LLM Yjs code without verification.

**Danger zone 2: Event sourcing.**
LLMs default to CRUD because that's what most code is. They'll write `db.nodes.update(...)` instead of `db.events.insert(...) && rebuildState()`. You have to enforce the discipline. Code review every PR for "does this UPDATE or DELETE a non-events row?" and reject if yes (with rare exceptions).

**Danger zone 3: WebSocket auth.**
LLMs love to "trust the client." They'll write code that takes a `userId` from the WebSocket message and uses it. **Always read userId from the validated JWT, never from the message body.** This is THE common security bug; it's exactly what judges will test.

**Danger zone 4: The Stage 1 architecture explanation.**
LLMs will give you confident-sounding but vague justifications. "We chose CRDTs for better collaboration" is meaningless. You need the specific reason: "We chose CRDTs over OT because OT requires O(n²) transform functions and CRDTs converge through partial-order metadata, which is simpler to implement correctly in 24 hours." **Write your Stage 1 talking points yourself, in your own voice. Don't read from an AI-generated script.**

## 5.4 How to Balance AI Use vs. Understanding

The rule:
> "AI writes code. You write decisions."

Acceptable:
- "Hey AI, write me a Socket.IO server that listens for `node:create` events and broadcasts them to a room."
- "Hey AI, refactor this component to use Tailwind's `surface-1` color token."
- "Hey AI, find the bug in this useEffect."

Not acceptable:
- "Hey AI, design the architecture for this app."
- "Hey AI, decide the API contract."
- "Hey AI, choose the database."

For each piece of code AI writes:
1. Read it before pasting.
2. Type out a one-sentence explanation of what it does.
3. If you can't, ask AI to explain. If the explanation is fluffy, dig deeper.
4. If the code calls a library function you don't know, look up the library docs (not just the AI's interpretation).

For the architectural decisions in Stage 1 and the README:
1. Write them yourself first, with bullet points.
2. Then ask AI to help you phrase them better.
3. Read the result. Ensure every claim is one you can defend live.

## 5.5 Information Control vs. the Competitor

You said the competitor has your PRD. Assume they also know:
- The PRD itself (verbatim)
- The rubric
- The general pattern of solutions (Yjs, MongoDB, Socket.IO are kind of obvious)

What they likely DON'T know (and you should NOT share):
- Your specific architectural decisions (two-service split, Yjs + separate event log dual-layer, derived task/state projections)
- Your bonus feature pick (Time-Travel Replay) and how you're implementing it
- Your AI-extraction enrichment (assignee/date parsing)
- Your design system specifics (cream + yellow, traffic-sign-color intent map) — they might infer your inspiration is the same site, but won't know how you mapped it
- Your demo narrative

**Do not:**
- Casually chat with them in the hallway about "what stack are you using"
- Show them your laptop screen
- Brag about Time-Travel Replay before the demo
- Share your repo URL even via "private" link (assume any link can leak)
- Discuss any of Sections 2 or 5 of this document with them

**You can safely say:**
- "We're using Yjs" (everyone is)
- "Next.js" (common)
- "MongoDB" (common)
- "We're building the obvious things first"
- General pleasantries

If they're aggressive about probing, say "I don't want to influence your build, let's compare notes after" and move on.

---

# SECTION 6 — JUDGE IMPRESSION STRATEGY

## 6.1 The Demo Narrative

A demo is a story. Yours is:

> "Three minutes ago, our team finished a sprint planning session. Watch what came out of it — automatically."

Open with the **outcome**, not the canvas. Show:
1. A live canvas full of stickies (pre-seeded — don't type during demo)
2. Switch to the Task Board → 6 action items appear, each with assignee and due date
3. "All of this came from a real brainstorm. Nobody copy-pasted anything. Let me show you how."

Then unfold the demo:
- New sticky in front of judges → AI tags it as action item → it appears on board within 3s
- Click the task → canvas zooms to its source sticky
- Lead locks the architecture sticky → contributor's UI updates instantly with lock
- Open another tab as Viewer → try to edit → blocked
- Open browser DevTools → send a raw WebSocket mutation as Viewer → server rejects

**Then the closer.** Drag the time-travel slider:

> "And because we built this on event sourcing, you can scrub through the entire session like a video."

The canvas rewinds. Stickies disappear, appear, get edited. The judges' eyes light up.

Total time: ~3–4 minutes. Practice it 3 times on the morning of demo day.

## 6.2 What Judges Reward in Hackathons Like DevDay

Based on typical CS hackathon judging:

1. **Working software over slides.** A live demo that runs > a beautiful slide deck.
2. **Architectural maturity.** Judges (often senior engineers) reward teams who chose hard architectures (event sourcing, CRDTs) and pulled them off, even imperfectly. They penalize teams who chose easy architectures perfectly.
3. **Specific technical reasoning.** "We chose X because Y, knowing the trade-off was Z." Concrete, not generic.
4. **Owning the failure mode.** Don't pretend everything works. Demo crashes happen. Calmly say "that's a flaky integration we know about" and move on.
5. **The team can answer specific questions.** All three teammates should be able to answer "why did you choose this DB" without looking at notes.
6. **The product solves a real problem.** Lead with the pain. End with the relief.

Things they don't care about:
- Lines of code
- Number of features
- Whether the UI is "beautiful" in a brand sense (versus consistent and usable)

## 6.3 Pitch Structure (Stage 1 — Architecture Pitch)

You have ~5–7 minutes. Structure:

**Slide 1: The pain (30s)**
- "Brainstorm action items get lost." One sentence problem statement.

**Slide 2: The product, in one diagram (1 min)**
- Architecture diagram showing canvas + task board + AI layer + event log.
- Pre-built in Excalidraw.

**Slide 3: The interesting decision (2 min)**
- "We chose event sourcing as our state mechanism, not just an audit log."
- Explain: state = fold over events. Time travel falls out for free.

**Slide 4: Conflict resolution (1 min)**
- "We use Yjs (CRDT) because OT requires O(n²) transform functions and we have 24 hours."
- Show a brief Yjs Y.Text snippet.

**Slide 5: RBAC (30s)**
- "Per-node ACLs, server-validated on every mutation. Demonstrated with a wscat test."

**Slide 6: Stack and deployment (30s)**
- Two-service split on Render. MongoDB Atlas. Gemini for AI.

**Slide 7: Roadmap and risks (30s)**
- What's MVP, what's bonus, what we'll cut if behind.

**Q&A (1–2 min)**
- Hammad fields backend Qs. Anas fields AI/REST Qs. You field architecture/UX Qs.

## 6.4 The Magic Moment

Every winning hackathon demo has ONE moment that lodges in the judges' brains. For LIGMA, your magic moment is:

**The Time-Travel Reveal.**

Pick a moment in the demo where the canvas is full and busy. Say:
> "But here's something we got essentially for free."

Drag the slider all the way to the start. The canvas reverts to empty. Drag back forward — stickies appear in order, get edited, get classified, get locked. It looks like a video of the brainstorm playing back.

> "We didn't build replay. Replay was a one-line consequence of choosing event sourcing on day one."

This is the line. Practice it. Time it.

## 6.5 Demonstrating Depth Without Being Boring

Judges glaze over if you read jargon at them. The trick: **alternate concrete and abstract**.

Bad: "We use a CRDT-based system with operational metadata for partial-order convergence."

Good: "Watch — Hammad and I both type in the same sticky. [demonstrate]. Both versions merge. We didn't write the merge logic ourselves; we used Yjs, a CRDT library. Why CRDT and not OT? Because OT requires us to write transform functions for every operation pair. CRDTs converge automatically. Less code, less risk."

Pattern: **demo → name → why → trade-off**.

## 6.6 Demo Risk Mitigation

- [ ] **Pre-recorded backup video.** Loom recording of a successful demo. If anything crashes, switch to it within 10 seconds.
- [ ] **Pre-seeded data.** Don't type from scratch during the demo. Have a JSON dump of "Sprint Planning Demo" data that loads fresh in 1 second.
- [ ] **Three browser tabs pre-arranged.** Lead, Contributor, Viewer. Sized and positioned. Don't fumble during the live demo.
- [ ] **DevTools pre-open** in one tab for the RBAC bypass demo.
- [ ] **All Render services pre-warmed** 1 minute before slot.
- [ ] **Phone hotspot ready** as backup if hackathon Wi-Fi fails.
- [ ] **Demo script printed** so you don't lose your place.
- [ ] **Practice the demo 3 times** the morning of, not the night before.

---

# CLOSING NOTES

You're going into this with three real advantages:

1. **You've thought about the architecture deeply.** Most teams will spend Stage 1 winging it. Yours will be tight.
2. **You understand the rubric in detail.** Most teams will optimize for "looks cool"; you'll optimize for points.
3. **You've identified the wow factor (Time-Travel Replay).** Most teams will pick AI Summary Export, which is forgettable.

Your three biggest risks:

1. **Cutting corners on RBAC server-side.** Don't. It's the only criterion judges will actively try to break.
2. **Sleeping less than 4 hours.** Your code will get worse, not better. Sleep is part of the strategy.
3. **Trusting AI-generated CRDT integration without reading the Yjs docs.** Read the docs. Trust your eyes.

Three pieces of advice from someone who has watched a lot of hackathon presentations:

1. **The team that gets the demo URL accessible publicly first usually wins.** Deploy at hour 4.
2. **Boring features that work are worth more than clever features that don't.** Ship the MVP first.
3. **The narrative beats the feature list.** "We built event sourcing so time travel comes for free" is a story. "We have a time travel feature" is just a checkbox.

Now close this doc, print Section 1.12 (the rubric breakdown), set up the repo, and go to bed by midnight. Tomorrow you build.

— End of Battle Plan —
