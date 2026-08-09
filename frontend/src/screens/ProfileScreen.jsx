import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  BackHandler,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../theme/ThemeContext";
import { fetchMyProfile, updateMyProfile } from "../services/userService";
import Avatar from "../components/Avatar";

const BIO_MAX = 160;

function ProfileSkeleton({ colors }) {
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
  const bg = colors.skeletonBase;
  return (
    <Animated.View style={{ opacity, paddingHorizontal: 24, paddingTop: 32 }}>
      <View style={{ alignItems: "center", marginBottom: 36 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: bg }} />
        <View style={{ width: 120, height: 14, borderRadius: 7, backgroundColor: bg, marginTop: 16 }} />
      </View>
      {[1, 2].map((i) => (
        <View key={i} style={{ marginBottom: 24 }}>
          <View style={{ width: 60, height: 11, borderRadius: 6, backgroundColor: bg, marginBottom: 8 }} />
          <View style={{ width: "100%", height: 48, borderRadius: 12, backgroundColor: bg }} />
        </View>
      ))}
    </Animated.View>
  );
}

function SuccessToast({ visible }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
      <Text style={styles.toastText}>Profile saved</Text>
    </Animated.View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  error,
  colors,
  prefix,
}) {
  const c = colors;
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? c.error
    : focused
    ? c.inputBorderFocus
    : c.inputBorder;

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.fieldInputBox,
          { backgroundColor: c.inputBg, borderColor },
          multiline && styles.fieldInputBoxMulti,
        ]}
      >
        {prefix ? (
          <Text style={[styles.fieldPrefix, { color: c.textSecondary }]}>{prefix}</Text>
        ) : null}
        <TextInput
          style={[
            styles.fieldInput,
            { color: c.text },
            multiline && styles.fieldInputMulti,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          multiline={multiline}
          maxLength={maxLength}
          selectionColor={c.inputBorderFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? "top" : "center"}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {maxLength ? (
        <Text style={[styles.fieldCounter, { color: error ? c.error : c.textSecondary }]}>
          {error || `${value.length}/${maxLength}`}
        </Text>
      ) : error ? (
        <Text style={[styles.fieldCounter, { color: c.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const c = colors;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [original, setOriginal] = useState({ username: "", about: "" });
  const [username, setUsername] = useState("");
  const [about, setAbout] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [aboutError, setAboutError] = useState("");
  const [saveError, setSaveError] = useState("");

  const hasChanges =
    username.trim() !== original.username || about.trim() !== original.about;

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const profile = await fetchMyProfile();
        const uname = profile.username || "";
        const bio = profile.about || "";
        setUsername(uname);
        setAbout(bio);
        setDisplayName(uname);
        setOriginal({ username: uname, about: bio });
      } catch {
        setSaveError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Android back-button guard ───────────────────────────────────────────────
  useEffect(() => {
    const onBack = () => {
      if (hasChanges) {
        Alert.alert(
          "Discard Changes?",
          "You have unsaved changes. Are you sure you want to leave?",
          [
            { text: "Keep Editing", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
          ]
        );
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [hasChanges, navigation]);

  // ── Navigation beforeRemove guard ───────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!hasChanges) return;
      e.preventDefault();
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to leave?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, hasChanges]);

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    let valid = true;
    setUsernameError("");
    setAboutError("");

    if (!username.trim()) {
      setUsernameError("Username cannot be empty");
      valid = false;
    } else if (username.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters");
      valid = false;
    }

    if (about.length > BIO_MAX) {
      setAboutError(`Bio must be ${BIO_MAX} characters or fewer`);
      valid = false;
    }

    return valid;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!hasChanges || saving) return;
    if (!validate()) return;
    setSaveError("");
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        username: username.trim(),
        about: about.trim(),
      });

      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            ...parsed,
            username: updated.username,
            about: updated.about,
          })
        );
      }

      const newUsername = updated.username || username.trim();
      const newAbout = updated.about ?? about.trim();
      setOriginal({ username: newUsername, about: newAbout });
      setUsername(newUsername);
      setAbout(newAbout);
      setDisplayName(newUsername);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save. Please try again.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={c.statusBar} backgroundColor={c.header} />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View
          style={[
            styles.header,
            { backgroundColor: c.header, borderBottomColor: c.headerBorder },
          ]}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color={c.text} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.headerTitle, { color: c.text }]}>Edit Profile</Text>

          {/* Save icon — faded when no changes, full primary color when ready */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || saving}
            style={styles.headerSaveBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Save profile"
          >
            {saving ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <Feather
                name="check"
                size={22}
                color={c.primary}
                style={{ opacity: hasChanges ? 1 : 0.3 }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        {loading ? (
          <ProfileSkeleton colors={c} />
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Avatar (display only) ──────────────────────────────────── */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarRing}>
                  <Avatar name={displayName} size={84} />
                </View>
                <Text style={[styles.avatarName, { color: c.text }]}>
                  {displayName}
                </Text>
              </View>

              {/* ── Fields ────────────────────────────────────────────────── */}
              <View style={styles.fieldsSection}>
                <EditField
                  label="Username"
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    setUsernameError("");
                  }}
                  placeholder="Enter username"
                  error={usernameError}
                  colors={c}
                  prefix="@"
                />

                <EditField
                  label="Bio"
                  value={about}
                  onChangeText={(val) => {
                    setAbout(val);
                    setAboutError("");
                  }}
                  placeholder="Write something about yourself…"
                  multiline
                  maxLength={BIO_MAX}
                  error={aboutError}
                  colors={c}
                />

                {/* API-level save error */}
                {saveError ? (
                  <View style={[styles.saveErrorBox, { backgroundColor: c.error + "18" }]}>
                    <Feather name="alert-circle" size={14} color={c.error} style={{ marginRight: 6 }} />
                    <Text style={[styles.saveErrorText, { color: c.error }]}>{saveError}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      {/* ── Success toast ───────────────────────────────────────────────────── */}
      <SuccessToast visible={showToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerSaveBtn: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 20,
  },

  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarName: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  fieldsSection: { marginBottom: 8 },
  fieldWrapper: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  fieldInputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  fieldInputBoxMulti: {
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 96,
  },
  fieldPrefix: {
    fontSize: 15,
    marginRight: 4,
    lineHeight: 20,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    lineHeight: 20,
  },
  fieldInputMulti: {
    minHeight: 72,
  },
  fieldCounter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },

  saveErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  saveErrorText: { fontSize: 13, flex: 1 },

  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
