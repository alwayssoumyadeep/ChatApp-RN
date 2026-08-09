import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNavigation from "../components/BottomNavigation";
import { useTheme } from "../theme/ThemeContext";
import socket from "../services/socket";
import { CommonActions } from "@react-navigation/native";
import { teardownAppStateHandler } from "../services/authService";

// ─── Appearance options ───────────────────────────────────────────────────────
const APPEARANCE_OPTIONS = [
  { key: "system", label: "Device Default", icon: "smartphone" },
  { key: "light", label: "Light Mode", icon: "sun" },
  { key: "dark", label: "Dark Mode", icon: "moon" },
];

// ─── Settings row ─────────────────────────────────────────────────────────────
function SettingsRow({ icon, label, onPress, colors, rightContent, iconBg, labelColor }) {
  const c = colors;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { backgroundColor: c.settingsCell }]}
      activeOpacity={0.65}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg || c.settingsIcon }]}>
        <Feather name={icon} size={15} color="#FFFFFF" />
      </View>
      <Text style={[styles.rowLabel, { color: labelColor || c.settingsLabel }]}>{label}</Text>
      <View style={styles.rowRight}>
        {rightContent || <Feather name="chevron-right" size={16} color={c.settingsValue} />}
      </View>
    </TouchableOpacity>
  );
}

// ─── Sign Out confirmation modal (Telegram-style) ────────────────────────────
function SignOutModal({ visible, onConfirm, onCancel, colors }) {
  const c = colors;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: c.settingsCell }]}>
          {/* Title */}
          <Text style={[styles.modalTitle, { color: c.text }]}>Sign Out</Text>
          {/* Message */}
          <Text style={[styles.modalMessage, { color: c.textSecondary }]}>
            Are you sure you want to sign out of MeChat?
          </Text>
          {/* Divider */}
          <View style={[styles.modalDivider, { backgroundColor: c.settingsSeparator }]} />
          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.modalBtn, styles.modalBtnLeft, { borderColor: c.settingsSeparator }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalBtnText, { color: c.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.modalBtn, styles.modalBtnRight]}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalBtnText, { color: "#FF3B30" }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const { colors, mode, setMode } = useTheme();
  const c = colors;

  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleTabPress = (tab) => {
    if (tab === "Chats") navigation.navigate("Home");
    if (tab === "People") navigation.navigate("People");
  };

  const handleSignOut = async () => {
    setShowSignOutModal(false);
    // Tear down AppState listener before disconnecting
    teardownAppStateHandler();
    try { socket.disconnect(); } catch {}
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
    } catch {}
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.settingsBg }]}>
      <StatusBar barStyle={c.statusBar} backgroundColor={c.header} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: c.header, borderBottomColor: c.headerBorder },
          ]}
        >
          <Text style={[styles.headerTitle, { color: c.text }]}>Settings</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          {/* ── Account ────────────────────────────────────────────────────── */}
          <Text style={[styles.sectionHeader, { color: c.settingsValue }]}>ACCOUNT</Text>
          <View style={[styles.section, { borderColor: c.settingsSeparator }]}>
            <SettingsRow
              icon="user"
              label="Edit Profile"
              colors={c}
              onPress={() => navigation.navigate("Profile")}
            />
          </View>

          {/* ── Appearance ─────────────────────────────────────────────────── */}
          <Text style={[styles.sectionHeader, { color: c.settingsValue }]}>APPEARANCE</Text>
          <View style={[styles.section, { borderColor: c.settingsSeparator }]}>
            {APPEARANCE_OPTIONS.map((option, idx) => {
              const isSelected = mode === option.key;
              return (
                <View key={option.key}>
                  <TouchableOpacity
                    onPress={() => setMode(option.key)}
                    style={[styles.row, { backgroundColor: c.settingsCell }]}
                    activeOpacity={0.65}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        { backgroundColor: isSelected ? c.settingsIcon : c.settingsValue },
                      ]}
                    >
                      <Feather name={option.icon} size={15} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.rowLabel, { color: c.settingsLabel }]}>
                      {option.label}
                    </Text>
                    <View style={styles.rowRight}>
                      {isSelected && (
                        <Feather name="check" size={18} color={c.settingsIcon} />
                      )}
                    </View>
                  </TouchableOpacity>
                  {idx < APPEARANCE_OPTIONS.length - 1 && (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: c.settingsSeparator, marginLeft: 56 },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* ── Sign Out ───────────────────────────────────────────────────── */}
          <Text style={[styles.sectionHeader, { color: c.settingsValue }]}>SESSION</Text>
          <View style={[styles.section, { borderColor: c.settingsSeparator }]}>
            <SettingsRow
              icon="log-out"
              label="Sign Out"
              colors={c}
              iconBg="#FF3B30"
              labelColor="#FF3B30"
              onPress={() => setShowSignOutModal(true)}
              rightContent={<View />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNavigation activeTab="Settings" onTabPress={handleTabPress} />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutModal(false)}
        colors={c}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowLabel: { flex: 1, fontSize: 16 },
  rowRight: { flexDirection: "row", alignItems: "center" },
  separator: { height: StyleSheet.hairlineWidth },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalDivider: { height: StyleSheet.hairlineWidth },
  modalActions: {
    flexDirection: "row",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnLeft: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  modalBtnRight: {},
  modalBtnText: { fontSize: 16, fontWeight: "600" },
});
