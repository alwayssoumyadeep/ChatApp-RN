import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Feather from "react-native-vector-icons/Feather";

import FormInput from "../components/FormInput";
import ThemeToggleButton from "../components/ThemeToggleButton";
import { loginUser } from "../services/authService";
import { useTheme } from "../theme/ThemeContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseServerError(error) {
  if (!error?.response) {
    return "Unable to connect. Check your internet connection.";
  }
  const status = error.response.status;
  const msg = error.response?.data?.message;
  if (status === 400 || status === 401) return "Incorrect email or password.";
  if (status >= 500) return "Something went wrong. Please try again.";
  return msg || "Sign in failed. Please try again.";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const passwordRef = useRef(null);

  // Entrance animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(-10)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(logoTranslate, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(contentTranslate, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoOpacity, logoTranslate, contentOpacity, contentTranslate]);

  // Validation
  const errors = {
    email:
      touched.email && !email.trim()
        ? "Email is required"
        : touched.email && !EMAIL_REGEX.test(email.trim())
        ? "Enter a valid email address"
        : "",
    password: touched.password && !password ? "Password is required" : "",
  };

  const markTouched = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const isFormValid = EMAIL_REGEX.test(email.trim()) && password.length > 0;
  const buttonDisabled = !isFormValid || loading;

  // Submit
  const handleSignIn = async () => {
    setTouched({ email: true, password: true });
    setServerError("");
    if (!isFormValid) return;
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      navigation.replace("Home");
    } catch (err) {
      setServerError(parseServerError(err));
    } finally {
      setLoading(false);
    }
  };

  // Button press animation
  const btnScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    if (buttonDisabled) return;
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  };

  const c = colors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={["top", "bottom"]}>
      <StatusBar barStyle={c.statusBar} backgroundColor={c.bg} />

      {/* Dark mode toggle — top right */}
      <View style={styles.topBar}>
        <ThemeToggleButton />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={Platform.OS === "android" ? 24 : 0}
      >
        {/* Brand */}
        <Animated.View
          style={[
            styles.brand,
            { opacity: logoOpacity, transform: [{ translateY: logoTranslate }] },
          ]}
        >
          <Image
            source={require("../../assets/mechat_logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="MeChat logo"
          />
          <Text style={[styles.heading, { color: c.text }]}>Welcome to MeChat</Text>
          <Text style={[styles.subheading, { color: c.textSecondary }]}>
            Sign in to continue messaging.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.form,
            { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] },
          ]}
        >
          <FormInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(v) => { setEmail(v); if (serverError) setServerError(""); }}
            onBlur={() => markTouched("email")}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Email address"
            isDark={isDark}
            colors={c}
          />

          <FormInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(v) => { setPassword(v); if (serverError) setServerError(""); }}
            onBlur={() => markTouched("password")}
            error={errors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            ref={passwordRef}
            onSubmitEditing={handleSignIn}
            accessibilityLabel="Password"
            isDark={isDark}
            colors={c}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={c.textSecondary} />
              </TouchableOpacity>
            }
          />

          {/* Server error */}
          {serverError ? (
            <View style={[styles.errorBanner, { backgroundColor: isDark ? "#2D1A1A" : "#FFF5F5", borderColor: isDark ? "#5C2929" : "#FFCDD2" }]}>
              <Feather name="alert-circle" size={14} color={c.error} />
              <Text style={[styles.errorBannerText, { color: c.error }]}>{serverError}</Text>
            </View>
          ) : null}

          {/* Sign in button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              onPress={handleSignIn}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={buttonDisabled}
              activeOpacity={0.9}
              style={[styles.button, buttonDisabled && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: buttonDisabled }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Sign up link */}
          <View style={styles.signupRow}>
            <Text style={[styles.signupPrompt, { color: c.textSecondary }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Signup")}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={[styles.signupLink, { color: c.primary }]}>Create account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 100,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  brand: { alignItems: "center", marginBottom: 40 },
  logo: { width: 80, height: 80, marginBottom: 24 },
  heading: { fontSize: 26, fontWeight: "700", textAlign: "center", letterSpacing: -0.3 },
  subheading: { fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 },
  form: { width: "100%" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  button: {
    height: 52,
    backgroundColor: "#168CFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A5FC8",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: { backgroundColor: "#93C5FD", shadowOpacity: 0, elevation: 0 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.1 },
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  signupPrompt: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: "700" },
});
