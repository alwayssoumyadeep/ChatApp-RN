import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import socket from "../services/socket";

import Avatar from "../components/Avatar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import { deriveSharedKey, encryptMessage, decryptMessage } from "../utils/crypto";
import { bytesToHex } from "@noble/curves/utils.js";

export default function ChatScreen({
  navigation,
  route,
}) {
  const { user } = route.params;
  const flatListRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharedKey, setSharedKey] = useState(null);

  useEffect(() => {
    const initUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    };
    initUser();
  }, []);

  useEffect(() => {
  const setupKey = async () => {
    console.log("STEP 2 - setupKey running. currentUser:", currentUser, "user:", user);
    if (!currentUser || !user) {
      console.log("STEP 2 - exiting early, missing currentUser or user");
      return;
    }
    const currentUserId = currentUser.id || currentUser._id;
    const receiverId = user._id || user.id;

    const myPrivateKey = await AsyncStorage.getItem(`privateKey_${currentUserId}`);
    console.log("STEP 3 - myPrivateKey found?", !!myPrivateKey);
    if (!myPrivateKey) {
      console.log("No local private key found for current user");
      return;
    }

    try {
      const res = await api.get(`/users/${receiverId}`);
      const theirPublicKey = res.data.user.publicKey;
      console.log("STEP 4 - theirPublicKey found?", !!theirPublicKey);

      if (!theirPublicKey) {
        console.log("Receiver has no public key yet");
        return;
      }

      const key = deriveSharedKey(myPrivateKey, theirPublicKey);
      setSharedKey(key);
      console.log("=====SHARED KEY=====", bytesToHex(key), "=====END=====");
    } catch (err) {
      console.log("Failed to fetch receiver public key:", err.response?.data || err.message);
    }
  };
  setupKey();
}, [currentUser, user]);

  useEffect(() => {
    if (!currentUser || !user) return;
    const currentUserId = currentUser.id || currentUser._id;
    const receiverId = user._id || user.id;

    if (!currentUserId || !receiverId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${currentUserId}/${receiverId}`);
        if (res.data && res.data.messages) {
          const formatted = res.data.messages.map((m) => ({
            id: (m._id || m.id || Date.now() + Math.random()).toString(),
            senderId: (m.senderId || "").toString(),
            text: sharedKey ? decryptMessage(m.message, m.iv, sharedKey) : "[Loading keys...]",
            time: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : m.time || "",
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.log("Error fetching messages:", err.response?.data || err.message);
      }
    };

    fetchMessages();
  }, [currentUser, user, sharedKey]);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      const receiverId = user._id || user.id;
      const senderMatches = data.senderId === receiverId;

      if (senderMatches) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            senderId: data.senderId,
            text: sharedKey ? decryptMessage(data.message, data.iv, sharedKey) : "[Unable to decrypt]",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [user, sharedKey]);

  useEffect(() => {
  const initUser = async () => {
    const stored = await AsyncStorage.getItem("user");
    console.log("STEP 1 - stored user:", stored);
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  };
  initUser();
}, []);

  const sendMessage = async (text) => {
    if (!text.trim() || !currentUser) return;

    const currentUserId = currentUser.id || currentUser._id;
    const receiverId = user._id || user.id;

    if (!sharedKey) {
      console.log("Encryption key not ready yet");
      return;
    }

    const { ciphertext, iv } = encryptMessage(text, sharedKey);

    const tempMessage = {
      id: Date.now().toString(),
      senderId: (currentUserId || "").toString(),
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, tempMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);

    console.log("Attempting to send:", { receiverId, ciphertext, iv });

    try {
      await api.post("/messages", {
        receiverId,
        message: ciphertext,
        iv,
      });

      socket.emit("sendMessage", {
        senderId: currentUserId,
        receiverId,
        message: ciphertext,
        iv,
      });
      console.log("Message sent successfully to backend");
    } catch (err) {
      console.log("Error sending message:", err.response?.data || err.message);
    }
  };

  const currentUserIdStr = currentUser ? (currentUser.id || currentUser._id || "").toString() : "";

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: StatusBar.currentHeight,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={StatusBar.currentHeight || 0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={26} color="#111827" />
          </TouchableOpacity>

          <View className="ml-3">
            <Avatar
              name={user.name || user.username || "User"}
              image={user.profilePicture}
              size={48}
            />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {user.name || user.username || "User"}
            </Text>
            <Text className="text-sm text-green-600">
              {user.status === "online" || user.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 15,
            paddingBottom: 10,
          }}
          renderItem={({ item }) => (
            <MessageBubble message={item} currentUserId={currentUserIdStr} />
          )}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({
              animated: true,
            })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({
              animated: true,
            })
          }
          keyboardShouldPersistTaps="handled"
        />

        <MessageInput onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}