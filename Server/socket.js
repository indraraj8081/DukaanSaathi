import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : true },
  });

  // Only logged-in shop owners can connect
  io.use((socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  // Each shop has its own room, so alerts never reach another shop
  io.on("connection", (socket) => {
    socket.join(`shop:${socket.userId}`);
  });

  return io;
};

export const emitToShop = (userId, event, payload) => {
  io?.to(`shop:${userId}`).emit(event, payload);
};