import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerRoomSocket } from "./room.socket.js";

export function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.on("connection", (socket) => {
    registerRoomSocket(io, socket);
  });

  return io;
}