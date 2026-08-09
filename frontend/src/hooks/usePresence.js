/**
 * usePresence.js
 *
 * Real-time presence using the EXISTING Render backend's
 * sendMessage → receiveMessage forwarding (no backend changes needed).
 *
 * Protocol:
 *   1. requestPresence(targetUserId) emits a "presence_ping" via sendMessage.
 *   2. The target user's global handler (in authService.js) auto-responds
 *      with a "presence_pong" via sendMessage.
 *   3. We listen to receiveMessage for pongs → mark the sender online.
 *   4. If no pong within PONG_TIMEOUT_MS → mark offline.
 *
 * Also listens to user:online / user:offline events from the server for when
 * the backend is eventually updated to broadcast presence natively.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from "../services/socket";

const PONG_TIMEOUT_MS = 4000; // mark offline if no pong within 4s

export function usePresence() {
  // presence map: { [userId]: boolean }
  const [presence, setPresence] = useState({});
  // Per-user pong timers so we don't leave dangling timeouts
  const pongTimers = useRef({});

  const setOnline = useCallback((userId, isOnline) => {
    setPresence((prev) => ({ ...prev, [userId]: isOnline }));
  }, []);

  // ── Listen for pongs (and regular user:online / user:offline events) ─────
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      // Only handle presence pongs here
      if (!data._presencePong || !data.senderId) return;
      const uid = data.senderId.toString();
      // Cancel the "mark offline" timeout for this user
      if (pongTimers.current[uid]) {
        clearTimeout(pongTimers.current[uid]);
        delete pongTimers.current[uid];
      }
      setOnline(uid, true);
    };

    // Native server events (work when backend is updated)
    const handleUserOnline = ({ userId }) => {
      if (userId) setOnline(userId.toString(), true);
    };
    const handleUserOffline = ({ userId }) => {
      if (userId) setOnline(userId.toString(), false);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      // Clear all timers on unmount
      Object.values(pongTimers.current).forEach(clearTimeout);
      pongTimers.current = {};
    };
  }, [setOnline]);

  // ── Send a presence ping to a specific user ───────────────────────────────
  const requestPresence = useCallback(async (targetUserId) => {
    if (!targetUserId) return;
    const uid = targetUserId.toString();

    try {
      const stored = await AsyncStorage.getItem("user");
      const me = stored ? JSON.parse(stored) : null;
      const myId = (me?.id || me?._id)?.toString();
      if (!myId) return;

      // Emit ping using the existing sendMessage route on Render backend
      socket.emit("sendMessage", {
        senderId: myId,
        receiverId: uid,
        _presencePing: true,
      });

      // If no pong arrives within PONG_TIMEOUT_MS, mark the user offline
      if (pongTimers.current[uid]) clearTimeout(pongTimers.current[uid]);
      pongTimers.current[uid] = setTimeout(() => {
        setOnline(uid, false);
        delete pongTimers.current[uid];
      }, PONG_TIMEOUT_MS);
    } catch {}
  }, [setOnline]);

  const isUserOnline = useCallback(
    (userId) => presence[userId?.toString()] === true,
    [presence]
  );

  return { isUserOnline, requestPresence };
}
