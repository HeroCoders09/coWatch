import { createHash } from "node:crypto";
import { rooms } from "../data/inMemoryStore.js";
import prisma from "../config/prisma.js";

const roomVideos = new Map();
const roomPlayback = new Map(); // roomId -> { isPlaying, positionSec, updatedAt }

// periodic room sync every 3s
const RESYNC_INTERVAL_MS = 3000;
const HISTORY_PAGE_SIZE = 30;
const MAX_MESSAGE_LENGTH = 2000;
const CHAT_RATE_LIMIT = 6; // messages...
const CHAT_RATE_WINDOW_MS = 5000; // ...per 5 seconds, per connection

const REACTION_RATE_LIMIT = 8; // reactions...
const REACTION_RATE_WINDOW_MS = 3000; // ...per 3 seconds, per connection
const REACTIONS = ["❤️", "😂", "😮", "👏", "🔥", "😢"];
// clients may send the emoji with or without the variation selector
const stripVS = (e) => e.replace(/\uFE0F/g, "");
const REACTION_LOOKUP = new Map(REACTIONS.map((e) => [stripVS(e), e]));

// ---- persistence ------------------------------------------------------------
const ROOM_TTL_MS = 7 * 24 * 60 * 60 * 1000; // rooms unused this long are deleted
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
const PERSIST_DEBOUNCE_MS = 5000; // coalesce bursts of play/pause/seek
const PERSIST_PLAYING_EVERY_MS = 30 * 1000; // keep the saved position fresh while playing
const TOUCH_THROTTLE_MS = 10 * 60 * 1000; // mark a room as "used" at most this often
// A restored room remembers its admin. That admin gets this long to come back
// (clients reconnect within seconds after a restart) before whoever is present
// is promoted instead.
const ADMIN_GRACE_MS = 15 * 1000;

let resyncTimerStarted = false;
let lastPlayingPersistAt = 0;

const isValidId = (v) => typeof v === "string" && v.length > 0 && v.length <= 64;

// ---- identity and input limits -------------------------------------------------
// The real clientId is the secret that proves who you are (admin checks use it),
// so it is never sent to anyone else. Other people see this derived id instead.
const publicIdOf = (clientId) =>
  createHash("sha256").update(`cowatch:${clientId}`).digest("hex").slice(0, 20);

const MAX_USER_NAME = 40;
const MAX_ROOM_NAME = 60;
const MAX_VIDEO_URL = 2000;

// an admin who drops (phone locked, wifi blip) can take the role back for this long
const RECLAIM_WINDOW_MS = 2 * 60 * 1000;

function cleanText(v, max) {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

// only plain web links are accepted as video sources
function cleanVideoUrl(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > MAX_VIDEO_URL) return null;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:" ? t : null;
  } catch {
    return null;
  }
}

function newRoom(roomId, roomName, adminClientId) {
  return {
    roomId,
    roomName,
    adminClientId,
    sharedControl: false, // true: everyone may play/pause/seek
    users: new Map(),
    adminGraceUntil: 0,
    reclaim: null, // { clientId, promotedId, until }: who may take admin back, see removeUser
    lastTouchAt: Date.now(),
    persistTimer: null,
  };
}

// Saves what a room needs to survive a server restart. Presence (who is
// connected) is deliberately not saved: people simply rejoin.
// The snapshot is built synchronously, so it is safe to delete the room from
// memory right after calling this.
async function persistRoom(roomId) {
  try {
    const room = rooms.get(roomId);
    if (!room) return;

    const pb = getPlaybackState(roomId);
    const data = {
      name: room.roomName,
      adminClientId: room.adminClientId,
      videoUrl: roomVideos.get(roomId) ?? null,
      isPlaying: pb.isPlaying,
      positionSec: pb.positionSec,
      sharedControl: Boolean(room.sharedControl),
      lastActiveAt: new Date(),
    };

    await prisma.roomState.upsert({
      where: { roomCode: roomId },
      create: { roomCode: roomId, ...data },
      update: data,
    });
  } catch (err) {
    console.error("[room] Failed to persist room:", err.message);
  }
}

function schedulePersist(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.persistTimer) return;
  room.persistTimer = setTimeout(() => {
    room.persistTimer = null;
    persistRoom(roomId);
  }, PERSIST_DEBOUNCE_MS);
}

