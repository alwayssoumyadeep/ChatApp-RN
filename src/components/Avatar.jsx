import React from "react";
import { View, Text, Image } from "react-native";

export default function Avatar({ name, image, size = 56 }) {

  // Generate initials
  const initials = name
    ?.split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Generate a consistent color from the name
  const colors = [
    "#3B82F6",
    "#8B5CF6",
    "#F97316",
    "#10B981",
    "#EF4444",
    "#EC4899",
    "#F59E0B",
    "#06B6D4",
  ];

  const color =
    colors[
      name.length % colors.length
    ];

  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
      className="items-center justify-center"
    >
      <Text
        style={{
          fontSize: size / 2.5,
        }}
        className="text-white font-bold"
      >
        {initials}
      </Text>
    </View>
  );
}