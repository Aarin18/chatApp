// script.js

let socket = null;
let username = "";
let currentRoom = "";

// ---- Screens ----
const usernameScreen = document.getElementById("usernameScreen");
const roomScreen = document.getElementById("roomScreen");
const chatScreen = document.getElementById("chatScreen");

function showScreen(screen) {
  [usernameScreen, roomScreen, chatScreen].forEach((s) =>
    s.classList.remove("active"),
  );
  screen.classList.add("active");
}

// ---- Username screen elements ----
const usernameInput = document.getElementById("usernameInput");
const clearBtn = document.getElementById("clearBtn");
const usernameError = document.getElementById("usernameError");
const submitBtn = document.getElementById("submitBtn");
const roomScreenUsername = document.getElementById("roomScreenUsername");

usernameInput.addEventListener("input", function () {
  if (this.value.trim().length > 0) {
    clearBtn.classList.remove("opacity-0", "pointer-events-none");
    clearBtn.classList.add("opacity-100", "pointer-events-auto");
  } else {
    clearBtn.classList.add("opacity-0", "pointer-events-none");
    clearBtn.classList.remove("opacity-100", "pointer-events-auto");
  }
});

clearBtn.addEventListener("click", function (e) {
  e.preventDefault();
  usernameInput.value = "";
  usernameInput.focus();
  clearBtn.classList.add("opacity-0", "pointer-events-none");
  clearBtn.classList.remove("opacity-100", "pointer-events-auto");
});

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") setUsername();
});
submitBtn.addEventListener("click", setUsername);

function setUsername() {
  const value = usernameInput.value.trim();
  usernameError.classList.add("hidden");

  if (value === "") {
    usernameError.textContent = "Please enter a username.";
    usernameError.classList.remove("hidden");
    return;
  }
  if (value.length > 20) {
    usernameError.textContent = "Username must be 20 characters or less.";
    usernameError.classList.remove("hidden");
    return;
  }

  username = value;
  roomScreenUsername.textContent = username;
  showScreen(roomScreen);
}

function changeUsername() {
  if (socket) socket.close();
  document.getElementById("chat-box").innerHTML = "";
  usernameInput.value = "";
  showScreen(usernameScreen);
  usernameInput.focus();
}

// ---- Room screen elements ----
const codeContainer = document.getElementById("codeContainer");
const roomCodeText = document.getElementById("roomCodeText");
const generateBtn = document.getElementById("generateBtn");
const generateBtnText = document.getElementById("generateBtnText");
const enterCreatedRoomBtn = document.getElementById("enterCreatedRoomBtn");
const copyIcon = document.getElementById("copyIcon");
const joinCodeInput = document.getElementById("joinCodeInput");
const roomError = document.getElementById("roomError");
const toastMessage = document.getElementById("toastMessage");
const toastIcon = document.getElementById("toastIcon");
const toastText = document.getElementById("toastText");

let createdRoomCode = "";

function showToast(text, icon = "check_circle") {
  toastText.textContent = text;
  toastIcon.textContent = icon;
  toastMessage.classList.remove("opacity-0", "pointer-events-none");
  toastMessage.classList.add("opacity-100");
  setTimeout(() => {
    toastMessage.classList.remove("opacity-100");
    toastMessage.classList.add("opacity-0", "pointer-events-none");
  }, 2200);
}

// Generates a random 6-character alphanumeric code, e.g. "A1B2C3"
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function createRoom() {
  createdRoomCode = generateRoomCode();
  roomCodeText.textContent = createdRoomCode;
  codeContainer.style.display = "flex";
  generateBtnText.textContent = "Generate New Code";
  enterCreatedRoomBtn.style.display = "flex";
  showToast("New room generated!", "autorenew");
}

function copyCode() {
  if (!createdRoomCode) return;
  navigator.clipboard
    .writeText(createdRoomCode)
    .then(() => {
      copyIcon.textContent = "done";
      showToast("Code copied — share it with the other person!");
      setTimeout(() => (copyIcon.textContent = "content_copy"), 2000);
    })
    .catch(() => {
      showToast("Copy failed — code is: " + createdRoomCode);
    });
}

function enterCreatedRoom() {
  enterRoom(createdRoomCode);
}

