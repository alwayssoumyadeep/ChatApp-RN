import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../theme/ThemeContext";

const TABS = [
  { key: "Chats", label: "Chats", icon: "message-circle" },
  { key: "People", label: "People", icon: "users" },
  { key: "Settings", label: "Settings", icon: "settings" },
];

/**
 * BottomNavigation — Telegram-style 3-tab bar with rounded top corners.
 *
 * Props:
 *   activeTab   {string}   current tab key
 *   onTabPress  {function} (tabKey) => void
 */
export default function BottomNavigation({ activeTab, onTabPress }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const c = colors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.navBg,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          // Elevated card look with rounded top — matches Telegram reference
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        },
      ]}
    >
      <View style={styles.row}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab${isActive ? ", selected" : ""}`}
              accessibilityState={{ selected: isActive }}
            >
              {/* Selected pill */}
              {isActive && (
                <View
                  style={[
                    styles.selectedPill,
                    { backgroundColor: c.navSelectedBg },
                  ]}
                />
              )}
              <Feather
                name={tab.icon}
                size={22}
                color={isActive ? c.navSelected : c.navUnselected}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? c.navSelected : c.navUnselected,
                    fontWeight: isActive ? "700" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No top border — the rounded corners provide visual separation
  },
  row: {
    flexDirection: "row",
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
    minHeight: 52,
  },
  selectedPill: {
    position: "absolute",
    top: 0,
    left: 6,
    right: 6,
    bottom: 0,
    borderRadius: 16,
  },
  label: {
    fontSize: 11,
    marginTop: 3,
  },
});
