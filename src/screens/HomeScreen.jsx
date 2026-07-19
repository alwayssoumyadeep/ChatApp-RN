import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import UserCard from "../components/UserCard";

const PRIMARY = "#2563EB";

export default function HomeScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users);
    } catch (err) {
      console.log(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    };
    init();
  }, []);

  // Auto-refresh the list every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.replace("Login");
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
        <Text className="text-xl font-semibold text-gray-900">MeChat</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="px-5 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11">
          <Feather name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search users"
            className="flex-1 ml-2 text-base"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers();
            }}
          />
        }
        renderItem={({ item }) => (
          <UserCard
            user={{ name: item.username, status: item.isOnline ? "online" : "offline" }}
            onPress={() => navigation.navigate("Chat", { user: item })}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 px-8">
            <Text className="text-gray-400 text-center">
              {search
                ? "No users match your search."
                : "No other users yet. Ask a teammate to register."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}