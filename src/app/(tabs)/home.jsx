import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BrandHeader, ParkingCard, colors, ui } from "../../components/ui";
import KakaoMap from "../../components/KakaoMap";
import { useApp } from "../../context/AppContext";
import { api, listFrom } from "../../lib/api";

export default function HomeScreen() {
  const { favorites, toggleFavorite } = useApp();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [center, setCenter] = useState({ latitude: 37.5665, longitude: 126.978 });
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      let coords = { latitude: 37.5665, longitude: 126.978 };
      if (permission.status === "granted") {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { latitude: current.coords.latitude, longitude: current.coords.longitude };
        setCenter(coords);
      }
      const params = new URLSearchParams({ lat: String(coords.latitude), lon: String(coords.longitude), radius_m: "5000", sort: "distance", page: "1", page_size: "20" });
      setLots(listFrom(await api(`/parking-lots?${params}`), ["parking_lots"]));
      if (permission.status !== "granted") setError("Location access is off. Showing parking near Seoul instead.");
    } catch (e) { setError(e?.message || "Could not load parking lots."); setLots([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // Loading data is an external side effect; defer it until after mount.
    const task = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(task);
  }, [load]);
  const saved = new Set(favorites.map((item) => String(item.id ?? item.parking_id)));
  return <SafeAreaView style={ui.page} edges={["top"]}>
    <BrandHeader />
    <View style={styles.filters}><Text style={styles.active}>Nearby</Text><Text style={styles.filter}>Price</Text><Text style={styles.filter}>Accessible</Text></View>
    <View style={styles.map} accessibilityLabel="Parking map"><KakaoMap latitude={center.latitude} longitude={center.longitude} markers={lots} onSelect={(id) => router.push({ pathname: "/parking/[id]", params: { id } })} /></View>
    <View style={styles.heading}><View><Text style={styles.title}>Nearby parking</Text><Text style={styles.subtitle}>{lots.length} results</Text></View><Text style={styles.live}>Live information</Text></View>
    {!!error && <Text style={ui.error}>{error}</Text>}
    {loading && lots.length === 0 ? <ActivityIndicator color={colors.green} style={{ marginTop: 22 }} /> : <FlatList data={lots} keyExtractor={(item, index) => String(item.id ?? item.parking_id ?? index)} contentContainerStyle={ui.list} refreshing={loading} onRefresh={load} ListEmptyComponent={<Text style={ui.empty}>{error || "No parking lots found."}</Text>} renderItem={({ item }) => <ParkingCard item={item} saved={saved.has(String(item.id ?? item.parking_id))} onOpen={() => router.push({ pathname: "/parking/[id]", params: { id: item.id ?? item.parking_id } })} onToggle={toggleFavorite} />} />}
  </SafeAreaView>;
}
const styles = { filters: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, backgroundColor: colors.white }, active: { color: colors.white, backgroundColor: colors.green, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, fontWeight: "700" }, filter: { color: "#475a51", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 7, fontSize: 11 }, map: { height: 220, backgroundColor: "#dcebe4", overflow: "hidden" }, heading: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: colors.dark, fontWeight: "800", fontSize: 17 }, subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 }, live: { color: colors.green, fontSize: 10, fontWeight: "700" } };


