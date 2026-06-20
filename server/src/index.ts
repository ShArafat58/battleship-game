import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { registerSocketHandlers } from "./socketHandlers";
import { initDb } from "./db";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));
app.get("*path", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;

initDb();

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
