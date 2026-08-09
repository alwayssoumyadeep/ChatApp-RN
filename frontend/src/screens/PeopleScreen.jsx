import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { useFocusEffect } from "@react-navigation/native";

import api from "../services/api";
import Avatar from "../components/Avatar";
import BottomNavigation from "../components/BottomNavigation";
import { useTheme } from "../theme/ThemeContext";

export default function PeopleScreen({ navigation }) {
  const { colors } = useTheme();
  const c = colors;

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get("/users");
      const sorted = (res.data.users || []).sort((a, b) => {
        const nameA = (a.username || a.name || "").toLowerCase();
        const nameB = (b.username || b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setUsers(sorted);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadUsers(); }, [loadUsers]));

  const handleTabPress = (tab) => {
    if (tab === "Chats") navigation.navigate("Home");
    if (tab === "Settings") navigation.navigate("Settings");
  };

  // Search filters only by name (people search)
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={c.statusBar} backgroundColor={c.header} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: c.header, borderBottomColor: c.headerBorder },
          ]}
        >
          <Text style={[styles.headerTitle, { color: c.text }]}>People</Text>
        </View>

        {/* Search — people search only */}
        <View style={[styles.searchWrapper, { backgroundColor: c.header }]}>
          <View style={[styles.searchBar, { backgroundColor: c.search }]}>
            <Feather
              name="search"
              size={16}
              color={c.searchIcon}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: c.searchText }]}
              placeholder="Search people"
              placeholderTextColor={c.searchPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              selectionColor={c.primary}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Feather name="x-circle" size={16} color={c.searchIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Alphabetically sorted list */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const name = item.username || item.name || "User";
            return (
              <TouchableOpacity
                style={[styles.row, { backgroundColor: c.chatRowBg }]}
                activeOpacity={0.65}
                onPress={() => navigation.navigate("Chat", { user: item })}
              >
                <View style={{ marginRight: 12 }}>
                  <Avatar name={name} image={item.profilePicture} size={50} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text
                    style={[styles.about, { color: c.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.about || "Hey there! I'm using MeChat."}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: c.divider }]} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  {search ? "No people match your search." : "No other users yet."}
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      <BottomNavigation activeTab="People" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 36,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 68,
  },
  name: { fontSize: 16, fontWeight: "600" },
  about: { fontSize: 14, marginTop: 2 },
  divider: {
    position: "absolute",
    bottom: 0,
    left: 78,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  empty: { alignItems: "center", marginTop: 48 },
  emptyText: { fontSize: 15 },
});