// Rebuilds an in-memory room from the database (after a restart, or when
// everyone had left). Returns null when the room doesn't exist or has expired.
// Playback comes back paused at the last saved position.
async function restoreRoom(roomId) {
  try {
    const row = await prisma.roomState.findUnique({ where: { roomCode: roomId } });
    if (!row) return null;

    if (Date.now() - row.lastActiveAt.getTime() > ROOM_TTL_MS) {
      await prisma.roomState.delete({ where: { roomCode: roomId } }).catch(() => {});
      return null;
    }

    // two people can join at the same moment; whoever gets here second reuses the first one's room
    const existing = rooms.get(roomId);
    if (existing) return existing;

    const room = newRoom(roomId, row.name, row.adminClientId);
    room.sharedControl = row.sharedControl;
    room.adminGraceUntil = Date.now() + ADMIN_GRACE_MS;
    rooms.set(roomId, room);

    if (row.videoUrl) roomVideos.set(roomId, row.videoUrl);
    roomPlayback.set(roomId, {
      isPlaying: false,
      positionSec: row.positionSec,
      updatedAt: Date.now(),
    });

    return room;
  } catch (err) {
    console.error("[room] Failed to restore room:", err.message);
    return null;
  }
}

async function cleanupStaleRooms() {
  try {
    const cutoff = new Date(Date.now() - ROOM_TTL_MS);
    const res = await prisma.roomState.deleteMany({
      where: { lastActiveAt: { lt: cutoff } },
    });
    if (res.count) console.log(`[room] Removed ${res.count} unused room(s)`);
  } catch (err) {
    console.error("[room] Cleanup failed:", err.message);
  }
}

// Drops a room from memory once its last person is gone. The saved copy stays,
// so the same link works again later.
function closeRoom(roomId) {
  const room = rooms.get(roomId);
  if (room?.persistTimer) clearTimeout(room.persistTimer);
  persistRoom(roomId); // snapshot is built before the maps below are cleared
  rooms.delete(roomId);
  roomVideos.delete(roomId);
  roomPlayback.delete(roomId);
}

// ---- helpers ----------------------------------------------------------------
function emitUsers(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const users = Array.from(room.users.values()).map((u) => ({
    id: u.publicId,
    userName: u.userName,
    isAdmin: u.clientId === room.adminClientId,
  }));

  io.to(roomId).emit("presence:users", {
    roomId,
    users,
    count: users.length,
  });
}

// short system line shown in chat ("Asha joined"); `target` is io.to(room) or socket.to(room)
function emitNotice(target, text) {
  target.emit("room:notice", { message: text, time: Date.now() });
}

// removes a user and, if they were admin, hands admin to whoever is left.
// returns the new admin's name when admin changed, otherwise null.
//
// allowReclaim: true when the person dropped (disconnect) rather than chose to
// leave. They can then take admin back if they return soon and nobody has been
// made admin on purpose in the meantime.
function removeUser(room, clientId, allowReclaim = false) {
  const wasAdmin = room.adminClientId === clientId;
  room.users.delete(clientId);

  if (wasAdmin && room.users.size > 0) {
    const nextUser = Array.from(room.users.values())[0];
    room.adminClientId = nextUser.clientId;
    room.reclaim = allowReclaim
      ? {
          clientId,
          promotedId: nextUser.clientId,
          until: Date.now() + RECLAIM_WINDOW_MS,
        }
      : null;
    return nextUser.userName;
  }
  return null;
}

// A restored room can be left with its admin absent. Once the grace period is
// over, the first person present takes over. Returns the new admin's name or null.
function promoteIfAdminAbsent(room) {
  if (room.users.size === 0 || room.users.has(room.adminClientId)) return null;
  if (Date.now() < room.adminGraceUntil) return null;

  const next = Array.from(room.users.values())[0];
  room.adminClientId = next.clientId;
  room.reclaim = null;
  return next.userName;
}

function roomMeta(room) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    sharedControl: Boolean(room.sharedControl),
  };
}

function emitRoomMetaToRoom(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit("room:meta", roomMeta(room));
}

function emitRoomMetaToSocket(socket, room) {
  if (!room) return;
  socket.emit("room:meta", roomMeta(room));
}

function getPlaybackState(roomId) {
  const state = roomPlayback.get(roomId) || {
    isPlaying: false,
    positionSec: 0,
    updatedAt: Date.now(),
  };

  const now = Date.now();
  let effectivePosition = state.positionSec;

  if (state.isPlaying) {
    effectivePosition += (now - state.updatedAt) / 1000;
  }

  return {
    isPlaying: state.isPlaying,
    positionSec: Math.max(0, effectivePosition),
    updatedAt: now,
  };
}

function emitPlaybackStateToRoom(io, roomId) {
  io.to(roomId).emit("video:state", getPlaybackState(roomId));
}

function emitPlaybackStateToSocket(socket, roomId) {
  socket.emit("video:state", getPlaybackState(roomId));
}

