import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: true,
    }).start();

    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");

      setTimeout(() => {
        if (token) {
          navigation.replace("Home");
        } else {
          navigation.replace("Login");
        }
      }, 1700);
    };

    checkLogin();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Animated.Text
        style={{ opacity: fadeAnim }}
        className="text-5xl font-bold text-black tracking-widest"
      >
        MeChat
      </Animated.Text>
    </View>
  );
}