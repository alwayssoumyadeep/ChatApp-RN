import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export default function MessageInput({ onSend }) {
  const [message, setMessage] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
    setInputHeight(40);
  };

  const handleContentSizeChange = (event) => {
    const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 120);
    setInputHeight(newHeight);
  };

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: "white",
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
    }}>

      <View style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: 20,
        paddingHorizontal: 14,
        minHeight: inputHeight + 8,
      }}>

        <TextInput
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          onContentSizeChange={handleContentSizeChange}
          multiline
          numberOfLines={4}
          style={{
            flex: 1,
            fontSize: 16,
            height: inputHeight,
            paddingVertical: 8,
            color: "#000",
          }}
        />

      </View>

      <TouchableOpacity
        onPress={handleSend}
        style={{
          marginLeft: 8,
          marginBottom: 2,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#2563eb",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Feather name="send" size={18} color="white" />
      </TouchableOpacity>

    </View>
  );
}