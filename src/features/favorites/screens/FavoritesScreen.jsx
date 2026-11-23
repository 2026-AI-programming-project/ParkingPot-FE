import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, ParkingCard, ui } from "../../../components/ui";
import { useFavorites } from "../../../context/FavoritesContext";

export default function FavoritesScreen() {
  const { favorites, loadFavorites, toggleFavorite } = useFavorites();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadFavorites();
    } catch (cause) {
      setError(cause?.message || "즐겨찾기를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [loadFavorites]);

  useEffect(() => {
    // Load remote favorites once this route is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={ui.page} edges={["top"]}>
      <BrandHeader />
      <View style={ui.scroll}>
        <Text style={ui.eyebrow}>내 주차장</Text>
        <Text style={ui.title}>즐겨찾기</Text>
        <Text style={ui.subtitle}>저장한 주차장을 빠르게 확인하세요.</Text>
        {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item, index) => String(item.id ?? item.parking_id ?? index)}
        contentContainerStyle={ui.list}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          <Text style={ui.empty}>
            {error || (loading ? "불러오는 중입니다…" : "저장한 주차장이 없습니다. 주차장 카드의 하트를 눌러 추가하세요.")}
          </Text>
        }
        renderItem={({ item }) => {
          const id = item.id ?? item.parking_id;
          return (
            <ParkingCard
              item={item}
              saved
              onOpen={() => router.push({ pathname: "/parking/[id]", params: { id } })}
              onToggle={toggleFavorite}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
