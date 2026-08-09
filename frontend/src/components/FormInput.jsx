import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

/**
 * FormInput — Reusable labeled input with focus/error states.
 * Theme-aware: reads from ThemeContext automatically.
 *
 * Props:
 *   label         {string}
 *   error         {string}
 *   rightElement  {React.Node}
 *   containerStyle
 *   isDark        {bool}    (optional, forwarded from parent for legacy compat)
 *   colors        {object}  (optional, forwarded from parent for legacy compat)
 *   ...rest       TextInput props
 */
const FormInput = React.forwardRef(function FormInput(
  { label, error, rightElement, containerStyle, isDark: _isDark, colors: _colors, ...rest },
  ref
) {
  const theme = useTheme();
  // Prefer props (parent may forward theme) over context for flexibility
  const c = _colors || theme.colors;

  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    rest.onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    rest.onBlur?.();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? c.error || "#EF4444" : c.inputBorder || "#E5E7EB",
      error ? c.error || "#EF4444" : c.inputBorderFocus || "#168CFF",
    ],
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: c.text || "#374151" }]}>{label}</Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: c.inputBg || "#FFFFFF",
          },
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, { color: c.inputText || "#111827" }]}
          placeholderTextColor={c.placeholder || "#9CA3AF"}
          selectionColor={c.primary || "#168CFF"}
          {...rest}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightElement ? (
          <View style={styles.rightSlot}>{rightElement}</View>
        ) : null}
      </Animated.View>

      {error ? (
        <Text style={[styles.errorText, { color: c.error || "#EF4444" }]}>{error}</Text>
      ) : null}
    </View>
  );
});

export default FormInput;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, letterSpacing: 0.1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  rightSlot: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 44,
  },
  errorText: { fontSize: 12, marginTop: 5, marginLeft: 2 },
});
