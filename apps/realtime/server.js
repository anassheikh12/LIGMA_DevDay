require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { Server } = require("socket.io");
const { setupWSConnection } = require("y-websocket/bin/utils");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const app = express();
const server = http.createServer(app);

// ── CORS ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));

// ── MongoDB (lazy, cached) ──────────────────────────────────────────────
let mongoClientPromise = null;
function getMongo() {
  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  return mongoClientPromise;
}
async function getDb() {
  const client = await getMongo();
  return client.db();
}

// ── Health-check ────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "ligma-realtime" });
});

// ── Socket.IO ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// JWT auth middleware: parse `ligma-session` cookie from the handshake,
// verify it, and stash userId/name on socket.data.
io.use((socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) return next(new Error("unauthorized"));
    const cookies = cookie.parse(rawCookie);
    const token = cookies["ligma-session"];
    if (!token) return next(new Error("unauthorized"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.userId || !payload.name) {
      return next(new Error("unauthorized"));
    }
    socket.data.userId = payload.userId;
    socket.data.name = payload.name;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log(`[socket.io] client connected: ${socket.id} (user ${socket.data.userId})`);

  socket.on("room:join", async ({ roomId } = {}) => {
    if (!roomId || typeof roomId !== "string") return;
    try {
      const db = await getDb();
      const member = await db.collection("room_members").findOne({
        roomId,
        userId: socket.data.userId,
      });
      if (!member) {
        socket.emit("room:join:error", { error: "not a member" });
        return;
      }
      socket.data.color = member.color;
      socket.data.roomId = roomId;
      socket.join(roomId);
      socket.emit("room:join:ok", { role: member.role, color: member.color });
    } catch (err) {
      console.error("[socket.io] room:join error:", err);
      socket.emit("room:join:error", { error: "server error" });
    }
  });

  socket.on("cursor:move", ({ roomId, x, y } = {}) => {
    if (typeof x !== "number" || typeof y !== "number") return;
    if (!socket.data.userId || !socket.data.name || !socket.data.color) return;
    if (socket.data.roomId !== roomId) return;
    socket.to(roomId).emit("cursor:update", {
      userId: socket.data.userId,
      name: socket.data.name,
      color: socket.data.color,
      x,
      y,
    });
  });

  socket.on("disconnect", () => {
    console.log(`[socket.io] client disconnected: ${socket.id}`);
    if (socket.data.roomId && socket.data.userId) {
      socket.to(socket.data.roomId).emit("cursor:leave", {
        userId: socket.data.userId,
      });
    }
  });
});

// ── Yjs WebSocket handler ───────────────────────────────────────────────
// y-websocket expects a raw `ws` upgrade.  We attach it to the same HTTP
// server so a single port serves both Socket.IO and Yjs.
const WebSocket = require("ws");
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  // Socket.IO handles its own upgrade path (starts with /socket.io/)
  if (request.url.startsWith("/socket.io/")) return;

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws, req) => {
  // The room name comes from the URL path, e.g. /yjs/ligma-room
  setupWSConnection(ws, req);
  const docName = req.url.slice(1);
  console.log(`[LIGMA-SYNC] Connection established to room: ${docName}`);
});

// ── Start ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀  LIGMA Realtime running on http://localhost:${PORT}`);
  console.log(`    Yjs WebSocket:  ws://localhost:${PORT}/<room-name>`);
  console.log(`    Socket.IO:      http://localhost:${PORT}/socket.io/\n`);
});
