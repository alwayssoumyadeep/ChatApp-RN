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
import { registerUser } from "../services/authService";
import { useTheme } from "../theme/ThemeContext";

// ─── Constants ───────────────────────────────────────────────────────────────

const BLUE = "#168CFF";
const BLUE_DARK = "#0F6FCC";
const BG = "#F7F9FC";
const DISABLED_BLUE = "#93C5FD";
const SECONDARY = "#6B7280";
const BORDER = "#E5E7EB";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password) {
  if (!password) return null;
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (len < 8) return "weak";
  if (hasUpper && hasNumber) return "strong";
  if (hasUpper || hasNumber) return "moderate";
  return "moderate";
}

const STRENGTH_CONFIG = {
  weak: { label: "Weak", color: "#EF4444", width: "33%" },
  moderate: { label: "Moderate", color: "#F59E0B", width: "66%" },
  strong: { label: "Strong", color: "#22C55E", width: "100%" },
};

function parseServerError(error) {
  if (!error?.response) {
    return "Please check your internet connection and try again.";
  }
  const status = error.response.status;
  const message = error.response?.data?.message;

  if (status === 409 || (message && message.toLowerCase().includes("already exists"))) {
    return "An account with this email or username already exists.";
  }
  if (status === 400) {
    return message || "Please check the information you entered.";
  }
  if (status >= 500) {
    return "Something went wrong on our end. Please try again shortly.";
  }
  return message || "Registration failed. Please try again.";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignupScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const c = colors;
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Touched state — only show errors after field blur
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Refs for focus chaining
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  // Entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(24)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [logoAnim, formAnim, formOpacity]);

  // ─── Validation ───────────────────────────────────────────────────────────

  const errors = {
    name:
      touched.name && !name.trim()
        ? "Full name is required"
        : touched.name && name.trim().length < 2
        ? "Name must be at least 2 characters"
        : "",
    email:
      touched.email && !email.trim()
        ? "Email is required"
        : touched.email && !EMAIL_REGEX.test(email.trim())
        ? "Enter a valid email address"
        : "",
    password:
      touched.password && !password
        ? "Password is required"
        : touched.password && password.length < 8
        ? "Password must be at least 8 characters"
        : "",
    confirmPassword:
      touched.confirmPassword && !confirmPassword
        ? "Please confirm your password"
        : touched.confirmPassword && confirmPassword !== password
        ? "Passwords do not match"
        : "",
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordReqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const markTouched = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const isFormValid =
    name.trim().length >= 2 &&
    EMAIL_REGEX.test(email.trim()) &&
    password.length >= 8 &&
    confirmPassword === password;

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Mark all fields touched to surface any hidden errors
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    setServerError("");

    if (!isFormValid) return;

    setLoading(true);
    try {
      await registerUser(name.trim(), email.trim(), password);
      navigation.replace("Home");
    } catch (err) {
      setServerError(parseServerError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── Password Strength Bar ────────────────────────────────────────────────

  const StrengthBar = () => {
    if (!password) return null;
    const cfg = STRENGTH_CONFIG[passwordStrength] || STRENGTH_CONFIG.weak;
    return (
      <View style={styles.strengthWrapper}>
        <View style={styles.strengthTrack}>
          <View
            style={[
              styles.strengthFill,
              { width: cfg.width, backgroundColor: cfg.color },
            ]}
          />
        </View>
        <Text style={[styles.strengthLabel, { color: cfg.color }]}>
          {cfg.label}
        </Text>
      </View>
    );
  };

  // ─── Password Requirements ────────────────────────────────────────────────

  const Requirement = ({ met, label }) => (
    <View style={styles.reqRow}>
      <Feather
        name={met ? "check-circle" : "circle"}
        size={12}
        color={met ? "#22C55E" : "#9CA3AF"}
      />
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
    </View>
  );



  // ─── Button ───────────────────────────────────────────────────────────────

  const buttonDisabled = !isFormValid || loading;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (buttonDisabled) return;
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

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
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.brand, { opacity: logoAnim }]}>
          <Image
            source={require("../../assets/mechat_logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="MeChat logo"
          />
          <Text style={[styles.heading, { color: c.text }]}>Create your account</Text>
          <Text style={[styles.subheading, { color: c.textSecondary }]}>
            Join MeChat and start connecting.
          </Text>
        </Animated.View>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: formOpacity,
              transform: [{ translateY: formAnim }],
            },
          ]}
        >
          {/* Full Name */}
          <FormInput
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            onBlur={() => markTouched("name")}
            error={errors.name}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            accessibilityLabel="Full name input"
          />

          {/* Email */}
          <FormInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => markTouched("email")}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            ref={emailRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Email input"
          />

          {/* Password */}
          <FormInput
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => markTouched("password")}
            error={errors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            ref={passwordRef}
            onSubmitEditing={() => confirmRef.current?.focus()}
            accessibilityLabel="Password input"
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={SECONDARY}
                />
              </TouchableOpacity>
            }
          />

          {/* Password strength + requirements */}
          {password.length > 0 && (
            <View style={styles.passwordMeta}>
              <StrengthBar />
              <View style={styles.reqs}>
                <Requirement met={passwordReqs.length} label="8+ characters" />
                <Requirement met={passwordReqs.upper} label="One uppercase letter" />
                <Requirement met={passwordReqs.number} label="One number" />
              </View>
            </View>
          )}

          {/* Confirm Password */}
          <FormInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={() => markTouched("confirmPassword")}
            error={errors.confirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            ref={confirmRef}
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Confirm password input"
            containerStyle={styles.confirmInput}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((v) => !v)}
                accessibilityLabel={
                  showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={18}
                  color={SECONDARY}
                />
              </TouchableOpacity>
            }
          />



          {/* Server Error */}
          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* CTA */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              onPress={handleSubmit}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={buttonDisabled}
              activeOpacity={0.9}
              style={[
                styles.button,
                buttonDisabled && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: buttonDisabled }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginPrompt, { color: c.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={[styles.loginLink, { color: c.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 100,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Brand
  brand: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: SECONDARY,
    textAlign: "center",
    marginTop: 6,
  },

  // Form
  form: {
    flex: 1,
  },

  // Password meta
  passwordMeta: {
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  strengthWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "600",
    minWidth: 52,
    textAlign: "right",
  },
  reqs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reqText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  reqTextMet: {
    color: "#22C55E",
  },

  confirmInput: {
    marginTop: 2,
  },

  // Server error
  serverErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  serverErrorText: {
    flex: 1,
    fontSize: 13,
    color: "#EF4444",
    lineHeight: 18,
  },

  // Button
  button: {
    height: 54,
    backgroundColor: BLUE,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: DISABLED_BLUE,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Login link
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginPrompt: {
    fontSize: 14,
    color: SECONDARY,
  },
  loginLink: {
    fontSize: 14,
    color: BLUE,
    fontWeight: "700",
  },
});
