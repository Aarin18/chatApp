const adjectives = ["Swift", "Bright", "Clever", "Cosmic", "Happy", "Quiet", "Bold", "Lucky"];
const nouns = ["Fox", "Otter", "Falcon", "Panda", "Comet", "Tiger", "Wolf", "Dolphin"];
const roomAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const username = `${pick(adjectives)}-${pick(nouns)}-${randomNumber(10, 99)}`;
let roomCode = createRoomCode();
let socket;

const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const usernameDisplay = document.getElementById("username-display");
const roomCodeDisplay = document.getElementById("room-code-display");
const joinRoomInput = document.getElementById("join-room-code");
const roomStatus = document.getElementById("room-status");

usernameDisplay.textContent = username;
updateRoomDisplay();
connect();

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRoomCode() {
  return Array.from({ length: 6 }, () => pick(roomAlphabet)).join("");
}

function connect() {
  socket = new WebSocket("ws://localhost:8080");

  socket.addEventListener("open", () => {
    joinCurrentRoom();
    setRoomStatus(`Connected to room ${roomCode}.`);
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "message" && data.roomCode === roomCode) {
      appendMessage(data.username, data.message, true);
    }
  });

  socket.addEventListener("close", () => setRoomStatus("Disconnected from the chat server."));
  socket.addEventListener("error", () => setRoomStatus("Could not connect to the chat server."));
}

function joinCurrentRoom() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "join", roomCode }));
  }
}

function updateRoomDisplay() {
  roomCodeDisplay.textContent = roomCode;
}

function setRoomStatus(status) {
  roomStatus.textContent = status;
}

function changeRoom(newRoomCode) {
  roomCode = newRoomCode;
  updateRoomDisplay();
  chatBox.replaceChildren();
  joinCurrentRoom();
  setRoomStatus(`You joined room ${roomCode}.`);
}

function appendMessage(sender, text, received) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  if (received) messageDiv.classList.add("received");

  const senderName = document.createElement("strong");
  senderName.textContent = received ? `${sender}: ` : `:${sender}`;
  messageDiv.append(received ? senderName : document.createTextNode(text));
  if (received) messageDiv.append(document.createTextNode(text));
  if (!received) messageDiv.append(senderName);

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || socket.readyState !== WebSocket.OPEN) return;

  appendMessage(username, message, false);
  socket.send(JSON.stringify({ type: "message", username, message }));
  messageInput.value = "";
}

document.getElementById("sendButton").addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});

document.getElementById("create-room-button").addEventListener("click", () => {
  changeRoom(createRoomCode());
});

document.getElementById("join-room-button").addEventListener("click", () => {
  const code = joinRoomInput.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    setRoomStatus("Enter a valid 6-character room code.");
    return;
  }
  joinRoomInput.value = "";
  changeRoom(code);
});

document.getElementById("copy-room-button").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(roomCode);
    setRoomStatus("Room code copied.");
  } catch {
    setRoomStatus(`Copy this room code: ${roomCode}`);
  }
});
