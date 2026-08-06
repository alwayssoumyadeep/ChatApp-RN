import { io } from "socket.io-client";

// src/services/socket.js
const SOCKET_URL = "https://mechat-backend.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;