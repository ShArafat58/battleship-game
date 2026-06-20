# ⚓ Battleship — Real-Time Multiplayer

A real-time multiplayer Battleship game for two remote opponents. Enter a name, create or join a game session with a custom grid and fleet, place your ships, and battle an opponent live — every shot syncs instantly with no page reloads. Player stats are tracked on a global leaderboard.

**Live demo:** https://battleship-game-44qs.onrender.com

## Features

- **No registration** — just enter a name. Duplicate names get a visual identifier (e.g. "John", "John 2", "John 3").
- **Real-time multiplayer** — two remote players battle live over WebSockets; opponent moves appear instantly without reloading.
- **Multiple concurrent games** — many independent games can run at the same time between different pairs of players.
- **Lobby system** — create a game session or join an open one from a live-updating list.
- **Custom setup** — choose the grid size (8×8, 10×10, 12×12) and configure the fleet (add/remove ships and sizes) when creating a game.
- **Ship placement** — place ships by clicking, rotate with the `R` key, with live valid/invalid feedback, plus Randomize and Reset.
- **Turn-based battle** — classic Battleship rules (a hit earns another shot; a miss passes the turn), with hit/miss/sunk tracking and coordinate-labeled boards.
- **Persistent leaderboard** — wins, losses, and games played are stored per player name in a PostgreSQL database and shown in the lobby.
- **Disconnect handling** — if an opponent leaves mid-game, the remaining player is notified and the game ends cleanly.

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React + Vite + TypeScript           |
| Styling     | Tailwind CSS (custom naval theme)   |
| Backend     | Node.js + Express + TypeScript      |
| Real-time   | Socket.IO (WebSockets)              |
| Database    | PostgreSQL (Neon)                   |
| Hosting     | Render (single web service)         |

## How It Works

- The client and server communicate over **Socket.IO**. Each match runs in its own room so many games can happen at once.
- The **server is authoritative** for all game logic — it validates every shot, decides hit/miss/sunk, tracks whose turn it is, and detects the winner. Clients never decide the outcome.
- Active game state (boards, shots, turns) lives in memory on the server; only **player stats** are persisted to PostgreSQL.
- Players are identified by their display name, which is also the key for their leaderboard record.

## Project Structure
Task 6/

├── client/        # React + Vite + TypeScript frontend

├── server/        # Express + Socket.IO + TypeScript backend

└── package.json   # root build/start scripts for single-service deployment

## Running Locally

You'll need a PostgreSQL connection string (e.g. a free database from [Neon](https://neon.tech)).

1. Create a file `server/.env` with:
DATABASE_URL=your_postgresql_connection_string

2. Start the backend (terminal 1):
```bash
   cd server
   npm install
   npm run dev      # runs on port 3001
```

3. Start the frontend (terminal 2):
```bash
   cd client
   npm install
   npm run dev      # runs on port 5173
```

4. Open http://localhost:5173 in two separate browser windows to play against yourself.

## Deployment

Deployed to Render as a single web service:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment variable:** `DATABASE_URL` (the PostgreSQL connection string)

The Express server serves both the API/WebSocket connection and the built React app, listening on `process.env.PORT`.
