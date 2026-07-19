import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const PRIMARY = "#2563EB";

export default function ProfileScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setUsername(res.data.user.username);
        setAbout(res.data.user.about || "");
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!username.trim()) {
      alert("Username cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch("/users/me", {
        username: username.trim(),
        about,
      });
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Profile updated");
      navigation.goBack();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-4">Edit profile</Text>
      </View>

      <View className="items-center mt-8">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center">
          <Feather name="user" size={36} color={PRIMARY} />
        </View>
      </View>

      <View className="px-6 mt-10">
        <Text className="text-xs text-gray-400 mb-2">Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          className="bg-gray-100 rounded-xl px-4 h-12 text-base mb-6"
        />

        <Text className="text-xs text-gray-400 mb-2">About</Text>
        <TextInput
          value={about}
          onChangeText={setAbout}
          multiline
          className="bg-gray-100 rounded-xl px-4 py-3 text-base mb-8"
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-blue-600 rounded-xl h-14 justify-center items-center"
        >
          <Text className="text-white text-lg font-bold">
            {saving ? "Saving..." : "Save changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}