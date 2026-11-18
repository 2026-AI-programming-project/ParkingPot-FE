import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Glyph, colors } from "../../components/ui";
import { useApp } from "../../context/AppContext";

const routes = [
  ["home", "홈", "home"],
  ["search", "검색", "search"],
  ["favorites", "즐겨찾기", "heart"],
  ["profile", "MY", "user"],
];

export default function TabsLayout() {
  const { token } = useApp();
  if (!token) return <Redirect href="/"/>;
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.green,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { height: 62, paddingTop: 5, paddingBottom: 5, borderTopColor: colors.border, backgroundColor: colors.white },
    tabBarLabelStyle: { fontSize: 10 },
  }}>
    {routes.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color, focused }) => <Glyph name={icon} color={color} filled={icon === "heart" && focused}/> }}/>) }
  </Tabs>;
}
