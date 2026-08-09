import React, { useRef } from "react";
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../theme/ThemeContext";

/**
 * ThemeToggleButton
 *
 * Shows a sun/moon icon. When pressed:
 * 1. A circular overlay expands from the button position (circular reveal).
 * 2. Theme switches.
 * 3. Overlay fades out.
 *
 * Props:
 *   style  — optional container style
 */
export default function ThemeToggleButton({ style }) {
  const { isDark, setMode, colors } = useTheme();
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Animate overlay
    overlayAnim.setValue(0);
    overlayOpacity.setValue(0.96);

    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(320),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setMode(isDark ? "light" : "dark");
    });
  };

  const overlayScale = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 40],
  });

  const overlayColor = isDark ? "#FFFFFF" : "#111111";

  return (
    <View style={[styles.container, style]}>
      {/* Circular reveal overlay — absolute, clipped by parent */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
            transform: [{ scale: overlayScale }],
          },
        ]}
      />

      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather
          name={isDark ? "sun" : "moon"}
          size={20}
          color={colors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
