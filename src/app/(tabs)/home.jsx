import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, ParkingCard, colors, ui } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api, listFrom } from "../../lib/api";
import { router } from "expo-router";

export default function HomeScreen() {
  const { favorites, toggleFavorite } = useApp();
  const [lots, setLots] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const saved = new Set(favorites.map((item) => String(item.id ?? item.parking_id)));
  const load = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("주변 주차장을 검색하려면 위치 권한을 허용해 주세요.");
      const current = await Location.getCurrentPositionAsync({});
      const params = new URLSearchParams({ lat: String(current.coords.latitude), lon: String(current.coords.longitude), radius_m: "5000", sort: "distance", page: "1", page_size: "20" });
      setLots(listFrom(await api(`/parking-lots?${params}`), ["parking_lots", "items", "results"]));
    } catch (e) { setError(e.message); setLots([]); }
    finally { setLoading(false); }
  }, []);
  // Route mount triggers the one-time nearby parking request.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  return <SafeAreaView style={ui.page} edges={["top"]}>
    <BrandHeader/>
    <View style={styles.filters}><Text style={styles.filterActive}>거리순</Text><Text style={styles.filter}>요금</Text><Text style={styles.filter}>장애인 주차</Text></View>
    <View style={styles.map}><Text style={styles.mapText}>현재 위치 주변 주차장</Text></View>
    <View style={styles.heading}><View><Text style={styles.title}>주변 주차장</Text><Text style={styles.subtitle}>검색 결과 {lots.length}곳</Text></View><Text style={styles.live}>● 실시간</Text></View>
    {!!error && <Text style={ui.error}>{error}</Text>}
    {loading && lots.length === 0 ? <ActivityIndicator color={colors.green} style={{ marginTop: 22 }}/> : <FlatList data={lots} keyExtractor={(item, index) => String(item.id ?? index)} contentContainerStyle={ui.list} refreshing={loading} onRefresh={load} ListEmptyComponent={<Text style={ui.empty}>{error || "주변 주차장 검색 결과가 없습니다."}</Text>} renderItem={({ item }) => <ParkingCard item={item} saved={saved.has(String(item.id))} onOpen={() => router.push({ pathname: "/parking/[id]", params: { id: item.id } })} onToggle={toggleFavorite}/>}/>}
  </SafeAreaView>;
}

const styles = {
  filters: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, backgroundColor: colors.white },
  filterActive: { color: colors.white, backgroundColor: colors.green, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, fontWeight: "700" },
  filter: { color: "#475a51", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 7, fontSize: 11 },
  map: { height: 148, backgroundColor: "#eaf0ed", alignItems: "center", justifyContent: "center" }, mapText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  heading: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: colors.dark, fontWeight: "800", fontSize: 17 }, subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 }, live: { color: colors.green, fontSize: 10, fontWeight: "700" },
};