function ensureResyncTimer(io) {
  if (resyncTimerStarted) return;
  resyncTimerStarted = true;

  setInterval(() => {
    const now = Date.now();
    const persistPlaying = now - lastPlayingPersistAt >= PERSIST_PLAYING_EVERY_MS;
    if (persistPlaying) lastPlayingPersistAt = now;

    for (const [roomId, room] of rooms.entries()) {
      if (!room || room.users.size === 0) continue;

      const promoted = promoteIfAdminAbsent(room);
      if (promoted) {
        emitUsers(io, roomId);
        emitNotice(io.to(roomId), `${promoted} is now the admin`);
        persistRoom(roomId);
      }

      if (!roomVideos.has(roomId)) continue;
      emitPlaybackStateToRoom(io, roomId);

      if (persistPlaying && roomPlayback.get(roomId)?.isPlaying) persistRoom(roomId);
    }
  }, RESYNC_INTERVAL_MS);

  cleanupStaleRooms();
  setInterval(cleanupStaleRooms, CLEANUP_INTERVAL_MS);
}

async function saveMessage(roomCode, userName, clientId, text) {
  try {
    await prisma.chatMessage.create({
      data: { roomCode, userName, clientId, text },
    });
  } catch (err) {
    console.error("[chat] Failed to persist message:", err.message);
  }
}

function mapRows(rows) {
  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    // public id of the sender; null for messages saved before clientId existed
    senderId: r.clientId ? publicIdOf(r.clientId) : null,
    message: r.text,
    time: r.createdAt.getTime(),
  }));
}

async function loadLatestHistory(roomCode, limit = HISTORY_PAGE_SIZE) {
  try {
    const rowsDesc = await prisma.chatMessage.findMany({
      where: { roomCode },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });

    const rowsAsc = [...rowsDesc].reverse();
    const hasMore = rowsDesc.length === limit;
    const nextCursor = hasMore ? rowsAsc[0]?.id ?? null : null;

    return { items: mapRows(rowsAsc), hasMore, nextCursor };
  } catch (err) {
    console.error("[chat] Failed to load latest history:", err.message);
    return { items: [], hasMore: false, nextCursor: null };
  }
}

