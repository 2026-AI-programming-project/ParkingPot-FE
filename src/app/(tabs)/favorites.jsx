import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, ParkingCard, ui } from "../../components/ui";
import { useApp } from "../../context/AppContext";

export default function FavoritesScreen() {
  const { favorites, loadFavorites, toggleFavorite } = useApp();
  const [error, setError] = useState("");
  const refresh = useCallback(async () => { try { await loadFavorites(); setError(""); } catch (e) { setError(e.message); } }, [loadFavorites]);
  // Route mount triggers the one-time remote favorites load.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);
  return <SafeAreaView style={ui.page} edges={["top"]}>
    <BrandHeader/>
    <View style={ui.scroll}><Text style={ui.eyebrow}>나만의 주차장</Text><Text style={ui.title}>즐겨찾기</Text><Text style={ui.subtitle}>자주 찾는 주차장을 빠르게 확인하세요.</Text>{!!error && <Text style={ui.error}>{error}</Text>}</View>
    <FlatList data={favorites} keyExtractor={(item, index) => String(item.id ?? item.parking_id ?? index)} contentContainerStyle={ui.list} onRefresh={refresh} refreshing={false} ListEmptyComponent={<Text style={ui.empty}>{error || "저장한 주차장이 없어요. 주차장 카드의 하트를 눌러 추가해 주세요."}</Text>} renderItem={({ item }) => <ParkingCard item={item} saved onOpen={() => router.push({ pathname: "/parking/[id]", params: { id: item.id ?? item.parking_id } })} onToggle={toggleFavorite}/>}/>
  </SafeAreaView>;
}
