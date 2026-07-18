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

import { Feather } from "@expo/vector-icons";

import Avatar from "../components/Avatar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";



export default function ChatScreen({
  navigation,
  route,
}) {

  const { user } = route.params;

  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      senderId: user.uid,
      text: "Hello",
      time: "10:30 PM",
    },
    {
      id: "2",
      senderId: auth.currentUser.uid,
      text: "Hi",
      time: "10:31 PM",
    },
    {
      id: "3",
      senderId: user.uid,
      text: "Bye",
      time: "10:31 PM",
    },
    // {
    //   id: "4",
    //   senderId: auth.currentUser.uid,
    //   text: "Bye 2",
    //   time: "10:32 PM",
    // },
    // {
    //   id: "5",
    //   senderId: user.uid,
    //   text: "Nice",
    //   time: "10:33 PM",
    // },
  ]);

  useEffect(() => {

    setTimeout(() => {

      flatListRef.current?.scrollToEnd({
        animated: true,
      });

    }, 200);

  }, []);
    const sendMessage = (text) => {
    if (!text.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: auth.currentUser.uid,
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

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

          {/* Back Button */}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <Feather
              name="arrow-left"
              size={26}
              color="#111827"
            />
          </TouchableOpacity>

          {/* Avatar */}

          <View className="ml-3">
            <Avatar
              name={user.name}
              image={user.profilePicture}
              size={48}
            />
          </View>

          {/* User Details */}

          <View className="ml-3 flex-1">

            <Text className="text-lg font-bold text-gray-900">
              {user.name}
            </Text>

            <Text className="text-sm text-green-600">
              {user.status === "online"
                ? "Online"
                : "Offline"}
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
            <MessageBubble
              message={item}
            />
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

        {/* Message Input */}

        <MessageInput
          onSend={sendMessage}
        />
              </KeyboardAvoidingView>
    </SafeAreaView>
  );
}