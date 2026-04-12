import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { initSocket } from "./sockets/index.js";

const server = http.createServer(app);
initSocket(server);

server.listen(env.PORT, () => {
  console.log(`Backend running on http://localhost:${env.PORT}`);
});