import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {};

// create room
app.post("/create-room", (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 8);

  rooms[roomId] = { users: [] };

  res.json({ roomId });
});

// socket
io.on("connection", (socket) => {
  socket.on("join_room", (roomId) => {
    if (!rooms[roomId]) return;

    socket.join(roomId);
  });

  socket.on("send_message", (data) => {
    io.to(data.roomId).emit("receive_message", data);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});