# CoWatch — Real-time Watch Party App

CoWatch is a real-time co-watching web app where users can create/join rooms, watch synced videos together, chat live, and manage room permissions (admin/viewer) over Socket.IO.

---

## Features

- Create and join watch rooms
- Shareable invite links (`/?join=ROOM_ID`)
- Real-time room presence (watcher list + admin badge)
- Synchronized playback across users (admin authoritative sync)
- Periodic drift correction / resync (every 3 seconds)
- Viewer local pause + manual resync on unpause
- Fullscreen support for all users
- In-room live chat with persisted messages (Prisma)
- Chat history + pagination-ready flow
- Admin transfer support

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Socket.IO client, react-youtube
- **Backend:** Node.js, Express, Socket.IO
- **Database:** Prisma ORM
- **Realtime Protocol:** WebSockets (with polling fallback)

---

## Project Structure (High-level)

```text
frontend/
  src/
    components/
      room/
        ChatPanel.jsx
        VideoStage.jsx
        RoomTopBar.jsx
        modals/
          InviteModal.jsx
    components/modals/
      RoomAccessModal.jsx
    pages/
      RoomPage.jsx
    services/
      socket.js
    App.jsx

backend/
  src/
    sockets/
      room.socket.js
    data/
      inMemoryStore.js
    config/
      prisma.js
```

---

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_URL=http://localhost:5000
```

### Backend (`backend/.env`)
```env
PORT=5000
CORS_ORIGINS=http://localhost:5173
RESYNC_INTERVAL_MS=3000
DATABASE_URL=your_database_url
```

---

## Run Locally

### 1) Install dependencies
```bash
# frontend
cd frontend
npm install

# backend
cd ../backend
npm install
```

### 2) Setup Prisma (backend)
```bash
npx prisma generate
npx prisma migrate dev
```

### 3) Start backend
```bash
npm run dev
```

### 4) Start frontend
```bash
cd ../frontend
npm run dev
```

---

## Core Realtime Events

### Room / Presence
- `room:create`
- `room:join`
- `room:leave`
- `presence:users`
- `room:meta`
- `admin:transfer`

### Video Sync
- `video:set`
- `video:update`
- `video:state:update` (admin only)
- `video:state:request`
- `video:state`

### Chat
- `chat:message`
- `chat:history`
- `chat:history:more` (pagination path)

---

## Sync Model

- Admin is source of truth for playback state.
- Backend stores canonical state per room:
  - `isPlaying`
  - `positionSec`
  - `updatedAt`
- Effective playback position is derived from elapsed time.
- Backend broadcasts periodic `video:state` resync every **3s**.
- Non-admin users:
  - can pause locally
  - can use fullscreen
  - on unpause, request latest state and resync to admin timeline

---

## Invite Flow

1. Admin opens Invite modal.
2. App generates link:
   - `https://<frontend-domain>/?join=<ROOM_ID>`
3. Recipient opens link.
4. App auto-opens Join modal with room ID prefilled.
5. User enters name and joins directly.

---

## Chat Behavior

- Messages broadcast in realtime via Socket.IO.
- Messages persisted with Prisma.
- On join, user receives chat history.
- Pagination-ready history flow avoids heavy initial loads for large rooms.

---

## Known Notes

- Room/video/playback runtime state is in-memory (`Map`) in backend.
- Best for single server instance.
- For horizontal scaling, add:
  - Redis adapter for Socket.IO
  - shared persistent room/playback state

---