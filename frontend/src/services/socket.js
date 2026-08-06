import { io } from "socket.io-client";

// src/services/socket.js
const SOCKET_URL = "http://192.168.31.247:3000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;