import "./global.css";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppNavigator from "./src/navigation/AppNavigator";
import socket from "./src/services/socket";

export default function App() {
  useEffect(() => {
    const connectSocket = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        const userId = user.id || user._id;
        socket.connect();
        socket.emit("register", userId);
      }
    };
    connectSocket();

    return () => {
      socket.disconnect();
    };
  }, []);

  return <AppNavigator />;
}