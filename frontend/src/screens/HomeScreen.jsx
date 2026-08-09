import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Avatar from "../components/Avatar";
import BottomNavigation from "../components/BottomNavigation";
import { useTheme } from "../theme/ThemeContext";
import { initSocket } from "../services/authService";

export const CONV_STORAGE_KEY = "conversations";

export async function getStoredConversations() {
  try {
    const raw = await AsyncStorage.getItem(CONV_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function upsertConversation(entry) {
  try {
    const existing = await getStoredConversations();
    const idx = existing.findIndex((c) => c.userId === entry.userId);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...entry };
    } else {
      existing.unshift(entry);
    }
    // Sort by most recent
    existing.sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
    await AsyncStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(existing));
  } catch {}
}

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function SkeletonRow({ colors }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={[styles.skeletonAvatar, { backgroundColor: colors.skeletonBase }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonName, { backgroundColor: colors.skeletonBase }]} />
        <View style={[styles.skeletonMsg, { backgroundColor: colors.skeletonBase }]} />
      </View>
    </Animated.View>
  );
}

const ChatRow = React.memo(function ChatRow({ conversation, onPress, colors }) {
  const c = colors;
  const name = conversation.username || "User";
  const ts = formatTimestamp(conversation.lastMessageAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chatRow, { backgroundColor: c.chatRowBg }]}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${name}`}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <Avatar name={name} image={conversation.profilePicture} size={52} />
      </View>

      {/* Content */}
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={[styles.chatName, { color: c.text }]} numberOfLines={1}>
            {name}
          </Text>
          {ts ? (
            <Text style={[styles.chatTime, { color: c.textSecondary }]}>{ts}</Text>
          ) : null}
        </View>
        <Text style={[styles.chatPreview, { color: c.textSecondary }]} numberOfLines={1}>
          {conversation.preview || conversation.about || "Tap to chat"}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.rowDivider, { backgroundColor: c.divider }]} />
    </TouchableOpacity>
  );
});

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const c = colors;

  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Chats");

  const headerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [headerOpacity]);

  const loadConversations = useCallback(async () => {
    try {
      const stored = await getStoredConversations();
      setConversations(stored);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      initSocket();
      loadConversations();
    }, [loadConversations])
  );

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === "People") navigation.navigate("People");
    if (tab === "Settings") navigation.navigate("Settings");
  };

  // Build user object to pass to ChatScreen
  const buildUserParam = (conv) => ({
    _id: conv.userId,
    id: conv.userId,
    username: conv.username,
    profilePicture: conv.profilePicture,
    about: conv.about,
    isOnline: conv.isOnline,
    publicKey: conv.publicKey,
  });

  // Search by name or message preview
  const filtered = conversations.filter((conv) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (conv.username || "").toLowerCase().includes(q) ||
      (conv.preview || "").toLowerCase().includes(q)
    );
  });

  // ─── Content ───────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonRow key={i} colors={c} />
          ))}
        </View>
      );
    }

    if (filtered.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: c.text }]}>MeChat</Text>
          <Text style={[styles.stateText, { color: c.textSecondary }]}>
            {search
              ? "No conversations match your search."
              : "No conversations yet.\nGo to People to start chatting."}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <ChatRow
            conversation={item}
            colors={c}
            onPress={() => navigation.navigate("Chat", { user: buildUserParam(item) })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadConversations(); }}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={c.statusBar} backgroundColor={c.header} />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: c.header, borderBottomColor: c.headerBorder, opacity: headerOpacity },
          ]}
        >
          <Text style={[styles.headerTitle, { color: c.text }]}>MeChat</Text>
        </Animated.View>

        {/* Search */}
        <View style={[styles.searchWrapper, { backgroundColor: c.header }]}>
          <View style={[styles.searchBar, { backgroundColor: c.search }]}>
            <Feather name="search" size={16} color={c.searchIcon} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: c.searchText }]}
              placeholder="Search"
              placeholderTextColor={c.searchPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search chats"
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

        {/* List */}
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      </SafeAreaView>

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 72,
  },
  avatarWrapper: { marginRight: 12 },
  chatContent: { flex: 1 },
  chatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  chatName: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  chatTime: { fontSize: 12 },
  chatPreview: { fontSize: 14, lineHeight: 20 },
  rowDivider: {
    position: "absolute",
    bottom: 0,
    left: 80,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },

  centerState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  stateTitle: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  stateText: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },

  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 72,
  },
  skeletonAvatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  skeletonContent: { flex: 1 },
  skeletonName: { height: 14, borderRadius: 7, width: "55%", marginBottom: 8 },
  skeletonMsg: { height: 12, borderRadius: 6, width: "80%" },
});
