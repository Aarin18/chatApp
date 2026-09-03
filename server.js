const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

server.on("connection", (socket) => {
  socket.roomCode = null;

  socket.on("message", (rawMessage) => {
    let data;
    try {
      data = JSON.parse(rawMessage.toString());
    } catch {
      return;
    }

    if (data.type === "join" && /^[A-Z0-9]{6}$/.test(data.roomCode)) {
      socket.roomCode = data.roomCode;
      return;
    }

    if (data.type !== "message" || !socket.roomCode ||
        typeof data.username !== "string" || typeof data.message !== "string") {
      return;
    }

    const outgoingMessage = JSON.stringify({
      type: "message",
      roomCode: socket.roomCode,
      username: data.username.slice(0, 50),
      message: data.message.slice(0, 2000)
    });

    for (const client of server.clients) {
      if (client !== socket && client.readyState === WebSocket.OPEN && client.roomCode === socket.roomCode) {
        client.send(outgoingMessage);
      }
    }
  });
});

console.log("WebSocket server is running at ws://localhost:8080");
