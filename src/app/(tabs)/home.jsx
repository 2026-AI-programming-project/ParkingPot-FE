import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { initializeKakaoMapSDK, KakaoMapView } from "@react-native-kakao/map";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, ParkingCard, colors, ui } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api, listFrom } from "../../lib/api";
import { router } from "expo-router";

function coordinatesFor(item) {
  const point = item.location && !Array.isArray(item.location) ? item.location : item;
  let latitude = Number(point.latitude ?? point.lat);
  let longitude = Number(point.longitude ?? point.lon ?? point.lng);
  const coordinates = item.coordinates ?? point.coordinates;
  if ((!Number.isFinite(latitude) || !Number.isFinite(longitude)) && Array.isArray(coordinates) && coordinates.length >= 2) {
    longitude = Number(coordinates[0]);
    latitude = Number(coordinates[1]);
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

const parkingLabelStyle = {
  id: "parking-label-style",
  levels: [{ level: 0, textLines: [{ fontSize: 14, color: "#078A56", strokeColor: "#FFFFFF", strokeWidth: 3 }] }],
};
const currentLocationStyle = {
  id: "current-location-style",
  levels: [{ level: 0, textLines: [{ fontSize: 15, color: "#1687FF", strokeColor: "#FFFFFF", strokeWidth: 4 }] }],
};

export default function HomeScreen() {
  const { favorites, toggleFavorite } = useApp();
  const [lots, setLots] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [camera, setCamera] = useState(null), [mapReady, setMapReady] = useState(false), [mapError, setMapError] = useState(() => process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ? "" : "카카오 Native 앱 키가 설정되지 않았습니다. .env.local을 확인해 주세요.");
  useEffect(() => {
    let active = true;
    const nativeKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
    if (!nativeKey) return undefined;
    initializeKakaoMapSDK(nativeKey).then(
      () => { if (active) setMapReady(true); },
      (reason) => { if (active) setMapError(reason?.message || "카카오 지도를 초기화하지 못했습니다."); },
    );
    return () => { active = false; };
  }, []);
  const labels = useMemo(() => ({
    styles: [parkingLabelStyle, currentLocationStyle],
    layers: [
      { id: "parking-label-layer", zOrder: 1000, clickable: true },
      { id: "current-location-layer", zOrder: 2000, clickable: false },
    ],
    labels: [
      ...lots.flatMap((item) => {
        const coordinate = coordinatesFor(item);
        const id = item.id ?? item.parking_id;
        if (!coordinate || id == null) return [];
        return [{ id: `parking-${id}`, layerId: "parking-label-layer", styleId: parkingLabelStyle.id, coordinate, text: [{ value: item.name || item.parking_name || "주차장" }], clickable: true }];
      }),
      ...(camera ? [{ id: "current-location", layerId: "current-location-layer", styleId: currentLocationStyle.id, coordinate: { latitude: camera.latitude, longitude: camera.longitude }, text: [{ value: "● 현재 위치" }], clickable: false }] : []),
    ],
  }), [lots, camera]);
  const saved = new Set(favorites.map((item) => String(item.id ?? item.parking_id)));
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("주변 주차장을 검색하려면 위치 권한을 허용해 주세요.");
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCamera({ latitude: current.coords.latitude, longitude: current.coords.longitude, zoomLevel: 15 });
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
    <View style={styles.map}>
      {camera && mapReady ? <KakaoMapView
        style={styles.mapFill}
        initialCamera={camera}
        options={{ language: "ko", poi: { visible: true, clickable: true }, compass: { visible: true } }}
        labels={labels}
        onLabelClick={({ id }) => {
          if (!id.startsWith("parking-")) return;
          const parkingId = id.slice("parking-".length);
          router.push({ pathname: "/parking/[id]", params: { id: parkingId } });
        }}
        onError={({ message }) => setMapError(message)}
        accessibilityLabel="현재 위치 주변 카카오 주차장 지도"
      /> : <View style={styles.mapMessage}>{loading || (!mapError && !mapReady) ? <ActivityIndicator color={colors.green}/> : <Text style={styles.mapText}>{mapError || error || "위치 정보를 불러올 수 없습니다."}</Text>}</View>}
      {camera && mapReady && !lots.some(coordinatesFor) && <View style={styles.mapNotice}><Text style={styles.mapText}>표시할 주차장 위치 정보가 없습니다.</Text></View>}
      {!!mapError && camera && mapReady && <View style={styles.mapNotice}><Text style={styles.mapText}>{mapError}</Text></View>}
    </View>
    <View style={styles.heading}><View><Text style={styles.title}>주변 주차장</Text><Text style={styles.subtitle}>검색 결과 {lots.length}곳</Text></View><Text style={styles.live}>● 실시간</Text></View>
    {!!error && <Text style={ui.error}>{error}</Text>}
    {loading && lots.length === 0 ? <ActivityIndicator color={colors.green} style={{ marginTop: 22 }}/> : <FlatList data={lots} keyExtractor={(item, index) => String(item.id ?? index)} contentContainerStyle={ui.list} refreshing={loading} onRefresh={load} ListEmptyComponent={<Text style={ui.empty}>{error || "주변 주차장 검색 결과가 없습니다."}</Text>} renderItem={({ item }) => <ParkingCard item={item} saved={saved.has(String(item.id))} onOpen={() => router.push({ pathname: "/parking/[id]", params: { id: item.id } })} onToggle={toggleFavorite}/>}/>}
  </SafeAreaView>;
}

const styles = {
  filters: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, backgroundColor: colors.white },
  filterActive: { color: colors.white, backgroundColor: colors.green, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, fontWeight: "700" },
  filter: { color: "#475a51", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 7, fontSize: 11 },
  map: { height: 220, backgroundColor: "#eaf0ed" }, mapFill: { flex: 1 }, mapMessage: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 }, mapNotice: { position: "absolute", bottom: 10, alignSelf: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.white }, mapText: { color: colors.muted, fontSize: 12, fontWeight: "600", textAlign: "center" },
  heading: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: colors.dark, fontWeight: "800", fontSize: 17 }, subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 }, live: { color: colors.green, fontSize: 10, fontWeight: "700" },
};
