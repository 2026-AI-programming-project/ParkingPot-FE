import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, Glyph, ParkingCard, colors, ui } from "../../../components/ui";
import { useFavorites } from "../../../context/FavoritesContext";
import { searchParkingLots } from "../parkingApi";

export default function SearchScreen() {
  const { favorites, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState("");
  const [lots, setLots] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const savedIds = useMemo(
    () => new Set(favorites.map((item) => String(item.id ?? item.parking_id))),
    [favorites],
  );

  const search = useCallback(async (value = query) => {
    setLoading(true);
    setError("");
    try {
      setLots(await searchParkingLots({ query: value }));
    } catch (cause) {
      setLots([]);
      setError(cause?.message || "주차장을 검색하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const submitSearch = useCallback(() => search(query.trim()), [query, search]);
  const clearSearch = useCallback(() => {
    setQuery("");
    setLots([]);
    setError("");
  }, []);

  return (
    <SafeAreaView style={ui.page} edges={["top"]}>
      <BrandHeader />
      <View style={ui.scroll}>
        <Text style={ui.eyebrow}>주차장 찾기</Text>
        <Text style={ui.title}>어디에 주차하시나요?</Text>
        <View style={styles.searchBox}>
          <Glyph name="search" color={colors.muted} />
          <TextInput
            accessibilityLabel="주차장 또는 주소 검색"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder="주차장 이름 또는 주소"
            placeholderTextColor={colors.muted}
            autoCorrect={false}
          />
          {!!query && (
            <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={clearSearch} hitSlop={10}>
              <Text style={styles.clear}>×</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.heading}>
          <Text style={styles.section}>검색 결과</Text>
          <Text style={styles.count}>{lots.length}</Text>
        </View>
        {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      </View>
      <FlatList
        data={lots}
        keyExtractor={(item, index) => String(item.id ?? item.parking_id ?? index)}
        contentContainerStyle={ui.list}
        keyboardShouldPersistTaps="handled"
        refreshing={loading}
        onRefresh={submitSearch}
        ListEmptyComponent={
          <Text style={ui.empty}>
            {error || (loading ? "검색 중입니다…" : "검색어를 입력하고 검색해 주세요.")}
          </Text>
        }
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
    </SafeAreaView>
  );
}

const styles = {
  searchBox: { height: 54, marginTop: 19, marginBottom: 19, borderRadius: 16, borderWidth: 1, borderColor: "#65c99a", backgroundColor: colors.white, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13 },
  input: { flex: 1, color: colors.dark, fontSize: 14, minHeight: 48 },
  clear: { color: colors.muted, fontSize: 24, paddingHorizontal: 3 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  section: { color: colors.dark, fontSize: 17, fontWeight: "800" },
  count: { color: colors.green, fontSize: 12, fontWeight: "700", backgroundColor: colors.pale, borderRadius: 9, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5 },
};
