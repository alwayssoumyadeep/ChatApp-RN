import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.29.4:3000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;