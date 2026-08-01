import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar
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
  const MAX_USERNAME_LENGTH = 20;
  const MAX_ABOUT_LENGTH = 100;

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
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: StatusBar.currentHeight,
      }}
    >
      <View className="flex-row items-center px-5 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-4">Edit Profile</Text>
      </View>

      <View className="items-center mt-8">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center">
          <Feather name="user" size={36} color={PRIMARY} />
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center mb-2 ml-1">
          <Feather name="at-sign" size={20} color="#6B7280" />
          <Text className="ml-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
            Username
          </Text>
        </View>
        <View className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-200">
          <TextInput
            value={username}
            onChangeText={setUsername}
            maxLength={MAX_USERNAME_LENGTH}
            className="text-base text-gray-900"
          />
        </View>
        <Text className={`text-xs mt-1 mr-1 text-right ${username.length >= MAX_USERNAME_LENGTH ? "text-red-500" : "text-gray-400"}`}>
          {username.length} / {MAX_USERNAME_LENGTH}
        </Text>
      </View>

      <View className="mb-8">
        <View className="flex-row items-center mb-2 ml-1">
          <Feather name="info" size={16} color="#6B7280" />
          <Text className="ml-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
            About
          </Text>
        </View>
        <View className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-200 min-h-[80px]">
          <TextInput
            value={about}
            onChangeText={setAbout}
            maxLength={MAX_ABOUT_LENGTH}
            multiline
            textAlignVertical="top"
            className="text-base text-gray-900 flex-1"
          />
        </View>
        <Text className={`text-xs mt-1 mr-1 text-right ${about.length >= MAX_ABOUT_LENGTH ? "text-red-500" : "text-gray-400"}`}>
          {about.length} / {MAX_ABOUT_LENGTH}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        // Changed from h-14 to h-12 (slightly less tall)
        // Added w-11/12 and self-center to make it slightly narrower than the screen
        // Added mt-2 to give it a little breathing room from the character counter
        className="bg-blue-600 rounded-xl h-12 w-7/12 self-center justify-center items-center mt-2"
      >
        <Text className="text-white text-lg font-bold">
          {saving ? "Saving..." : "Save changes"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}