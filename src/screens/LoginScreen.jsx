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
import { auth } from "../firebase/firebaseConfig";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";


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
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      navigation.replace("Home");

    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignup = async () => {
    // Validation
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
      // Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: name,
      });

      // Create Firestore document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email.trim(),
        profilePicture: "",
        status: "offline",
        about: "Hey there! I'm using MeChat.",
        createdAt: serverTimestamp(),
      });

      alert("Account Created Successfully!");

      // Navigate to Home
      navigation.replace("Home");

    } catch (error) {
      console.log(error.code);
      console.log(error.message);

      switch (error.code) {
        case "auth/email-already-in-use":
          alert("This email is already registered.");
          break;

        case "auth/invalid-email":
          alert("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          alert("Password should be at least 6 characters.");
          break;

        default:
          alert(error.message);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">

        {/* Illustration */}
        <Image
          source={require("../../assets/images/login.png")}
          className="w-72 h-72 self-center"
          resizeMode="contain"
        />

        {/* Heading */}
        <Text className="text-4xl font-bold text-center text-gray-900">
          {isLogin ? "Login" : "Sign Up"}
        </Text>

        <Text className="text-center text-gray-500 mt-2 mb-8">
          {isLogin
            ? "Welcome back!"
            : "Create your MeChat account"}
        </Text>

        {/* Name Field */}
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

        {/* Email */}
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

        {/* Password */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-14 mb-4">
          <Feather name="lock" size={20} color="#6B7280" />

          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            className="flex-1 ml-3 text-base"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

                {/* Confirm Password (Sign Up only) */}
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

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Feather
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Forgot Password */}
        {isLogin && (
          <TouchableOpacity className="self-end mb-6">
            <Text className="text-blue-600 font-medium">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        )}

        {/* Main Button */}
        <TouchableOpacity
          onPress={isLogin ? handleLogin : handleSignup}
          className="bg-blue-600 rounded-xl h-14 justify-center items-center shadow-lg"
        >
          <Text className="text-white text-lg font-bold">
            {isLogin ? "Login" : "Create Account"}
          </Text>
        </TouchableOpacity>

        

        {/* Switch between Login and Sign Up */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </Text>

          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);

              // Clear the form when switching
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


