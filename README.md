# Chat App

A real-time chat app with custom usernames and shareable room codes, built with plain HTML/CSS/JS on the frontend and Node.js + WebSockets (`ws`) on the backend.

## Features

- Pick your own username
- Generate a random room code and share it with someone to chat privately
- Or join an existing room by entering a code
- Messages are only broadcast to people in the same room
- Auto-reconnects if the connection drops
- Neumorphic (soft UI) mobile-first design

## Project structure

```
chatapp/
├── index.html      # Frontend UI (username, room, and chat screens)
├── script.js        # Frontend logic (WebSocket client, room code generation)
├── server.js         # Backend WebSocket server (Node.js)
└── package.json     # Dependencies
```

## Running locally

1. Install dependencies:
   ```
   npm install
   ```
2. Start the server:
   ```
   node server.js
   ```
   You should see:
   ```
   ✅ WebSocket chat server running on ws://localhost:8080
   ```
3. Open `index.html` in your browser. Open it in a second tab to simulate a second person — set a different username in each, generate a room code in one tab, and join with that code in the other.

## Deploying

`index.html` and `script.js` are static files and can be hosted on **GitHub Pages**.

`server.js` is a live Node.js process and needs a host that supports persistent connections — GitHub Pages cannot run it. Use a platform like **Render**, **Railway**, or **Fly.io** instead:

1. Deploy `server.js` (with `package.json`) to Render as a Web Service.
   - Build command: `npm install`
   - Start command: `node server.js`
2. Copy the public URL Render gives you (e.g. `https://your-app-name.onrender.com`).
3. In `script.js`, update the connection line to use that URL with `wss://` (secure WebSocket) instead of `ws://localhost:8080`:
   ```js
   const socket = new WebSocket("wss://your-app-name.onrender.com");
   ```
4. Push the updated `script.js` to GitHub — GitHub Pages will redeploy automatically.

**Note:** Free tiers on hosts like Render spin down when idle, so the first message after a period of inactivity may take 10–20 seconds to go through while the server wakes up.

## Tech stack

- Frontend: HTML, Tailwind CSS (via CDN), vanilla JavaScript
- Backend: Node.js, [`ws`](https://www.npmjs.com/package/ws) WebSocket library