function joinRoomWithCode() {
  const code = joinCodeInput.value.trim().toUpperCase();
  roomError.classList.add("hidden");
  if (code === "") {
    roomError.textContent = "Please enter a room code.";
    roomError.classList.remove("hidden");
    return;
  }
  enterRoom(code);
}

joinCodeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") joinRoomWithCode();
});

function leaveRoomScreen() {
  if (socket) socket.close();
  document.getElementById("chat-box").innerHTML = "";
  codeContainer.style.display = "none";
  generateBtnText.textContent = "Generate Code";
  enterCreatedRoomBtn.style.display = "none";
  createdRoomCode = "";
  joinCodeInput.value = "";
  roomError.classList.add("hidden");
  showScreen(roomScreen);
}

// ---- Chat screen elements ----
const currentUsernameLabel = document.getElementById("currentUsernameLabel");
const currentRoomLabel = document.getElementById("currentRoomLabel");
const connectionStatus = document.getElementById("connectionStatus");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("sendButton");
const chatBox = document.getElementById("chat-box");

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function enterRoom(code) {
  currentRoom = code;
  currentRoomLabel.textContent = "#" + code;
  currentUsernameLabel.textContent = username;

  showScreen(chatScreen);
  connectToServer();
}

// ---- WebSocket connection ----
function connectToServer() {
  socket = new WebSocket("ws://localhost:8080");

  connectionStatus.innerHTML =
    '<span class="inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span> Connecting...';
  messageInput.disabled = true;
  sendButton.disabled = true;

  socket.onopen = function () {
    socket.send(JSON.stringify({ type: "join", room: currentRoom, username }));
    connectionStatus.innerHTML =
      '<span class="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span> Connected';
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  };

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === "system") {
      const notice = document.createElement("div");
      notice.className = "flex justify-center";
      notice.innerHTML = `<div class="px-space-md py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm shadow-[inset_2px_2px_4px_#A3B1C6,inset_-2px_-2px_4px_#FFFFFF]">${escapeHTML(data.message)}</div>`;
      chatBox.appendChild(notice);
      chatBox.scrollTop = chatBox.scrollHeight;
      return;
    }

    if (data.username === username) return; // already shown locally

    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-start w-full pr-8";
    wrapper.innerHTML = `
      <div class="flex items-center gap-space-2xs mb-1 ml-2">
        <span class="w-2 h-2 rounded-full bg-secondary-container"></span>
        <span class="font-label-sm text-label-sm text-secondary font-semibold">${escapeHTML(data.username)}</span>
      </div>
      <div class="max-w-[85%] bg-surface-container rounded-[20px] rounded-bl-[6px] p-space-md shadow-[inset_3px_3px_6px_#A3B1C6,inset_-3px_-3px_6px_#FFFFFF] text-on-surface">
        <p class="font-body-md text-body-md leading-relaxed">${escapeHTML(data.message)}</p>
      </div>
    `;
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  socket.onclose = function () {
    connectionStatus.innerHTML =
      '<span class="inline-block w-1.5 h-1.5 rounded-full bg-error"></span> Disconnected — reconnecting...';
    messageInput.disabled = true;
    sendButton.disabled = true;
    if (currentRoom) {
      setTimeout(connectToServer, 2000);
    }
  };

  socket.onerror = function (err) {
    console.error("WebSocket error:", err);
    connectionStatus.innerHTML =
      '<span class="inline-block w-1.5 h-1.5 rounded-full bg-error"></span> Connection error';
  };
}

// ---- Sending messages ----
function sendMessage() {
  const message = messageInput.value.trim();
  if (message === "") return;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectionStatus.innerHTML =
      '<span class="inline-block w-1.5 h-1.5 rounded-full bg-error"></span> Not connected';
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col items-end w-full pl-8";
  wrapper.innerHTML = `
    <div class="max-w-[85%] bg-primary-fixed rounded-[20px] rounded-br-[6px] p-space-md shadow-[-4px_-4px_9px_#FFFFFF,4px_4px_9px_#A3B1C6] text-on-primary-fixed">
      <p class="font-body-md text-body-md leading-relaxed">${escapeHTML(message)}</p>
    </div>
    <div class="flex items-center gap-1 mt-1 mr-2 text-on-surface-variant">
      <span class="font-label-sm text-label-sm">${timeStr}</span>
    </div>
  `;
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  socket.send(JSON.stringify({ type: "chat", username, message }));

  messageInput.value = "";
  messageInput.focus();
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
