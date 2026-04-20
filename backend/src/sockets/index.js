import { Server } from "socket.io";
import { registerRoomSocket } from "./room.socket.js";

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("[socket] connected:", socket.id);
    registerRoomSocket(io, socket); // ✅ critical
  });

  return io;
}