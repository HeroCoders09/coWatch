import { rooms } from "../data/inMemoryStore.js";
import prisma from "../config/prisma.js";

const roomVideos = new Map();
const roomPlayback = new Map(); // roomId -> { isPlaying, positionSec, updatedAt }

// ✅ periodic room sync every 5s
const RESYNC_INTERVAL_MS = 5000;
const HISTORY_PAGE_SIZE = 30;
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

async function saveMessage(roomCode, userName, text) {
  try {
    await prisma.chatMessage.create({
      data: { roomCode, userName, text },
    });
  } catch (err) {
    console.error("[chat] Failed to persist message:", err.message);
  }
}

function mapRows(rows) {
  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
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

    let room = rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        roomName: `Room-${roomId.slice(0, 4)}`,
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
    emitRoomMetaToSocket(socket, room);

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

  socket.on("admin:transfer", ({ roomId, targetUserName }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentClientId = socket.data.clientId;
    if (room.adminClientId !== currentClientId) return;

    const target = Array.from(room.users.values()).find(
      (u) => u.userName === targetUserName
    );
    if (!target) return;

    room.adminClientId = target.clientId;
    emitUsers(io, roomId);
  });

  socket.on("chat:message", async ({ roomId, message, userName }) => {
    if (!message?.trim() || !userName) return;

    const trimmed = message.trim();
    await saveMessage(roomId, userName, trimmed);

    io.to(roomId).emit("chat:message", {
      userName,
      message: trimmed,
      time: Date.now(),
    });
  });

  socket.on("room:leave", ({ roomId, clientId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const id = clientId || socket.data.clientId;
    if (!id) return;

    const wasAdmin = room.adminClientId === id;
    room.users.delete(id);
    socket.leave(roomId);

    if (wasAdmin && room.users.size > 0) {
      const nextUser = Array.from(room.users.values())[0];
      room.adminClientId = nextUser.clientId;
    }

    if (room.users.size === 0) {
      rooms.delete(roomId);
      roomVideos.delete(roomId);
      roomPlayback.delete(roomId);
    } else {
      emitUsers(io, roomId);
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

      const wasAdmin = r.adminClientId === clientId;
      r.users.delete(clientId);

      if (wasAdmin && r.users.size > 0) {
        const nextUser = Array.from(r.users.values())[0];
        r.adminClientId = nextUser.clientId;
      }

      if (r.users.size === 0) {
        rooms.delete(roomId);
        roomVideos.delete(roomId);
        roomPlayback.delete(roomId);
      } else {
        emitUsers(io, roomId);
      }
    }, 4000);
  });
}