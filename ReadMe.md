# CoWatch — Real-time Watch Party App

CoWatch is a real-time co-watching web app. Create or join a room, watch a synced video together, chat live, send emoji reactions, and manage who controls playback (admin / viewers), all over Socket.IO.

---

## Features

**Rooms**
- Create and join watch rooms; rooms are saved, so a link keeps working after a server restart or after everyone has left (unused rooms are removed after 7 days)
- Shareable invite links (`/?join=ROOM_ID`), with a native share sheet on phones and a copy/email fallback
- Joining a code that doesn't exist shows a clear "room not found" message instead of creating an empty room
- Live presence (people list, admin badge) and quiet "Asha joined / left" lines in chat
- Admin transfer, and an admin who drops (phone locks, wifi blip) can take the role back within 2 minutes

**Watching**
- Synchronized playback across everyone in the room, with automatic drift correction every 3 seconds
- Video sources: YouTube, direct video links (`.mp4` and similar) and Google Drive files (see [Video sources](#video-sources))
- **Shared control:** the admin can let everyone play, pause and seek (People tab switch)
- Viewers can pause locally; a **Sync with room** button or pressing play again catches them up
- "Tap to join in" overlay when the browser blocks autoplay (common on phones)
- Emoji reactions that float over the video for everyone
- "Reconnecting…" banner when the connection drops

**Chat**
- Live chat saved with Prisma, with history and "load older messages" paging
- Timestamps, an unread counter on the Chat tab, and a per-connection rate limit

**Interface**
- Minimalist dark-navy design, serif display type, one cyan accent
- Phone-friendly layout (video on top, chat below, safe-area aware)

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Socket.IO client, react-youtube, lucide-react
- **Backend:** Node.js (ESM), Express 5, Socket.IO 4
- **Database:** PostgreSQL through Prisma 6 (developed against Supabase)
- **Realtime protocol:** WebSockets (with polling fallback)

---

## Project Structure (High-level)

```text
frontend/
  src/
    components/
      layout/            Navbar, Footer
      sections/          HeroSection, HeroIllustration, FeaturesSection, ReadySection
      ui/                Button, SectionContainer
      modals/
        RoomAccessModal.jsx
      room/
        ChatPanel.jsx    chat + people tab + shared-control switch
        VideoStage.jsx   YouTube / native / Drive players and the sync logic
        Reactions.jsx    reaction bar + floating emoji layer
        RoomTopBar.jsx
        modals/          ModalShell, InviteModal, SetVideoModal, LeaveRoomModal
    data/features.js
    pages/
      RoomPage.jsx
    services/
      socket.js
    utils/               room.js (room ids), clipboard.js
    App.jsx
    index.css            design tokens (@theme) and animations

backend/
  prisma/
    schema.prisma        ChatMessage and RoomState (the other models are unused)
  src/
    sockets/
      room.socket.js     all realtime events
    data/
      inMemoryStore.js   live rooms (who is connected right now)
    config/
      prisma.js
```

---

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_URL=http://localhost:5000

# Optional but recommended: lets Google Drive videos stream reliably (see "Video sources")
VITE_DRIVE_API_KEY=your_google_api_key
```

### Backend (`backend/.env`)
```env
PORT=5000
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

`DIRECT_URL` is used by Prisma for schema changes; with Supabase use the session pooler / direct connection string. The 3-second resync interval is the `RESYNC_INTERVAL_MS` constant in `room.socket.js`.

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
npx prisma db push
```

Run `npx prisma db push` again whenever `schema.prisma` changes (for example, the `RoomState` table that stores rooms). This project currently uses `db push` rather than `migrate dev` because the original `init` migration folder is not in the repository. Restore it from git history, commit it, and switch back to `migrate dev` when you can.

### 3) Start backend
```bash
npm run dev
```

### 4) Start frontend
```bash
cd ../frontend
npm run dev
```

Open the frontend, create a room, then open the invite link in a second browser window to try sync, chat and reactions.

---

## Video sources

| Source | Synced? | Notes |
| --- | --- | --- |
| YouTube | Yes | `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/live/`, and `m.` / `music.` links. A `t=` start time is ignored; the room's shared position decides where playback starts. |
| Direct video link | Yes | Any `http(s)` link the browser can play (MP4 with H.264/AAC is the safest). |
| Google Drive | Yes, when it can stream | The file must be shared as **Anyone with the link** and be in a browser-playable format. It is played in a normal video element so it can be synced. |

**Google Drive details.** Drive's own embed player cannot be controlled from outside, so it can never sync. CoWatch streams the file into a normal video element instead. With `VITE_DRIVE_API_KEY` set it uses the official Drive API; without a key it falls back to Drive's public download link, which works for many files but is not guaranteed. If Drive refuses to stream a file (private, over quota, unsupported format), the player drops back to Drive's embed, which still plays but is not synced, and shows a notice.

To get a key: in Google Cloud Console create a project, enable the **Google Drive API**, create an **API key**, restrict it to the Drive API and to your site's addresses (for example `http://localhost:5173/*` and your deployed domain), and put it in `frontend/.env`. The key ends up in the browser, so the restrictions matter. Normal use is free of charge under Google's published quotas.

Video links must start with `http://` or `https://` and be at most 2,000 characters.

---

## Core Realtime Events

### Room / Presence
- `room:create` `{ roomId, roomName, userName, clientId }`
- `room:join` `{ roomId, userName, clientId }`: restores a saved room if needed; replies with `room:error` (`ROOM_NOT_FOUND`) for an unknown code
- `room:leave` `{ roomId }`: removes only the connection that sent it
- `room:you` `{ id }`: the sender's own public id
- `presence:users` `{ users: [{ id, userName, isAdmin }] }`
- `room:meta` `{ roomId, roomName, sharedControl }`
- `room:control` `{ roomId, shared }` (admin only)
- `room:notice` `{ message, time }`: system lines shown in chat ("Asha joined", "You're sending messages too fast")
- `room:error` `{ code, roomId, message }`
- `admin:transfer` `{ roomId, targetId }` (admin only; `targetId` is a public id)

### Video Sync
- `video:set` `{ roomId, videoUrl }` (admin only)
- `video:update` `{ videoUrl }`
- `video:state:update` `{ roomId, isPlaying, positionSec }` (admin, or anyone while shared control is on)
- `video:state:request`
- `video:state` `{ isPlaying, positionSec, updatedAt }`

### Reactions
- `reaction:send` `{ roomId, emoji }`: only ❤️ 😂 😮 👏 🔥 😢 are accepted
- `reaction` `{ id, emoji, userName, senderId }`

### Chat
- `chat:message` `{ roomId, message }` (the sender is taken from the server-side session, never from the payload)
- `chat:message` broadcast `{ userName, senderId, message, time }`
- `chat:history`
- `chat:history:more` `{ roomId, beforeId }`

---

## Sync Model

- The backend keeps one canonical playback state per room: `isPlaying`, `positionSec`, `updatedAt`. The effective position is derived from elapsed time.
- Who may change it: the admin, or everyone while the admin has switched on **shared control**. The server enforces this; the client only hides the controls.
- The backend broadcasts `video:state` every **3 seconds** (and immediately on every change).
- People who follow the room (everyone except the admin, or everyone when control is shared):
  - receive the state and seek/play/pause their own player to match
  - can pause locally; the periodic resync won't un-pause them. Pressing play again, or **Sync with room**, requests the latest state and jumps back to the room's timeline
- When the player pauses/plays/seeks itself to follow the room, the resulting player events are ignored for a short window, so following the room is never mistaken for a user action (this is what keeps several controllers from echoing stale positions at each other).
- When a video ends, the room is set to "paused at the end" so its clock stops.
- If the browser blocks autoplay, a "Tap to join in" overlay appears; tapping it seeks to the room's current position and starts playback.

---

## Identity and Security

- Each browser keeps a random `clientId` in `localStorage`. It is the secret that proves who you are (admin checks use it) and is **never sent to other users**.
- Other users see a derived **public id** instead (a hash of the `clientId`) in the people list, chat, reactions and admin transfer.
- The server decides who is speaking from the socket's own session; chat and reactions can't be posted as someone else or into a room you haven't joined.
- Input limits: user name 40 characters, room name 60, chat message 2,000, video link 2,000 (`http(s)` only). Chat is limited to 6 messages per 5 seconds per connection and reactions to 8 per 3 seconds.
- This is **not real authentication**. Anyone who obtains another person's `clientId` (for example by copying their `localStorage`) can act as them. Real sign-in (JWT) is on the roadmap.

---

## Persistence

Live presence (who is connected) stays in memory. Rooms are also saved to the `RoomState` table:

- Saved: room name, admin, video link, playback position, shared-control setting.
- When: on creation, on every admin or setting change, shortly after play/pause/seek (debounced), every 30 seconds while a video is playing, and when the last person leaves.
- Restore: the first person to open the link after a restart (or after everyone left) brings the room back, **paused at the last saved position**.
- Admin after a restore: the saved admin gets 15 seconds to come back; after that, whoever is present is promoted.
- Cleanup: rooms not used for 7 days are deleted automatically.
- Chat messages were already saved in `ChatMessage`; they survive restarts too.

---

## Invite Flow

1. Anyone in the room opens **Invite**.
2. The modal shows the link `https://<frontend-domain>/?join=<ROOM_ID>` with **Copy link**, **Share** (on devices with a share sheet) and **Email**.
3. The recipient opens the link. An invite link always takes priority over a room saved in their browser from an earlier visit.
4. The Join dialog opens with the room code prefilled; they enter a name and join.
5. If the code doesn't exist, they are sent back with a "That room doesn't exist or has ended" message.

---

## Chat Behavior

- Messages are broadcast in real time and saved with Prisma.
- On join the user receives the latest 30 messages; older ones load on request.
- Join/leave/admin changes appear as quiet system lines (not saved).
- Your own messages show as "You"; messages from before public ids existed fall back to matching by name.

---

## Known Notes and Limitations

- Live room state is held in memory by one backend process. For several instances you would need the Socket.IO Redis adapter plus sticky sessions.
- Restored rooms always come back paused; the admin presses play.
- Identity is a browser-held `clientId`, not an account (see above).
- Drive playback depends on the file's sharing settings, format and Google's quotas.
- There are no automated tests yet.
- Possible next steps: kick/mute, password-protected rooms, clickable links in chat, latency compensation for tighter sync, real authentication.

---