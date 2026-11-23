import React from "react";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glyph, colors } from "../../components/ui";
import { useApp } from "../../context/AppContext";
const routes = [["home", "Home", "home"], ["search", "Search", "search"], ["favorites", "Saved", "heart"], ["profile", "Profile", "user"]];
export default function TabsLayout() {
  const { token, ready } = useApp(); const insets = useSafeAreaInsets();
  if (!ready) return null;
  if (!token) return <Redirect href="/" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 62 + insets.bottom, paddingTop: 5, paddingBottom: Math.max(insets.bottom, 5), borderTopColor: colors.border, backgroundColor: colors.white }, tabBarLabelStyle: { fontSize: 10 } }}>
    {routes.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color, focused }) => <Glyph name={icon} color={color} filled={icon === "heart" && focused} /> }} />)}
  </Tabs>;
}
