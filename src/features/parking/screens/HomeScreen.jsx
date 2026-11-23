import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, ParkingCard, colors, ui } from "../../../components/ui";
import KakaoMap from "../KakaoMap";
import { useFavorites } from "../../../context/FavoritesContext";
import { searchParkingLots } from "../parkingApi";

const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.978 };

function feeFor(parkingLot) {
  const value = parkingLot.fee ?? parkingLot.hourly_fee ?? parkingLot.price;
  if (value == null || value === "") return Number.NaN;
  return Number(value);
}

export default function HomeScreen() {
  const { favorites, loadFavorites, toggleFavorite } = useFavorites();
  const [lots, setLots] = useState([]);
  const [center, setCenter] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [priceFirst, setPriceFirst] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      let location = DEFAULT_LOCATION;
      if (permission.status === "granted") {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        location = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setCenter(location);
      }

      setLots(await searchParkingLots({ ...location, radius: 5000 }));
      if (permission.status !== "granted") {
        setNotice("위치 권한이 꺼져 있어 서울시청 주변 주차장을 표시합니다.");
      }
    } catch (cause) {
      setError(cause?.message || "주차장 정보를 불러오지 못했습니다.");
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Request location and remote data after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    loadFavorites().catch(() => {});
  }, [load, loadFavorites]);

  const savedIds = useMemo(
    () => new Set(favorites.map((item) => String(item.id ?? item.parking_id))),
    [favorites],
  );
  const visibleLots = useMemo(() => {
    let result = accessibleOnly
      ? lots.filter((item) => item.accessible === true || Number(item.accessible_spaces) > 0)
      : lots;
    if (priceFirst) {
      result = [...result].sort((left, right) => {
        const leftFee = feeFor(left);
        const rightFee = feeFor(right);
        const leftHasFee = Number.isFinite(leftFee);
        const rightHasFee = Number.isFinite(rightFee);
        if (!leftHasFee) return rightHasFee ? 1 : 0;
        if (!rightHasFee) return -1;
        return leftFee - rightFee;
      });
    }
    return result;
  }, [accessibleOnly, lots, priceFirst]);

  return (
    <SafeAreaView style={ui.page} edges={["top"]}>
      <BrandHeader />
      <View style={styles.filters}>
        <FilterChip title="내 주변" selected={!priceFirst} onPress={() => setPriceFirst(false)} />
        <FilterChip title="요금순" selected={priceFirst} onPress={() => setPriceFirst((value) => !value)} />
        <FilterChip title="장애인 주차" selected={accessibleOnly} onPress={() => setAccessibleOnly((value) => !value)} />
      </View>
      <View style={styles.map} accessibilityLabel="주차장 지도">
        <KakaoMap
          latitude={center.latitude}
          longitude={center.longitude}
          markers={visibleLots}
          onSelect={(id) => router.push({ pathname: "/parking/[id]", params: { id } })}
        />
      </View>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>내 주변 주차장</Text>
          <Text style={styles.subtitle}>검색 결과 {visibleLots.length}곳</Text>
        </View>
        <Text style={styles.live}>실시간 정보</Text>
      </View>
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      {!!notice && <Text style={styles.notice}>{notice}</Text>}
      {loading && visibleLots.length === 0 ? (
        <ActivityIndicator color={colors.green} style={styles.loading} />
      ) : (
        <FlatList
          data={visibleLots}
          keyExtractor={(item, index) => String(item.id ?? item.parking_id ?? index)}
          contentContainerStyle={ui.list}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={<Text style={ui.empty}>{error || (accessibleOnly ? "선택한 조건에 맞는 주차장이 없습니다." : "주차장 검색 결과가 없습니다.")}</Text>}
          renderItem={({ item }) => {
            const id = item.id ?? item.parking_id;
            return (
              <ParkingCard
                item={item}
                saved={savedIds.has(String(id))}
                onOpen={() => router.push({ pathname: "/parking/[id]", params: { id } })}
                onToggle={toggleFavorite}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({ title, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.filterChip, selected && styles.selectedFilterChip]}
    >
      <Text style={[styles.filterText, selected && styles.selectedFilterText]}>{title}</Text>
    </Pressable>
  );
}

const styles = {
  filters: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, backgroundColor: colors.white },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 7 },
  selectedFilterChip: { borderColor: colors.green, backgroundColor: colors.pale },
  filterText: { color: "#475a51", fontSize: 11, fontWeight: "600" },
  selectedFilterText: { color: colors.green },
  map: { height: 220, backgroundColor: "#dcebe4", overflow: "hidden" },
  heading: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.dark, fontWeight: "800", fontSize: 17 },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 },
  live: { color: colors.green, fontSize: 10, fontWeight: "700" },
  loading: { marginTop: 22 },
  notice: { color: colors.muted, fontSize: 11, marginHorizontal: 18, marginVertical: 5 },
};
