import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#2563EB";

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.replace("Login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 items-center justify-center px-8">
        <Feather name="check-circle" size={56} color={PRIMARY} />
        <Text className="text-2xl font-bold text-gray-900 mt-4">
          Logged in successfully
        </Text>
        {user && (
          <Text className="text-gray-500 mt-2 text-center">
            Welcome, {user.username} ({user.email})
          </Text>
        )}
        <Text className="text-gray-400 mt-6 text-center text-sm">
          Chat list and messaging UI coming soon
        </Text>

        <TouchableOpacity
          onPress={handleLogout}
          className="mt-10 bg-gray-100 rounded-xl px-6 h-12 justify-center items-center"
        >
          <Text className="text-red-600 font-medium">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}