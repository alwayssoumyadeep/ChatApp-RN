import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));

      navigation.replace("Home");
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      alert(message);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        username: name,
        email: email.trim(),
        password,
      });

      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Account Created Successfully!");
      navigation.replace("Home");
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      alert(message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">

        <Image
          source={require("../../assets/images/login.png")}
          className="w-72 h-72 self-center"
          resizeMode="contain"
        />

        <Text className="text-4xl font-bold text-center text-gray-900">
          {isLogin ? "Login" : "Sign Up"}
        </Text>

        <Text className="text-center text-gray-500 mt-2 mb-8">
          {isLogin ? "Welcome back!" : "Create your MeChat account"}
        </Text>

        {!isLogin && (
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-14 mb-4">
            <Feather name="user" size={20} color="#6B7280" />
            <TextInput
              placeholder="Full Name"
              className="flex-1 ml-3 text-base"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-14 mb-4">
          <Feather name="mail" size={20} color="#6B7280" />
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            className="flex-1 ml-3 text-base"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-14 mb-4">
          <Feather name="lock" size={20} color="#6B7280" />
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            className="flex-1 ml-3 text-base"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {!isLogin && (
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-14 mb-4">
            <Feather name="lock" size={20} color="#6B7280" />
            <TextInput
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 ml-3 text-base"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {isLogin && (
          <TouchableOpacity className="self-end mb-6">
            <Text className="text-blue-600 font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={isLogin ? handleLogin : handleSignup}
          className="bg-blue-600 rounded-xl h-14 justify-center items-center shadow-lg"
        >
          <Text className="text-white text-lg font-bold">
            {isLogin ? "Login" : "Create Account"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);
              setName("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              setShowPassword(false);
              setShowConfirmPassword(false);
            }}
          >
            <Text className="text-blue-600 font-bold ml-2">
              {isLogin ? "Sign Up" : "Login"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}