import React from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

export default function MessageActionModal({ visible, message, onClose, onReact }) {
  if (!message) return null;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.text);
    alert("Message copied!");
    onClose();
  };

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl p-6 pb-10">
              
              {/* Emoji Reactions */}
              <View className="flex-row justify-between bg-gray-100 p-3 rounded-full mb-6">
                {emojis.map((emoji, index) => (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => {
                      onReact(emoji);
                      onClose();
                    }}
                  >
                    <Text className="text-2xl">{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View className="space-y-4">
                <TouchableOpacity 
                  onPress={handleCopy}
                  className="flex-row items-center px-4 py-3 bg-gray-50 rounded-xl"
                >
                  <Feather name="copy" size={20} color="#374151" />
                  <Text className="ml-4 text-base font-semibold text-gray-700">Copy Message</Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}