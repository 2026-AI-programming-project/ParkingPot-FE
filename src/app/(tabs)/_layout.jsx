import React from "react";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glyph, colors } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const TAB_ROUTES = [
  { name: "home", title: "홈", icon: "home" },
  { name: "search", title: "검색", icon: "search" },
  { name: "favorites", title: "저장", icon: "heart" },
  { name: "profile", title: "내 정보", icon: "user" },
];

export default function TabsLayout() {
  const { token, ready } = useAuth();
  const insets = useSafeAreaInsets();

  if (!ready) return null;
  if (!token) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingTop: 5,
          paddingBottom: Math.max(insets.bottom, 5),
          borderTopColor: colors.border,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      {TAB_ROUTES.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <Glyph name={icon} color={color} filled={icon === "heart" && focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
