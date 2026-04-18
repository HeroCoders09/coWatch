import { rooms } from "../data/inMemoryStore.js";

const roomVideos = new Map();

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

export function registerRoomSocket(io, socket) {

  // 🔹 CREATE ROOM
  socket.on("room:create", ({ roomId, roomName, userName }) => {
    let room = rooms.get(roomId);

    if (!room) {
      room = {
        roomId,
        roomName,
        adminUserName: userName,
        users: new Map(),
        messages: [],
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

  // 🔹 JOIN ROOM
  socket.on("room:join", ({ roomId, userName }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    socket.join(roomId);

    // overwrite (no duplicates)
    room.users.set(userName, {
      userName,
      socketId: socket.id,
    });

    socket.data.roomId = roomId;
    socket.data.userName = userName;

    emitUsers(io, roomId);

    // send current video
    if (roomVideos.has(roomId)) {
      socket.emit("video:update", {
        videoUrl: roomVideos.get(roomId),
      });
    }

    // send old messages (optional)
    if (room.messages?.length) {
      room.messages.forEach((msg) => {
        socket.emit("chat:message", msg);
      });
    }
  });

  // 🔹 VIDEO SET (ADMIN ONLY)
  socket.on("video:set", ({ roomId, videoUrl }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const currentUser = socket.data.userName;

    if (room.adminUserName !== currentUser) return;

    roomVideos.set(roomId, videoUrl);

    io.to(roomId).emit("video:update", { videoUrl });
  });

  // 🔥 🔹 ADMIN TRANSFER
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

  // 🔥 🔹 CHAT MESSAGE (FIXED)
  socket.on("chat:message", ({ roomId, message, userName }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (!message || !userName) return;

    const msg = {
      userName,
      message,
      time: Date.now(),
    };

    // store messages
    room.messages.push(msg);

    // broadcast
    io.to(roomId).emit("chat:message", msg);
  });

  // 🔹 LEAVE ROOM
  socket.on("room:leave", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const userName = socket.data.userName;
    const wasAdmin = room.adminUserName === userName;

    room.users.delete(userName);
    socket.leave(roomId);

    // admin transfer
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

  // 🔹 DISCONNECT (REFRESH SAFE)
  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const userName = socket.data.userName;

    if (!roomId || !userName) return;

    const room = rooms.get(roomId);
    if (!room) return;

    setTimeout(() => {
      const r = rooms.get(roomId);
      if (!r) return;

      const user = r.users.get(userName);

      // if reconnected → skip removal
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