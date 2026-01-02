import express from "express";
import http from "http";
import { Server } from "socket.io";
import setupSockets from "./socket.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

setupSockets(io);

// Health check
app.get("/", (req, res) => {
  res.send("Word Battle server is running");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Word Battle server running on port ${PORT}`);
});
