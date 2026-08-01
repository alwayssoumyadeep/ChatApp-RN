import MessageActionModal from "../components/MessageActionModal";
import { deriveSharedKey, encryptMessage, decryptMessage } from "../utils/crypto";
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
  Keyboard
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import socket from "../services/socket";

import Avatar from "../components/Avatar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";

export default function ChatScreen({
  navigation,
  route,
}) {
  const { user } = route.params;
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharedKey, setSharedKey] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const setupKey = async () => {
      if (!currentUser || !user) return;
      const currentUserId = currentUser.id || currentUser._id;

      const myPrivateKey = await AsyncStorage.getItem(`privateKey_${currentUserId}`);
      const theirPublicKey = user.publicKey;

      if (!myPrivateKey || !theirPublicKey) {
        return;
      }

      const key = deriveSharedKey(myPrivateKey, theirPublicKey);
      setSharedKey(key);
    };
    setupKey();
  }, [currentUser, user]);

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
    if (!currentUser) return;
    const currentUserId = currentUser.id || currentUser._id;

    socket.connect();
    socket.emit("register", currentUserId);

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !user || !sharedKey) return;
    const currentUserId = currentUser.id || currentUser._id;
    const receiverId = user._id || user.id;

    if (!currentUserId || !receiverId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${currentUserId}/${receiverId}`);
        if (res?.data?.messages) {
          const formatted = res.data.messages.map((m) => ({
            id: (m._id || m.id || Math.random()).toString(),
            senderId: (m.senderId || "").toString(),
            text: decryptMessage(m.message, m.iv, sharedKey),
            time: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : m.time || "",
            reaction: m.reaction || null,
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.log("Error fetching messages:", err?.message);
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
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [user, sharedKey]);

  const sendMessage = async (text) => {
    if (!text.trim() || !currentUser) return;

    const currentUserId = currentUser.id || currentUser._id;
    const receiverId = user?._id || user?.id;
    const tempId = Date.now().toString();

    const tempMessage = {
      id: tempId,
      senderId: (currentUserId || "").toString(),
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reaction: null
    };

    setMessages((prev) => [...prev, tempMessage]);

    if (!sharedKey) return;
    const { ciphertext, iv } = encryptMessage(text, sharedKey);

    try {
      const res = await api.post("/messages", {
        receiverId,
        message: ciphertext,
        iv
      });

      const realMongoId = res?.data?.data?._id;
      if (realMongoId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...msg, id: realMongoId.toString() } : msg))
        );
      }

      socket.emit("sendMessage", {
        id: realMongoId ? realMongoId.toString() : tempId,
        senderId: currentUserId,
        receiverId,
        message: ciphertext,
        iv
      });
    } catch (err) {
      console.log("Error sending message:", err?.message);
    }
  };

  const currentUserIdStr = currentUser ? (currentUser.id || currentUser._id || "").toString() : "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView
        className="flex-1 bg-white"
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >

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

        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          inverted={true}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              currentUserId={currentUserIdStr} 
              onLongPress={() => {
                setSelectedMessage(item);
                setIsModalVisible(true);
              }}
            />
          )}
        />

        <MessageInput onSend={sendMessage} />

        <MessageActionModal
          visible={isModalVisible}
          message={selectedMessage}
          onClose={() => setIsModalVisible(false)}
          onReact={async (emoji) => {
            if (!selectedMessage?.id) return; 

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === selectedMessage.id ? { ...msg, reaction: emoji } : msg
              )
            );
            
            try {
              await api.patch(`/messages/${selectedMessage.id}/react`, { reaction: emoji });
              
              socket.emit("reactMessage", { 
                messageId: selectedMessage.id, 
                reaction: emoji, 
                receiverId: user?._id || user?.id 
              });
            } catch (err) {
              console.log("Reaction API Error Details:", err?.response?.data || err?.message);
            }
          }}
        />

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}