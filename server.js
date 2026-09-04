// server.js
// Simple WebSocket chat server.
// Run with: node server.js
// Requires: npm install ws

const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`✅ WebSocket chat server running on port ${PORT}`);

// roomCode -> Set of client sockets in that room
const rooms = new Map();

function joinRoom(ws, room, username) {
  // Leave any previous room first
  leaveRoom(ws);

  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room).add(ws);
  ws.room = room;
  ws.username = username;

  console.log(`🔑 ${username} joined room "${room}" (${rooms.get(room).size} in room)`);

  // Let everyone else in the room know someone joined
  broadcastToRoom(room, {
    type: "system",
    message: `${username} joined the chat`,
  }, ws);
}

function leaveRoom(ws) {
  if (!ws.room) return;
  const members = rooms.get(ws.room);
  if (members) {
    members.delete(ws);
    if (members.size === 0) {
      rooms.delete(ws.room);
    } else {
      broadcastToRoom(ws.room, {
        type: "system",
        message: `${ws.username} left the chat`,
      }, ws);
    }
  }
  ws.room = null;
}

function broadcastToRoom(room, payload, exclude) {
  const members = rooms.get(room);
  if (!members) return;
  members.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  ws.on("message", (data) => {
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      console.error("Invalid message received:", data);
      return;
    }

    if (parsed.type === "join") {
      // { type: "join", room: "AB12CD", username: "Arin" }
      joinRoom(ws, parsed.room, parsed.username);
      return;
    }

    if (parsed.type === "chat") {
      // { type: "chat", username, message }
      if (!ws.room) return; // not in a room yet, ignore
      console.log(`💬 [${ws.room}] ${parsed.username}: ${parsed.message}`);
      broadcastToRoom(ws.room, parsed, ws);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    leaveRoom(ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
  });
});
