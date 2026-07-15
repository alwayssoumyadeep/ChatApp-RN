import React from "react";
import { View, Text } from "react-native";
import { auth } from "../firebase/firebaseConfig";

export default function MessageBubble({ message }) {
  const isMine = message.senderId === auth.currentUser?.uid;

  return (
    <View
      className={`px-4 my-2 ${
        isMine ? "items-end" : "items-start"
      }`}
    >
      <View
        className={`max-w-[80%] px-4 py-3 ${
          isMine
            ? "bg-blue-600 rounded-3xl rounded-br-md"
            : "bg-gray-200 rounded-3xl rounded-bl-md"
        }`}
      >
        {/* Message Text */}
        <Text
          className={`text-base ${
            isMine ? "text-white" : "text-gray-900"
          }`}
        >
          {message.text}
        </Text>

        {/* Time */}
        <Text
          className={`text-[11px] mt-2 self-end ${
            isMine ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {message.time}
        </Text>
      </View>
    </View>
  );
}