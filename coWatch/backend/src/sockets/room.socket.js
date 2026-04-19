import { rooms } from "../data/inMemoryStore.js";
import prisma from "../config/prisma.js";

const roomVideos = new Map();
const HISTORY_LIMIT = 50;

function emitUsers(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const users = Array.from(room.users.values()).map((u) => ({
    socketId: u.socketId,
    userName: u.userName,
    isAdmin: u.userName === room.adminUserName,
  }));

  io.to(roomId).emit("presence:users", {
    roomId,
    users,
    count: users.length,
  });
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

async function loadHistory(roomCode) {
  try {
    const rows = await prisma.chatMessage.findMany({
      where: { roomCode },
      orderBy: { createdAt: "asc" },
      take: HISTORY_LIMIT,
    });

    return rows.map((r) => ({
      userName: r.userName,
      message: r.text,
      time: r.createdAt.getTime(),
    }));
  } catch (err) {
    console.error("[chat] Failed to load history:", err.message);
    return [];
  }
}

export function registerRoomSocket(io, socket) {
  socket.on("room:create", ({ roomId, roomName, userName }) => {
    let room = rooms.get(roomId);

    if (!room) {
      room = {
        roomId,
        roomName,
        adminUserName: userName,
        users: new Map(),
      };
      rooms.set(roomId, room);
    }

    socket.join(roomId);

    room.users.set(userName, {
      userName,
      socketId: socket.id,
    });

    socket.data.roomId = roomId;
    socket.data.userName = userName;

    emitUsers(io, roomId);
  });

  socket.on("room:join", async ({ roomId, userName }) => {
    let room = rooms.get(roomId);

    if (!room) {
      room = {
        roomId,
        roomName: `Room-${roomId.slice(0, 4)}`,
        adminUserName: userName,
        users: new Map(),
      };
      rooms.set(roomId, room);
    }

    socket.join(roomId);

    room.users.set(userName, {
      userName,
      socketId: socket.id,
    });

    socket.data.roomId = roomId;
    socket.data.userName = userName;

    emitUsers(io, roomId);

    if (roomVideos.has(roomId)) {
      socket.emit("video:update", { videoUrl: roomVideos.get(roomId) });
    }

    // ✅ send all history in one event (prevents duplicate append behavior)
    const history = await loadHistory(roomId);
    socket.emit("chat:history", history);
  });

  socket.on("video:set", ({ roomId, videoUrl }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentUser = socket.data.userName;
    if (room.adminUserName !== currentUser) return;

    roomVideos.set(roomId, videoUrl);
    io.to(roomId).emit("video:update", { videoUrl });
  });

  socket.on("admin:transfer", ({ roomId, targetUserName }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentUser = socket.data.userName;
    if (!room.users.has(currentUser)) return;
    if (room.adminUserName !== currentUser) return;
    if (!room.users.has(targetUserName)) return;

    room.adminUserName = targetUserName;
    emitUsers(io, roomId);
  });

  socket.on("chat:message", async ({ roomId, message, userName }) => {
    if (!message?.trim() || !userName) return;

    const msg = {
      userName,
      message: message.trim(),
      time: Date.now(),
    };

    io.to(roomId).emit("chat:message", msg);
    await saveMessage(roomId, userName, message.trim());
  });

  socket.on("room:leave", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const userName = socket.data.userName;
    const wasAdmin = room.adminUserName === userName;

    room.users.delete(userName);
    socket.leave(roomId);

    if (wasAdmin && room.users.size > 0) {
      const nextUser = Array.from(room.users.values())[0];
      room.adminUserName = nextUser.userName;
    }

    if (room.users.size === 0) {
      rooms.delete(roomId);
      roomVideos.delete(roomId);
    } else {
      emitUsers(io, roomId);
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const userName = socket.data.userName;
    if (!roomId || !userName) return;

    setTimeout(() => {
      const r = rooms.get(roomId);
      if (!r) return;

      const user = r.users.get(userName);
      if (!user || user.socketId !== socket.id) return;

      const wasAdmin = r.adminUserName === userName;
      r.users.delete(userName);

      if (wasAdmin && r.users.size > 0) {
        const nextUser = Array.from(r.users.values())[0];
        r.adminUserName = nextUser.userName;
      }

      if (r.users.size === 0) {
        rooms.delete(roomId);
        roomVideos.delete(roomId);
      } else {
        emitUsers(io, roomId);
      }
    }, 4000);
  });
}