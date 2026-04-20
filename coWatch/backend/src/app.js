import express from "express";
import cors from "cors";

const app = express();

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

export default app;