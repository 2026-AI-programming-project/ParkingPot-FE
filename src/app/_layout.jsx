import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../context/AppContext";

export default function RootLayout() {
  return <SafeAreaProvider><AppProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f2f5f3" } }}><Stack.Screen name="index"/><Stack.Screen name="(tabs)"/><Stack.Screen name="parking/[id]" options={{ presentation: "card" }}/></Stack></AppProvider></SafeAreaProvider>;
}
