import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Color palettes ───────────────────────────────────────────────────────────

export const LIGHT = {
  bg: "#FFFFFF",
  header: "#FFFFFF",
  headerBorder: "#E6E8EB",
  search: "#EFEFF1",
  searchText: "#18202F",
  searchPlaceholder: "#8E8E93",
  searchIcon: "#8E8E93",
  primary: "#168CFF",
  text: "#18202F",
  textSecondary: "#707579",
  divider: "#E6E8EB",
  navBg: "#F0F1F3",
  navSelected: "#168CFF",
  navUnselected: "#707579",
  navSelectedBg: "rgba(22,140,255,0.12)",
  chatRowBg: "#FFFFFF",
  unreadBadge: "#168CFF",
  unreadText: "#FFFFFF",
  avatarBg: "#E8F4FF",
  fabBg: "#168CFF",
  fabIcon: "#FFFFFF",
  statusBar: "dark-content",
  inputBg: "#FFFFFF",
  inputBorder: "#E6E8EB",
  inputBorderFocus: "#168CFF",
  inputText: "#18202F",
  placeholder: "#9CA3AF",
  error: "#E53935",
  settingsBg: "#F2F2F7",
  settingsCell: "#FFFFFF",
  settingsSeparator: "#E6E8EB",
  settingsLabel: "#18202F",
  settingsValue: "#707579",
  settingsIcon: "#168CFF",
  skeletonBase: "#E8E8E8",
  skeletonHighlight: "#F5F5F5",
};

export const DARK = {
  bg: "#111111",
  header: "#111111",
  headerBorder: "#222224",
  search: "#2B2B2D",
  searchText: "#FFFFFF",
  searchPlaceholder: "#9B9B9F",
  searchIcon: "#9B9B9F",
  primary: "#168CFF",
  text: "#FFFFFF",
  textSecondary: "#A7A7AA",
  divider: "#222224",
  navBg: "#242426",
  navSelected: "#168CFF",
  navUnselected: "#8E8E93",
  navSelectedBg: "rgba(22,140,255,0.18)",
  chatRowBg: "#111111",
  unreadBadge: "#168CFF",
  unreadText: "#FFFFFF",
  avatarBg: "#1C3147",
  fabBg: "#168CFF",
  fabIcon: "#FFFFFF",
  statusBar: "light-content",
  inputBg: "#1E1E20",
  inputBorder: "#3A3A3C",
  inputBorderFocus: "#168CFF",
  inputText: "#FFFFFF",
  placeholder: "#636366",
  error: "#FF453A",
  settingsBg: "#1C1C1E",
  settingsCell: "#2C2C2E",
  settingsSeparator: "#3A3A3C",
  settingsLabel: "#FFFFFF",
  settingsValue: "#8E8E93",
  settingsIcon: "#168CFF",
  skeletonBase: "#2A2A2C",
  skeletonHighlight: "#3A3A3C",
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext({
  colors: LIGHT,
  isDark: false,
  mode: "system", // "light" | "dark" | "system"
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // "light" | "dark"
  const [mode, setModeState] = useState("system");

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem("themeMode").then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = async (newMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem("themeMode", newMode);
  };

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
