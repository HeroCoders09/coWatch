import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { initSocket } from "./sockets/index.js";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});