import React from "react";
import { View, Text } from "react-native";

export default function MessageBubble({ message, currentUserId }) {
  const isMine = message.senderId === currentUserId;

  return (
    <View className={`px-4 my-2 ${isMine ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[80%] px-4 py-3 ${
          isMine
            ? "bg-blue-600 rounded-3xl rounded-br-md"
            : "bg-gray-200 rounded-3xl rounded-bl-md"
        }`}
      >
        <Text className={`text-base ${isMine ? "text-white" : "text-gray-900"}`}>
          {message.text}
        </Text>
        <Text className={`text-[11px] mt-2 self-end ${isMine ? "text-blue-100" : "text-gray-500"}`}>
          {message.time}
        </Text>
      </View>
    </View>
  );
}