async function loadOlderHistory(roomCode, beforeId, limit = HISTORY_PAGE_SIZE) {
  try {
    if (beforeId === null || beforeId === undefined) {
      return { items: [], hasMore: false, nextCursor: null };
    }

    const rowsDesc = await prisma.chatMessage.findMany({
      where: {
        roomCode,
        id: { lt: beforeId },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });

    const rowsAsc = [...rowsDesc].reverse();
    const hasMore = rowsDesc.length === limit;
    const nextCursor = hasMore ? rowsAsc[0]?.id ?? null : null;

    return { items: mapRows(rowsAsc), hasMore, nextCursor };
  } catch (err) {
    console.error("[chat] Failed to load older history:", err.message);
    return { items: [], hasMore: false, nextCursor: null };
  }
}

function upsertUser(room, { clientId, userName, socketId }) {
  room.users.set(clientId, {
    clientId,
    publicId: publicIdOf(clientId),
    userName,
    socketId,
  });
}

export function registerRoomSocket(io, socket) {
  ensureResyncTimer(io);

  socket.on("room:create", ({ roomId, roomName, userName, clientId }) => {
    userName = cleanText(userName, MAX_USER_NAME);
    if (!isValidId(roomId) || !userName || !isValidId(clientId)) return;

    let room = rooms.get(roomId);
    const isFresh = !room;
    if (!room) {
      room = newRoom(
        roomId,
        cleanText(roomName, MAX_ROOM_NAME) || `Room-${roomId.slice(0, 4)}`,
        clientId
      );
      rooms.set(roomId, room);
    }

    socket.join(roomId);
    upsertUser(room, { clientId, userName, socketId: socket.id });

    socket.data.roomId = roomId;
    socket.data.userName = userName;
    socket.data.clientId = clientId;

    socket.emit("room:you", { id: publicIdOf(clientId) });
    emitUsers(io, roomId);
    emitRoomMetaToRoom(io, roomId);

    if (!roomPlayback.has(roomId)) {
      roomPlayback.set(roomId, {
        isPlaying: false,
        positionSec: 0,
        updatedAt: Date.now(),
      });
    }

    if (isFresh) persistRoom(roomId);
  });

  socket.on("room:join", async ({ roomId, userName, clientId }) => {
    userName = cleanText(userName, MAX_USER_NAME);
    if (!isValidId(roomId) || !userName || !isValidId(clientId)) return;

    // joining never creates a room. A room that is not in memory may still be
    // saved (server restart, or everyone left earlier): bring it back. Only a
    // code that exists nowhere is "not found".
    let room = rooms.get(roomId);
    if (!room) room = await restoreRoom(roomId);
    if (!room) {
      socket.emit("room:error", {
        code: "ROOM_NOT_FOUND",
        roomId,
        message: "That room doesn't exist or has ended.",
      });
      return;
    }

    // reconnects re-send room:join with the same clientId; only announce first arrivals
    const isNewMember = !room.users.has(clientId);

    socket.join(roomId);
    upsertUser(room, { clientId, userName, socketId: socket.id });

    socket.data.roomId = roomId;
    socket.data.userName = userName;
    socket.data.clientId = clientId;

    // an admin who dropped a moment ago gets the role back, unless someone was
    // made admin on purpose since (then adminClientId no longer matches promotedId)
    const rc = room.reclaim;
    const reclaimed =
      rc &&
      rc.clientId === clientId &&
      Date.now() < rc.until &&
      room.adminClientId === rc.promotedId;
    if (reclaimed) {
      room.adminClientId = clientId;
      room.reclaim = null;
    }

    const promoted = reclaimed ? null : promoteIfAdminAbsent(room);

    socket.emit("room:you", { id: publicIdOf(clientId) });
    emitUsers(io, roomId);
    emitRoomMetaToSocket(socket, room);

    if (isNewMember) emitNotice(socket.to(roomId), `${userName} joined`);
    if (reclaimed) {
      emitNotice(io.to(roomId), `${userName} is back as admin`);
      persistRoom(roomId);
    } else if (promoted) {
      emitNotice(io.to(roomId), `${promoted} is now the admin`);
      persistRoom(roomId);
    } else if (Date.now() - room.lastTouchAt > TOUCH_THROTTLE_MS) {
      room.lastTouchAt = Date.now();
      persistRoom(roomId); // keeps the room from being cleaned up while it is in use
    }

    if (roomVideos.has(roomId)) {
      socket.emit("video:update", { videoUrl: roomVideos.get(roomId) });
    }

    if (!roomPlayback.has(roomId)) {
      roomPlayback.set(roomId, {
        isPlaying: false,
        positionSec: 0,
        updatedAt: Date.now(),
      });
    }

    emitPlaybackStateToSocket(socket, roomId);

    const page = await loadLatestHistory(roomId);
    socket.emit("chat:history", page);
  });

  socket.on("chat:history:more", async ({ roomId, beforeId }) => {
    if (!roomId) return;
    // only members of the room can read its history
    if (socket.data.roomId !== roomId) return;
    const page = await loadOlderHistory(roomId, beforeId);
    socket.emit("chat:history:more", page);
  });

  socket.on("video:set", ({ roomId, videoUrl }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentClientId = socket.data.clientId;
    if (room.adminClientId !== currentClientId) return;

    const cleanUrl = cleanVideoUrl(videoUrl);
    if (!cleanUrl) {
      socket.emit("room:notice", {
        message: "That doesn't look like a valid video link (it must start with http:// or https://).",
        time: Date.now(),
      });
      return;
    }
    videoUrl = cleanUrl;

    roomVideos.set(roomId, videoUrl);
    roomPlayback.set(roomId, {
      isPlaying: false,
      positionSec: 0,
      updatedAt: Date.now(),
    });

    io.to(roomId).emit("video:update", { videoUrl });
    emitPlaybackStateToRoom(io, roomId);
    persistRoom(roomId);
  });

  socket.on("video:state:update", ({ roomId, isPlaying, positionSec }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // the admin always controls playback; everyone else only when the admin allows it
    const currentClientId = socket.data.clientId;
    const canControl = room.adminClientId === currentClientId || room.sharedControl;
    if (!canControl) return;
    if (socket.data.roomId !== roomId || !room.users.has(currentClientId)) return;

    const safePos = Number(positionSec);
    const next = {
      isPlaying: Boolean(isPlaying),
      positionSec: Number.isFinite(safePos) && safePos >= 0 ? safePos : 0,
      updatedAt: Date.now(),
    };

    roomPlayback.set(roomId, next);
    io.to(roomId).emit("video:state", next);
    schedulePersist(roomId);
  });

  socket.on("video:state:request", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit("video:state", getPlaybackState(roomId));
  });

  // Admin hands control to another user. Targets are identified by clientId,
  // not by display name, so two users with the same name can't be confused.
  socket.on("admin:transfer", ({ roomId, targetId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.adminClientId !== socket.data.clientId) return;

    const target = Array.from(room.users.values()).find((u) => u.publicId === targetId);
    if (!target) return;

    room.adminClientId = target.clientId;
    room.reclaim = null; // a deliberate hand-over can't be undone by reclaiming
    emitUsers(io, roomId);
    emitNotice(io.to(roomId), `${target.userName} is now the admin`);
    persistRoom(roomId);
  });

  // Admin switches between "only I control playback" and "everyone does".
  socket.on("room:control", ({ roomId, shared }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.adminClientId !== socket.data.clientId) return;

    const next = Boolean(shared);
    if (next === Boolean(room.sharedControl)) return;

    room.sharedControl = next;
    emitRoomMetaToRoom(io, roomId);
    emitNotice(
      io.to(roomId),
      next ? "Everyone can now control playback" : "Only the admin controls playback now"
    );
    persistRoom(roomId);
  });

  // Floating emoji reactions. Only a fixed set is accepted, and the sender is
  // taken from the server-side session, like chat.
  socket.on("reaction:send", ({ roomId, emoji }) => {
    const { roomId: joinedRoomId, userName, clientId } = socket.data;
    if (!roomId || roomId !== joinedRoomId || !clientId) return;

    const room = rooms.get(roomId);
    if (!room || !room.users.has(clientId)) return;

    if (typeof emoji !== "string") return;
    const canonical = REACTION_LOOKUP.get(stripVS(emoji));
    if (!canonical) return;

    // reactions are cheap to spam, so over the limit they are just dropped
    const nowMs = Date.now();
    const recent = (socket.data.reactionTimes || []).filter(
      (t) => nowMs - t < REACTION_RATE_WINDOW_MS
    );
    if (recent.length >= REACTION_RATE_LIMIT) {
      socket.data.reactionTimes = recent;
      return;
    }
    recent.push(nowMs);
    socket.data.reactionTimes = recent;

    io.to(roomId).emit("reaction", {
      id: `${nowMs}-${Math.random().toString(36).slice(2, 8)}`,
      emoji: canonical,
      userName,
      senderId: publicIdOf(clientId),
    });
  });

  // Identity comes from the server-side socket session, never from the payload,
  // so a client can't post as someone else or into a room it hasn't joined.
  socket.on("chat:message", async ({ roomId, message }) => {
    const { roomId: joinedRoomId, userName, clientId } = socket.data;

    if (!roomId || roomId !== joinedRoomId || !userName || !clientId) return;

    const room = rooms.get(roomId);
    if (!room || !room.users.has(clientId)) return;

    if (typeof message !== "string") return;
    const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed) return;

    // simple sliding-window limit so one client can't flood the room
    const nowMs = Date.now();
    const recent = (socket.data.chatTimes || []).filter(
      (t) => nowMs - t < CHAT_RATE_WINDOW_MS
    );
    if (recent.length >= CHAT_RATE_LIMIT) {
      socket.data.chatTimes = recent;
      socket.emit("room:notice", {
        message: "You're sending messages too fast. Slow down a little.",
        time: nowMs,
      });
      return;
    }
    recent.push(nowMs);
    socket.data.chatTimes = recent;

    await saveMessage(roomId, userName, clientId, trimmed);

    io.to(roomId).emit("chat:message", {
      userName,
      senderId: publicIdOf(clientId),
      message: trimmed,
      time: Date.now(),
    });
  });

  socket.on("room:leave", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // only ever remove the person this connection belongs to
    const id = socket.data.clientId;
    if (!id || socket.data.roomId !== roomId) return;

    const leaving = room.users.get(id);
    const newAdminName = removeUser(room, id);
    socket.leave(roomId);

    if (room.users.size === 0) {
      closeRoom(roomId);
    } else {
      emitUsers(io, roomId);
      if (leaving) emitNotice(io.to(roomId), `${leaving.userName} left`);
      if (newAdminName) {
        emitNotice(io.to(roomId), `${newAdminName} is now the admin`);
        persistRoom(roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const clientId = socket.data.clientId;
    if (!roomId || !clientId) return;

    setTimeout(() => {
      const r = rooms.get(roomId);
      if (!r) return;

      const user = r.users.get(clientId);
      if (!user || user.socketId !== socket.id) return;

      const newAdminName = removeUser(r, clientId, true);

      if (r.users.size === 0) {
        closeRoom(roomId);
      } else {
        emitUsers(io, roomId);
        emitNotice(io.to(roomId), `${user.userName} left`);
        if (newAdminName) {
          emitNotice(io.to(roomId), `${newAdminName} is now the admin`);
          persistRoom(roomId);
        }
      }
    }, 4000);
  });
}
