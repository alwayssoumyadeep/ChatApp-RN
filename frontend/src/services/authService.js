import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import socket from "./socket";
import { generateKeyPair } from "../utils/crypto";

async function ensureKeysExist(user) {
  const userId = user.id || user._id;
  const existingPrivateKey = await AsyncStorage.getItem(`privateKey_${userId}`);
  if (!existingPrivateKey) {
    const { privateKey, publicKey } = generateKeyPair();
    await AsyncStorage.setItem(`privateKey_${userId}`, privateKey);
    try {
      await api.patch("/users/me", { publicKey });
    } catch (err) {
      console.warn("[Auth] Failed to upload public key:", err.response?.data || err.message);
    }
  }
}

let _appStateSubscription = null;
let _currentUserId = null;

export function teardownAppStateHandler() {
  if (_appStateSubscription) {
    _appStateSubscription.remove();
    _appStateSubscription = null;
  }
  _currentUserId = null;
}

function setupAppStateHandler(userId) {
  _currentUserId = userId;

  if (_appStateSubscription) {
    _appStateSubscription.remove();
    _appStateSubscription = null;
  }

  _appStateSubscription = AppState.addEventListener("change", (nextState) => {
    if (nextState === "active" && _currentUserId) {
      console.log("[AppState] App active — checking socket connection");
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("register", _currentUserId);
    }
  });
}

/**
 * Initializes socket connection and registers global listeners (e.g. presence ping auto-responder).
 * Safe to call multiple times.
 */
export async function initSocket(userId) {
  let uid = userId;
  if (!uid) {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const me = JSON.parse(stored);
        uid = (me?.id || me?._id)?.toString();
      }
    } catch {}
  }

  if (!uid) return;

  const handleReconnect = () => {
    console.log("[Socket] Connected / Reconnected — registering userId:", uid);
    socket.emit("register", uid);
  };

  // Global auto-responder for presence pings:
  // When another user sends a _presencePing, reply immediately with _presencePong
  const handlePingResponse = (data) => {
    if (data && data._presencePing && data.senderId) {
      socket.emit("sendMessage", {
        senderId: uid,
        receiverId: data.senderId.toString(),
        _presencePong: true,
      });
    }
  };

  socket.off("connect", handleReconnect);
  socket.on("connect", handleReconnect);

  socket.off("receiveMessage", handlePingResponse);
  socket.on("receiveMessage", handlePingResponse);

  if (!socket.connected) {
    socket.connect();
  } else {
    socket.emit("register", uid);
  }

  setupAppStateHandler(uid);
}

export async function loginUser(email, password) {
  const res = await api.post("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });

  const { token, user } = res.data;

  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user", JSON.stringify(user));

  await ensureKeysExist(user);

  const userId = (user.id || user._id).toString();
  await initSocket(userId);

  return { token, user };
}

export async function registerUser(username, email, password) {
  const res = await api.post("/auth/register", {
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  const { token, user } = res.data;

  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user", JSON.stringify(user));

  await ensureKeysExist(user);

  const userId = (user.id || user._id).toString();
  await initSocket(userId);

  return { token, user };
}
