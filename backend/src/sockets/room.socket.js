import { rooms } from "../data/inMemoryStore.js";
import prisma from "../config/prisma.js";

const roomVideos = new Map();
const roomPlayback = new Map(); // roomId -> { isPlaying, positionSec, updatedAt }

// periodic room sync every 3s
const RESYNC_INTERVAL_MS = 3000;
const HISTORY_PAGE_SIZE = 30;
const MAX_MESSAGE_LENGTH = 2000;
let resyncTimerStarted = false;

function emitUsers(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const users = Array.from(room.users.values()).map((u) => ({
    clientId: u.clientId,
    socketId: u.socketId,
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
function removeUser(room, clientId) {
  const wasAdmin = room.adminClientId === clientId;
  room.users.delete(clientId);

  if (wasAdmin && room.users.size > 0) {
    const nextUser = Array.from(room.users.values())[0];
    room.adminClientId = nextUser.clientId;
    return nextUser.userName;
  }
  return null;
}

function emitRoomMetaToRoom(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit("room:meta", {
    roomId: room.roomId,
    roomName: room.roomName,
  });
}

function emitRoomMetaToSocket(socket, room) {
  if (!room) return;
  socket.emit("room:meta", {
    roomId: room.roomId,
    roomName: room.roomName,
  });
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
    for (const [roomId, room] of rooms.entries()) {
      if (!room || room.users.size === 0) continue;
      if (!roomVideos.has(roomId)) continue;
      emitPlaybackStateToRoom(io, roomId);
    }
  }, RESYNC_INTERVAL_MS);
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
    clientId: r.clientId ?? null, // null for messages saved before clientId existed
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
  room.users.set(clientId, { clientId, userName, socketId });
}

export function registerRoomSocket(io, socket) {
  ensureResyncTimer(io);

  socket.on("room:create", ({ roomId, roomName, userName, clientId }) => {
    if (!roomId || !userName || !clientId) return;

    let room = rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        roomName: roomName?.trim() || `Room-${roomId.slice(0, 4)}`,
        adminClientId: clientId,
        users: new Map(),
      };
      rooms.set(roomId, room);
    }

    socket.join(roomId);
    upsertUser(room, { clientId, userName, socketId: socket.id });

    socket.data.roomId = roomId;
    socket.data.userName = userName;
    socket.data.clientId = clientId;

    emitUsers(io, roomId);
    emitRoomMetaToRoom(io, roomId);

    if (!roomPlayback.has(roomId)) {
      roomPlayback.set(roomId, {
        isPlaying: false,
        positionSec: 0,
        updatedAt: Date.now(),
      });
    }
  });

  socket.on("room:join", async ({ roomId, userName, clientId }) => {
    if (!roomId || !userName || !clientId) return;

    // joining never creates a room: a mistyped code (or a room that ended when
    // the server restarted) gets a clear error instead of an empty room
    const room = rooms.get(roomId);
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

    emitUsers(io, roomId);
    emitRoomMetaToSocket(socket, room);

    if (isNewMember) emitNotice(socket.to(roomId), `${userName} joined`);

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

    roomVideos.set(roomId, videoUrl);
    roomPlayback.set(roomId, {
      isPlaying: false,
      positionSec: 0,
      updatedAt: Date.now(),
    });

    io.to(roomId).emit("video:update", { videoUrl });
    emitPlaybackStateToRoom(io, roomId);
  });

  socket.on("video:state:update", ({ roomId, isPlaying, positionSec }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentClientId = socket.data.clientId;
    if (room.adminClientId !== currentClientId) return;

    const safePos = Number(positionSec);
    const next = {
      isPlaying: Boolean(isPlaying),
      positionSec: Number.isFinite(safePos) && safePos >= 0 ? safePos : 0,
      updatedAt: Date.now(),
    };

    roomPlayback.set(roomId, next);
    io.to(roomId).emit("video:state", next);
  });

  socket.on("video:state:request", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit("video:state", getPlaybackState(roomId));
  });

  // Admin hands control to another user. Targets are identified by clientId,
  // not by display name, so two users with the same name can't be confused.
  socket.on("admin:transfer", ({ roomId, targetClientId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.adminClientId !== socket.data.clientId) return;

    const target = room.users.get(targetClientId);
    if (!target) return;

    room.adminClientId = target.clientId;
    emitUsers(io, roomId);
    emitNotice(io.to(roomId), `${target.userName} is now the admin`);
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

    await saveMessage(roomId, userName, clientId, trimmed);

    io.to(roomId).emit("chat:message", {
      userName,
      clientId,
      message: trimmed,
      time: Date.now(),
    });
  });

  socket.on("room:leave", ({ roomId, clientId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const id = clientId || socket.data.clientId;
    if (!id) return;

    const leaving = room.users.get(id);
    const newAdminName = removeUser(room, id);
    socket.leave(roomId);

    if (room.users.size === 0) {
      rooms.delete(roomId);
      roomVideos.delete(roomId);
      roomPlayback.delete(roomId);
    } else {
      emitUsers(io, roomId);
      if (leaving) emitNotice(io.to(roomId), `${leaving.userName} left`);
      if (newAdminName) emitNotice(io.to(roomId), `${newAdminName} is now the admin`);
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

      const newAdminName = removeUser(r, clientId);

      if (r.users.size === 0) {
        rooms.delete(roomId);
        roomVideos.delete(roomId);
        roomPlayback.delete(roomId);
      } else {
        emitUsers(io, roomId);
        emitNotice(io.to(roomId), `${user.userName} left`);
        if (newAdminName) emitNotice(io.to(roomId), `${newAdminName} is now the admin`);
      }
    }, 4000);
  });
}
