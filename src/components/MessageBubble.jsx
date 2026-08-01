import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";

const MessageBubble = ({ message, currentUserId, onLongPress }) => {
  const isMine = message.senderId === currentUserId;

  return (
    <TouchableOpacity activeOpacity={0.8} onLongPress={onLongPress}>
      <View className={`px-4 my-2 ${isMine ? "items-end" : "items-start"}`}>
        <View
          className={`relative max-w-[80%] px-4 py-3 ${
            isMine ? "bg-blue-600 rounded-3xl rounded-br-md" : "bg-gray-200 rounded-3xl rounded-bl-md"
          }`}
        >
          <Text className={`text-base ${isMine ? "text-white" : "text-gray-900"}`}>
            {message.text}
          </Text>
          
          <Text className={`text-[11px] mt-2 self-end ${isMine ? "text-blue-100" : "text-gray-500"}`}>
            {message.time}
          </Text>

          {/* FLOATING REACTION EMOJI */}
          {message.reaction ? (
            <View className={`absolute -bottom-3 ${isMine ? "right-2" : "left-2"} bg-white rounded-full px-1.5 py-0.5 border border-gray-200 shadow-sm`}>
              <Text className="text-[12px]">{message.reaction}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.reaction === nextProps.message.reaction
  );
});