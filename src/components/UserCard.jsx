import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import Avatar from "./Avatar";

export default function UserCard({ user, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-4"
    >
      {/* Avatar */}
      <View className="relative">

        <Avatar
          name={user.name}
          image={user.profilePicture}
          size={54}
        />

        {/* Online Status */}
        <View
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
            user.status === "online"
              ? "bg-green-500"
              : "bg-gray-300"
          }`}
        />

      </View>

      {/* User Info */}
      <View className="flex-1 ml-4">

        <Text
          className="text-base font-semibold text-gray-900"
          numberOfLines={1}
        >
          {user.name}
        </Text>

        <Text
          className="text-gray-400 mt-1 text-sm"
          numberOfLines={1}
        >
          {user.about || "Hey there! I'm using MeChat."}
        </Text>

      </View>

      {/* Right Arrow */}
      <View className="ml-2 w-8 h-8 rounded-full bg-blue-50 justify-center items-center">
        <Feather name="chevron-right" size={16} color="#2563EB" />
      </View>

    </TouchableOpacity>
  );
}