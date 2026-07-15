import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { Feather } from "@expo/vector-icons";

export default function MessageInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;

    onSend(message);

    setMessage("");
  };

  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-200">

      <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 h-12">

        <TextInput
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          className="flex-1 text-base"
          multiline
        />

      </View>

      <TouchableOpacity
        onPress={handleSend}
        className="ml-3 w-12 h-10 rounded-full bg-blue-600 justify-center items-center"
      >
        <Feather
          name="send"
          size={20}
          color="white"
        />
      </TouchableOpacity>

    </View>
  );
}