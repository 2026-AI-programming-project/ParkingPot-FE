import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BrandHeader, ParkingCard, colors, ui } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api, listFrom } from "../../lib/api";

export default function HomeScreen() {
  const { favorites, toggleFavorite } = useApp();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("주변 주차장을 찾으려면 위치 권한을 허용해 주세요.");
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const params = new URLSearchParams({
        lat: String(current.coords.latitude),
        lon: String(current.coords.longitude),
        radius_m: "5000",
        sort: "distance",
        page: "1",
        page_size: "20",
      });
      setLots(
        listFrom(await api(`/parking-lots?${params}`), [
          "parking_lots",
          "items",
          "results",
        ]),
      );
    } catch (e) {
      setError(e.message || "주차장 정보를 불러오지 못했습니다.");
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saved = new Set(
    favorites.map((item) => String(item.id ?? item.parking_id)),
  );

  return (
    <SafeAreaView style={ui.page} edges={["top"]}>
      <BrandHeader />
      <View style={styles.filters}>
        <Text style={styles.filterActive}>거리순</Text>
        <Text style={styles.filter}>요금</Text>
        <Text style={styles.filter}>장애인 주차</Text>
      </View>
      <View style={styles.map} accessibilityLabel="주변 주차장 지도 미리보기">
        <View style={styles.roadOne} />
        <View style={styles.roadTwo} />
        <View style={styles.parkOne}><Text style={styles.pin}>P</Text></View>
        <View style={styles.parkTwo}><Text style={styles.pin}>P</Text></View>
        <View style={styles.mapCaption}>
          <Text style={styles.mapTitle}>주변 주차장</Text>
          <Text style={styles.mapHint}>가까운 주차장을 목록에서 확인하세요</Text>
        </View>
      </View>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>주변 주차장</Text>
          <Text style={styles.subtitle}>검색 결과 {lots.length}곳</Text>
        </View>
        <Text style={styles.live}>실시간 정보</Text>
      </View>
      {!!error && <Text style={ui.error}>{error}</Text>}
      {loading && lots.length === 0 ? (
        <ActivityIndicator color={colors.green} style={{ marginTop: 22 }} />
      ) : (
        <FlatList
          data={lots}
          keyExtractor={(item, index) => String(item.id ?? index)}
          contentContainerStyle={ui.list}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            <Text style={ui.empty}>
              {error || "주차장 검색 결과가 없습니다."}
            </Text>
          }
          renderItem={({ item }) => (
            <ParkingCard
              item={item}
              saved={saved.has(String(item.id ?? item.parking_id))}
              onOpen={() =>
                router.push({
                  pathname: "/parking/[id]",
                  params: { id: item.id ?? item.parking_id },
                })
              }
              onToggle={toggleFavorite}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = {
  filters: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, backgroundColor: colors.white },
  filterActive: { color: colors.white, backgroundColor: colors.green, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, fontWeight: "700" },
  filter: { color: "#475a51", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 11, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 7, fontSize: 11 },
  map: { height: 220, backgroundColor: "#dcebe4", overflow: "hidden", justifyContent: "center", alignItems: "center" },
  roadOne: { position: "absolute", width: "120%", height: 34, backgroundColor: "#fff", transform: [{ rotate: "-13deg" }] },
  roadTwo: { position: "absolute", width: 34, height: "140%", backgroundColor: "#fff", transform: [{ rotate: "22deg" }], left: "62%" },
  parkOne: { position: "absolute", left: "27%", top: "22%", width: 34, height: 34, borderRadius: 18, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  parkTwo: { position: "absolute", right: "22%", bottom: "22%", width: 34, height: 34, borderRadius: 18, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  pin: { color: colors.white, fontWeight: "800", fontSize: 17 },
  mapCaption: { backgroundColor: "rgba(255,255,255,0.94)", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, alignItems: "center" },
  mapTitle: { color: colors.dark, fontSize: 15, fontWeight: "800" },
  mapHint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  heading: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.dark, fontWeight: "800", fontSize: 17 },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 },
  live: { color: colors.green, fontSize: 10, fontWeight: "700" },
};
