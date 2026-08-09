require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./src/app");
const connectDB = require("./src/db/db");
const userModel = require("./src/models/user.model");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const userSockets = new Map();

function addSocket(userId, socketId) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socketId);
}

function removeSocket(userId, socketId) {
  const sockets = userSockets.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSockets.delete(userId);
    return true;
  }
  return false;
}

function isUserOnline(userId) {
  const sockets = userSockets.get(userId);
  return !!(sockets && sockets.size > 0);
}

function getSocketIds(userId) {
  return userSockets.get(userId) || new Set();
}

function emitToUser(userId, event, data) {
  for (const socketId of getSocketIds(userId)) {
    io.to(socketId).emit(event, data);
  }
}

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next();
  }
});

io.on("connection", (socket) => {
  if (socket.userId) {
    handleUserOnline(socket.userId, socket.id);
  }

  socket.on("register", (userId) => {
    if (!userId) return;
    const uid = userId.toString();

    if (socket.userId && socket.userId !== uid) {
      return;
    }

    socket.userId = uid;
    handleUserOnline(uid, socket.id);
  });

  socket.on("get_presence", ({ userId }) => {
    if (!userId) return;
    socket.emit("presence_update", {
      userId,
      isOnline: isUserOnline(userId.toString()),
    });
  });

  socket.on("sendMessage", (data) => {
    const { receiverId } = data;
    if (!receiverId) return;

    const safeSenderId = socket.userId || data.senderId;
    const safeData = { ...data, senderId: safeSenderId };

    emitToUser(receiverId, "receiveMessage", safeData);
  });

  socket.on("typing:start", (data) => {
    const { receiverId } = data || {};
    if (!receiverId || !socket.userId) return;

    emitToUser(receiverId, "typing:start", {
      senderId: socket.userId,
      receiverId,
    });
  });

  socket.on("typing:stop", (data) => {
    const { receiverId } = data || {};
    if (!receiverId || !socket.userId) return;

    emitToUser(receiverId, "typing:stop", {
      senderId: socket.userId,
      receiverId,
    });
  });

  socket.on("disconnect", (reason) => {
    const userId = socket.userId;

    if (!userId) return;

    const wasLastSocket = removeSocket(userId, socket.id);
    if (wasLastSocket) {
      handleUserOffline(userId);
    }
  });
});

function handleUserOnline(userId, socketId) {
  const wasOffline = !isUserOnline(userId);
  addSocket(userId, socketId);

  if (wasOffline) {
    io.emit("user:online", { userId });
    userModel.findByIdAndUpdate(userId, { isOnline: true }).catch(() => {});
  }
}

function handleUserOffline(userId) {
  const lastSeen = new Date();

  io.emit("user:offline", { userId, lastSeen });

  userModel
    .findByIdAndUpdate(userId, { isOnline: false, lastSeen })
    .catch(() => {});
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});