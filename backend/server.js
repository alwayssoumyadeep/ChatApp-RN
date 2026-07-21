require('dotenv').config()
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app")
const connectDB = require("./src/db/db")

connectDB()

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// Track which userId is connected to which socket
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("sendMessage", (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", data);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

server.listen(3000, ()=> {
    console.log("Server is running on port 3000");
})