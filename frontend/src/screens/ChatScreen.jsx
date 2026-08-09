import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../services/api";
import socket from "../services/socket";
import Avatar from "../components/Avatar";
import { deriveSharedKey, encryptMessage, decryptMessage } from "../utils/crypto";
import { bytesToHex } from "@noble/curves/utils.js";
import { useTheme } from "../theme/ThemeContext";
import { upsertConversation } from "./HomeScreen";
import { usePresence } from "../hooks/usePresence";

function TypingDots({ color }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(700),
        ])
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim) => ({
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: color,
    marginHorizontal: 1,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

function DateSeparator({ label, colors }) {
  return (
    <View style={styles.dateSep}>
      <View style={[styles.dateSepLine, { backgroundColor: colors.divider }]} />
      <Text style={[styles.dateSepText, { color: colors.textSecondary, backgroundColor: colors.bg }]}>
        {label}
      </Text>
      <View style={[styles.dateSepLine, { backgroundColor: colors.divider }]} />
    </View>
  );
}

const MessageBubble = React.memo(function MessageBubble({
  message,
  currentUserId,
  isFirst,
  isLast,
  colors,
  isNew,
}) {
  const c = colors;
  const isMine = String(message.senderId) === String(currentUserId);

  // Only animate brand-new messages
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(isNew ? 8 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(isNew ? 0.97 : 1)).current;

  useEffect(() => {
    if (!isNew) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim, isNew]);

  // Bubble shape: Telegram-style — rounded except one corner
  const bubbleRadius = 18;
  const tailRadius = 4;
  const bubbleStyle = isMine
    ? {
        borderTopLeftRadius: bubbleRadius,
        borderTopRightRadius: isFirst ? bubbleRadius : bubbleRadius,
        borderBottomLeftRadius: bubbleRadius,
        borderBottomRightRadius: isLast ? tailRadius : bubbleRadius,
      }
    : {
        borderTopLeftRadius: isFirst ? bubbleRadius : bubbleRadius,
        borderTopRightRadius: bubbleRadius,
        borderBottomLeftRadius: isLast ? tailRadius : bubbleRadius,
        borderBottomRightRadius: bubbleRadius,
      };

  const bgColor = isMine ? c.primary : (c.bg === "#FFFFFF" ? "#EFF0F2" : "#2B2B2D");
  const textColor = isMine ? "#FFFFFF" : c.text;
  const timeColor = isMine ? "rgba(255,255,255,0.7)" : c.textSecondary;

  return (
    <Animated.View
      style={[
        styles.bubbleOuter,
        { justifyContent: isMine ? "flex-end" : "flex-start" },
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
        !isLast ? styles.bubbleSpacingTight : styles.bubbleSpacingNormal,
      ]}
    >
      <View
        style={[
          styles.bubble,
          { backgroundColor: bgColor },
          bubbleStyle,
        ]}
      >
        <Text style={[styles.bubbleText, { color: textColor }]}>{message.text}</Text>
        <Text style={[styles.bubbleTime, { color: timeColor }]}>{message.time}</Text>
      </View>
    </Animated.View>
  );
});

function Composer({ onSend, onTypingChange, colors }) {
  const c = colors;
  const [text, setText] = useState("");
  const typingTimeout = useRef(null);
  // Track whether we've already emitted typing:start for the current session
  // so we don't fire it on every keystroke
  const isTypingRef = useRef(false);

  const handleChangeText = (val) => {
    setText(val);
    if (val.length > 0) {
      // Only emit start if we weren't already typing
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingChange(true);
      }
      // Reset the inactivity timer
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingChange(false);
      }, 2000);
    } else {
      // Input was cleared
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingChange(false);
      }
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    // Stop typing immediately before sending
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange(false);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    onSend(text.trim());
    setText("");
  };

  const hasText = text.trim().length > 0;

  // Scale transition for send/mic icon
  const iconScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
  }, [hasText, iconScale]);

  const composerBg = c.bg === "#FFFFFF" ? "#EFF0F2" : "#2B2B2D";

  return (
    <View
      style={[
        styles.composerWrapper,
        { backgroundColor: c.bg === "#FFFFFF" ? "#FFFFFF" : "#111111", borderTopColor: c.divider },
      ]}
    >
      {/* Input row */}
      <View style={[styles.composerRow, { backgroundColor: composerBg }]}>
        {/* Text input — no + attachment icon */}
        <TextInput
          style={[styles.composerInput, styles.composerInputPadded, { color: c.text }]}
          placeholder="Message"
          placeholderTextColor={c.textSecondary}
          value={text}
          onChangeText={handleChangeText}
          multiline
          maxHeight={120}
          selectionColor={c.primary}
          accessibilityLabel="Message"
        />

        {/* Send icon — always send, faded when empty, colored when ready */}
        <TouchableOpacity
          onPress={hasText ? handleSend : undefined}
          style={styles.composerAction}
          accessibilityLabel="Send message"
          activeOpacity={hasText ? 0.7 : 1}
        >
          <Animated.View style={{ transform: [{ scale: iconScale }], opacity: hasText ? 1 : 0.35 }}>
            <Feather
              name="send"
              size={20}
              color={c.primary}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation, route }) {
  const { user } = route.params;
  const { colors, isDark } = useTheme();
  const c = colors;

  const flatListRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharedKey, setSharedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState(new Set());

  // Typing timeout ref for remote user
  const remoteTypingTimeout = useRef(null);

  // ── Presence ───────────────────────────────────────────────────────────────
  const { isUserOnline, getUserLastSeen, requestPresence } = usePresence();
  const receiverId = (user._id || user.id || "").toString();
  const isOnline = isUserOnline(receiverId);

  // ─── Init current user ─────────────────────────────────────────────────────

  useEffect(() => {
    AsyncStorage.getItem("user").then((stored) => {
      if (stored) setCurrentUser(JSON.parse(stored));
    });
  }, []);

  // Request presence immediately and poll every 6 seconds while in ChatScreen
  useEffect(() => {
    requestPresence(receiverId);
    const interval = setInterval(() => {
      requestPresence(receiverId);
    }, 6000);

    return () => clearInterval(interval);
  }, [receiverId, requestPresence]);

  // Clean up remote typing timeout and emit typing:stop on unmount
  useEffect(() => {
    return () => {
      if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current);
      if (currentUser) {
        const currentUserId = (currentUser.id || currentUser._id)?.toString();
        socket.emit("typing:stop", { senderId: currentUserId, receiverId });
        socket.emit("sendMessage", { senderId: currentUserId, receiverId, _typingStop: true });
      }
    };
  }, [currentUser, user, receiverId]);

  // ─── Derive E2E key ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser || !user) return;
    const setupKey = async () => {
      const currentUserId = currentUser.id || currentUser._id;
      const receiverId = user._id || user.id;
      const myPrivateKey = await AsyncStorage.getItem(`privateKey_${currentUserId}`);
      if (!myPrivateKey) return;
      try {
        const res = await api.get(`/users/${receiverId}`);
        const theirPublicKey = res.data.user.publicKey;
        if (!theirPublicKey) return;
        const key = deriveSharedKey(myPrivateKey, theirPublicKey);
        setSharedKey(key);
      } catch (err) {
        console.log("Key setup failed:", err.message);
      }
    };
    setupKey();
  }, [currentUser, user]);

  // ─── Fetch message history ─────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser || !user || !sharedKey) return;
    const currentUserId = currentUser.id || currentUser._id;
    const receiverId = user._id || user.id;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${currentUserId}/${receiverId}`);
        if (res.data?.messages && res.data.messages.length > 0) {
          const formatted = res.data.messages.map((m) => ({
            id: (m._id || m.id || Date.now() + Math.random()).toString(),
            senderId: (m.senderId || "").toString(),
            text: sharedKey
              ? decryptMessage(m.message, m.iv, sharedKey)
              : "[Loading keys...]",
            time: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "",
            createdAt: m.createdAt,
            isNew: false,
          }));
          setMessages(formatted);

          // ── Update HomeScreen conversation cache ──────────────────────────
          const lastMsg = formatted[formatted.length - 1];
          const lastRaw = res.data.messages[res.data.messages.length - 1];
          upsertConversation({
            userId: receiverId,
            username: user.username || user.name || "User",
            profilePicture: user.profilePicture || null,
            about: user.about || "",
            isOnline: user.isOnline || false,
            publicKey: user.publicKey || null,
            preview: lastMsg.text,
            lastMessageAt: lastRaw.createdAt || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.log("Fetch messages error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUser, user, sharedKey]);

  // ─── Socket: receive messages + typing ────────────────────────────────────

  useEffect(() => {
    const receiverId = user._id || user.id;

    const handleReceiveMessage = (data) => {
      if (data.senderId !== receiverId) return;

      // Filter out internal control frames from chat message list
      if (data._presencePing || data._presencePong) return;

      // Handle typing control frames (fallback for deployed server)
      if (data._typingStart) {
        handleTypingStart(data);
        return;
      }
      if (data._typingStop) {
        handleTypingStop(data);
        return;
      }

      // Clear remote typing when actual message is received
      setRemoteTyping(false);
      if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current);

      const msgId = Date.now().toString() + Math.random();
      const newMsg = {
        id: msgId,
        senderId: data.senderId,
        text: sharedKey
          ? decryptMessage(data.message, data.iv, sharedKey)
          : "[Unable to decrypt]",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isNew: true,
      };

      setMessages((prev) => {
        return [...prev, newMsg];
      });
      setNewMessageIds((prev) => new Set([...prev, msgId]));

      // ── Update HomeScreen conversation cache ────────────────────────────
      upsertConversation({
        userId: receiverId,
        username: user.username || user.name || "User",
        profilePicture: user.profilePicture || null,
        about: user.about || "",
        isOnline: user.isOnline || false,
        publicKey: user.publicKey || null,
        preview: newMsg.text,
        lastMessageAt: new Date().toISOString(),
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const handleTypingStart = (data) => {
      if (data.senderId !== receiverId) return;
      setRemoteTyping(true);
      // Safety timeout: clear after 5s if stop event is lost
      if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current);
      remoteTypingTimeout.current = setTimeout(() => {
        setRemoteTyping(false);
      }, 5000);
    };

    const handleTypingStop = (data) => {
      if (data.senderId !== receiverId) return;
      setRemoteTyping(false);
      if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current);
    };
  }, [user, sharedKey, remoteTypingTimeout]);

  // ─── Local typing → emit events ───────────────────────────────────────────

  const handleTypingChange = useCallback(
    (isTyping) => {
      if (!currentUser) return;
      const currentUserId = (currentUser.id || currentUser._id)?.toString();
      const rId = (user._id || user.id)?.toString();

      // Emit dedicated typing event
      socket.emit(isTyping ? "typing:start" : "typing:stop", {
        senderId: currentUserId,
        receiverId: rId,
      });

      // Also emit via sendMessage as fallback for servers without typing event forwarding
      socket.emit("sendMessage", {
        senderId: currentUserId,
        receiverId: rId,
        _typingStart: isTyping ? true : undefined,
        _typingStop: !isTyping ? true : undefined,
      });
    },
    [currentUser, user]
  );

  // ─── Send message ─────────────────────────────────────────────────────────

  const sendMessage = async (text) => {
    if (!text.trim() || !currentUser) return;
    const currentUserId = currentUser.id || currentUser._id;
    const receiverId = user._id || user.id;
    if (!sharedKey) return;

    const { ciphertext, iv } = encryptMessage(text, sharedKey);

    const msgId = Date.now().toString();
    const tempMsg = {
      id: msgId,
      senderId: (currentUserId || "").toString(),
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isNew: true,
    };

    // Optimistic: add immediately
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessageIds((prev) => new Set([...prev, msgId]));

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);

    try {
      await api.post("/messages", { receiverId, message: ciphertext, iv });
      socket.emit("sendMessage", { senderId: currentUserId, receiverId, message: ciphertext, iv });

      // ── Update HomeScreen conversation cache ──────────────────────────
      upsertConversation({
        userId: receiverId,
        username: user.username || user.name || "User",
        profilePicture: user.profilePicture || null,
        about: user.about || "",
        isOnline: user.isOnline || false,
        publicKey: user.publicKey || null,
        preview: text,
        lastMessageAt: new Date().toISOString(),
      });
    } catch (err) {
      console.log("Send error:", err.message);
    }
  };

  // ─── Render message with grouping + date separators ───────────────────────

  const currentUserIdStr = currentUser
    ? (currentUser.id || currentUser._id || "").toString()
    : "";

  const name = user.name || user.username || "User";
  const listItems = React.useMemo(() => {
    const items = [];
    let lastDate = "";
    let lastSenderId = "";

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const next = messages[i + 1];
      const prev = messages[i - 1];

      // Date separator
      let dateLabel = "";
      if (msg.createdAt) {
        const d = new Date(msg.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const dayStr = d.toDateString();
        if (dayStr !== lastDate) {
          lastDate = dayStr;
          if (dayStr === today.toDateString()) dateLabel = "Today";
          else if (dayStr === yesterday.toDateString()) dateLabel = "Yesterday";
          else dateLabel = d.toLocaleDateString([], { month: "long", day: "numeric" });
        }
      }

      const isFirst = !prev || prev.senderId !== msg.senderId;
      const isLast = !next || next.senderId !== msg.senderId;

      if (dateLabel) {
        items.push({ type: "date", id: `date_${msg.id}`, label: dateLabel });
      }
      items.push({ type: "msg", ...msg, isFirst, isLast });
    }
    return items;
  }, [messages]);

  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === "date") {
        return <DateSeparator label={item.label} colors={c} />;
      }
      return (
        <MessageBubble
          message={item}
          currentUserId={currentUserIdStr}
          isFirst={item.isFirst}
          isLast={item.isLast}
          colors={c}
          isNew={newMessageIds.has(item.id)}
        />
      );
    },
    [currentUserIdStr, c, newMessageIds]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={c.statusBar} backgroundColor={c.header} />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View
          style={[
            styles.header,
            { backgroundColor: c.header, borderBottomColor: c.headerBorder },
          ]}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={c.text} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={{ marginRight: 10 }}>
            <Avatar name={name} image={user.profilePicture} size={40} />
          </View>

          {/* Name + status */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerName, { color: c.text }]} numberOfLines={1}>
              {name}
            </Text>
            {remoteTyping ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.headerStatus, { color: c.primary }]}>typing</Text>
                <TypingDots color={c.primary} />
              </View>
            ) : (
              <Text style={[styles.headerStatus, { color: isOnline ? "#4CAF50" : c.textSecondary }]}>
                {isOnline ? "online" : "offline"}
              </Text>
            )}
          </View>
        </View>

        {/* ── Messages ───────────────────────────────────────────────────── */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}
        >
          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator color={c.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                Say hello to {name} 👋
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={listItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              removeClippedSubviews={true}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          )}

          {/* ── Composer ─────────────────────────────────────────────────── */}
          <Composer
            onSend={sendMessage}
            onTypingChange={handleTypingChange}
            colors={c}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { marginRight: 4, padding: 4 },
  headerName: { fontSize: 16, fontWeight: "700" },
  headerStatus: { fontSize: 13, marginTop: 1 },

  // Messages
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 8,
  },

  // Bubbles
  bubbleOuter: {
    flexDirection: "row",
    paddingHorizontal: 2,
  },
  bubbleSpacingTight: { marginBottom: 2 },
  bubbleSpacingNormal: { marginBottom: 8 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 11, marginTop: 4, alignSelf: "flex-end" },

  // Date separator
  dateSep: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  dateSepLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dateSepText: {
    fontSize: 12,
    paddingHorizontal: 12,
    fontWeight: "500",
  },

  // Composer
  composerWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  composerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 4,
    paddingVertical: 8,
    maxHeight: 120,
    lineHeight: 20,
  },
  composerInputPadded: {
    paddingLeft: 12,
  },

  // States
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 15 },
});