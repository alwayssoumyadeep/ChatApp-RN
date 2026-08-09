import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";

export default function SplashScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const bgScale = useRef(new Animated.Value(0.01)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");
      return !!token;
    };

    Animated.sequence([
      Animated.parallel([
        Animated.timing(bgScale, {
          toValue: 30,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          delay: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(500),
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      const hasToken = await checkLogin();
      navigation.replace(hasToken ? "Home" : "Login");
    });
  }, [bgScale, bgOpacity, logoOpacity, navigation]);

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#111111" : "#FFFFFF" }]}>
      <StatusBar barStyle="light-content" backgroundColor="#168CFF" />

      {/* Expanding blue background circle */}
      <Animated.View
        style={[
          styles.bgCircle,
          {
            opacity: bgOpacity,
            transform: [{ scale: bgScale }],
          },
        ]}
      />

      {/* Logo centred on top */}
      <Animated.Image
        source={require("../../assets/mechat_logo.png")}
        style={[styles.logo, { opacity: logoOpacity }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bgCircle: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#168CFF",
  },
  logo: {
    width: 100,
    height: 100,
    zIndex: 10,
  },
});