import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  signOut
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import UserCard from "../components/UserCard";

// Shared accent color — keep this in sync with the Sign Up / Login screens
const PRIMARY = "#2563EB";

export default function HomeScreen({ navigation }) {

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = auth.currentUser;

  const fetchUsers = async () => {

    try {

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const list = [];

      snapshot.forEach((doc) => {

        const data = doc.data();

        if (data.uid !== currentUser.uid) {
          list.push(data);
        }

      });

      setUsers(list);

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Error",
        "Unable to fetch users."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };

  useEffect(() => {

    fetchUsers();

  }, []);


  const onRefresh = () => {

    setRefreshing(true);

    fetchUsers();

  };

  const handleLogout = () => {

    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {

            try {

              await signOut(auth);

              navigation.replace("Login");

            } catch (error) {

              Alert.alert(
                "Error",
                error.message
              );

            }

          },
        },
      ]
    );

  };

  const initials = (currentUser?.displayName || "U")
    .trim()
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {

    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-50">

        <View
          className="w-16 h-16 rounded-2xl bg-blue-50 justify-center items-center mb-4"
        >
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>

        <Text className="text-gray-500 font-medium">
          Loading your contacts...
        </Text>

      </SafeAreaView>
    );

  }

  return (

    <SafeAreaView
        className="flex-1 bg-slate-50"
        style={{
            paddingTop: StatusBar.currentHeight,
        }}
    >

      {/* Header */}

      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">

        <View className="flex-row items-center flex-1 pr-3">

          <View
            className="w-14 h-14 rounded-2xl bg-blue-600 justify-center items-center mr-3"
            style={{
              shadowColor: PRIMARY,
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Text className="text-white text-lg font-bold">
              {initials}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-gray-400 text-sm">
              Welcome back
            </Text>

            <Text
              className="text-2xl font-bold text-gray-900"
              numberOfLines={1}
            >
              {currentUser?.displayName || "User"}
            </Text>
          </View>

        </View>

        <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="w-12 h-12 rounded-2xl bg-red-50 justify-center items-center"
        >
            <Feather
                name="log-out"
                size={20}
                color="#DC2626"
            />
        </TouchableOpacity>

      </View>

      {/* Section Title */}

      <View className="flex-row items-center justify-between px-6 mt-6 mb-3">
        <Text className="text-xl font-bold text-gray-900">
          Contacts
        </Text>
        <View className="bg-blue-50 rounded-full px-3 py-1">
          <Text className="text-blue-600 text-xs font-semibold">
            {users.length} {users.length === 1 ? "person" : "people"}
          </Text>
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 30,
          flexGrow: users.length === 0 ? 1 : 0,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
        renderItem={({ item }) => (
          <View
            className="bg-white rounded-2xl border border-gray-100"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }}
          >
            <UserCard
              user={item}
              onPress={() =>
                navigation.navigate("Chat", {
                  user: item,
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center">

            <View className="w-32 h-32 rounded-full bg-blue-50 justify-center items-center mb-5">
              <Feather
                name="users"
                size={54}
                color={PRIMARY}
              />
            </View>

            <Text className="text-xl font-bold text-gray-900 mt-1">
              No Contacts Yet
            </Text>

            <Text className="text-gray-400 mt-2 text-center px-10 leading-5">
              There are no other registered users yet. Invite a friend to get started.
            </Text>

          </View>
        }
      />

    </SafeAreaView>

  );
}