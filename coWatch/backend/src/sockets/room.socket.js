import { rooms } from "../data/inMemoryStore.js";

function emitUsers(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const users = Array.from(room.users.values()).map((u) => ({
    socketId: u.socketId,
    userName: u.userName,
    isAdmin: u.isAdmin,
  }));

  io.to(roomId).emit("presence:users", {
    roomId,
    users,
    count: users.length,
  });
}

function emitChatHistory(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  socket.emit("chat:history", { roomId, messages: room.messages || [] });
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
        messages: [], // chat history in memory
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
    socket.data.userName = String(userName).trim();

    emitUsers(io, roomId);
    emitChatHistory(socket, roomId);
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
    socket.data.userName = String(userName).trim();

    io.to(roomId).emit("presence:user-joined", { userName: String(userName).trim() });
    emitUsers(io, roomId);
    emitChatHistory(socket, roomId);
  });

  socket.on("chat:send", ({ roomId, text }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("room:error", { message: "Room not found" });
      return;
    }

    const cleanText = String(text || "").trim();
    if (!cleanText) return;

    const sender = room.users.get(socket.id);
    if (!sender) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId,
      text: cleanText,
      userName: sender.userName,
      socketId: socket.id,
      createdAt: new Date().toISOString(),
    };

    room.messages.push(message);

    // optional cap (last 200)
    if (room.messages.length > 200) {
      room.messages = room.messages.slice(-200);
    }

    io.to(roomId).emit("chat:new", message);
  });

  socket.on("chat:typing", ({ roomId, isTyping }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.users.get(socket.id);
    if (!sender) return;

    // Send to everyone except sender
    socket.to(roomId).emit("chat:typing", {
      roomId,
      userName: sender.userName,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("room:get-users", ({ roomId }) => {
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