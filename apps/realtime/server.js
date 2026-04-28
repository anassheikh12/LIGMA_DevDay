const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { setupWSConnection } = require("y-websocket/bin/utils");

const app = express();
const server = http.createServer(app);

// ── CORS ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: ALLOWED_ORIGIN }));

// ── Health-check ────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "ligma-realtime" });
});

// ── Socket.IO (not used for Yjs in this spike, but wired for later) ────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`[socket.io] client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[socket.io] client disconnected: ${socket.id}`);
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
