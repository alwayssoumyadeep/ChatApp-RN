import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = "https://mechat-backend-pb8y.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  auth: async (cb) => {
    try {
      const token = await AsyncStorage.getItem("token");
      cb({ token: token || "" });
    } catch {
      cb({ token: "" });
    }
  },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socket;