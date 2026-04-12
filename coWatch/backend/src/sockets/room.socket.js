import { rooms } from "../data/inMemoryStore.js";

function emitUsers(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const users = Array.from(room.users.values()).map((u) => ({
    socketId: u.socketId,
    userName: u.userName,   // keep this key consistent
    isAdmin: u.isAdmin,
  }));

  io.to(roomId).emit("presence:users", {
    roomId,
    users,
    count: users.length,
  });
}

export function registerRoomSocket(io, socket) {
  socket.on("room:create", ({ roomId, roomName, userName }) => {
    if (!roomId || !userName) return;

    let room = rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        roomName: roomName || `Room-${roomId.slice(0, 4)}`,
        adminSocketId: socket.id,
        users: new Map(),
      };
      rooms.set(roomId, room);
    }

    socket.join(roomId);

    room.users.set(socket.id, {
      socketId: socket.id,
      userName: String(userName).trim(),
      isAdmin: room.adminSocketId === socket.id,
    });

    socket.data.roomId = roomId;
    emitUsers(io, roomId);
  });

  socket.on("room:join", ({ roomId, userName }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("room:error", { message: "Room not found" });
      return;
    }

    socket.join(roomId);

    room.users.set(socket.id, {
      socketId: socket.id,
      userName: String(userName).trim(),
      isAdmin: room.adminSocketId === socket.id,
    });

    socket.data.roomId = roomId;
    io.to(roomId).emit("presence:user-joined", { userName: String(userName).trim() });
    emitUsers(io, roomId);
  });

  socket.on("room:leave", ({ roomId, userName }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    socket.leave(roomId);
    room.users.delete(socket.id);

    if (room.adminSocketId === socket.id) {
      const next = Array.from(room.users.values())[0];
      room.adminSocketId = next?.socketId || null;
      if (next) next.isAdmin = true;
    }

    io.to(roomId).emit("presence:user-left", { userName: userName || "A user" });

    if (room.users.size === 0) {
      rooms.delete(roomId);
    } else {
      emitUsers(io, roomId);
    }
  });

  socket.on("room:get-users", ({ roomId }) => {
    emitUsers(io, roomId);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const leftUser = room.users.get(socket.id);
    room.users.delete(socket.id);

    if (room.adminSocketId === socket.id) {
      const next = Array.from(room.users.values())[0];
      room.adminSocketId = next?.socketId || null;
      if (next) next.isAdmin = true;
    }

    if (leftUser) {
      io.to(roomId).emit("presence:user-left", { userName: leftUser.userName });
    }

    if (room.users.size === 0) {
      rooms.delete(roomId);
    } else {
      emitUsers(io, roomId);
    }
  });
}