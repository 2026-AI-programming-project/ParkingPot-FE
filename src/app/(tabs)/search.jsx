import React, { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, Glyph, ParkingCard, colors, ui } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api, listFrom } from "../../lib/api";

export default function SearchScreen() {
  const { favorites, toggleFavorite } = useApp();
  const [query, setQuery] = useState(""), [lots, setLots] = useState([]), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  const search = async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: "1", page_size: "20" });
      if (query.trim()) params.set("name", query.trim());
      setLots(listFrom(await api(`/parking-lots?${params}`), ["parking_lots", "items", "results"]));
    } catch (e) { setLots([]); setError(e.message); }
    finally { setLoading(false); }
  };
  const saved = new Set(favorites.map((item) => String(item.id ?? item.parking_id)));
  return <SafeAreaView style={ui.page} edges={["top"]}>
    <BrandHeader/>
    <View style={ui.scroll}>
      <Text style={ui.eyebrow}>주차장 검색</Text><Text style={ui.title}>목적지 주변 주차장을 찾아보세요</Text>
      <View style={styles.search}><Glyph name="search"/><TextInput style={styles.input} value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" placeholder="주소 또는 주차장 이름"/><Pressable onPress={() => setQuery("")}><Text style={styles.clear}>×</Text></Pressable></View>
      <View style={styles.heading}><Text style={styles.section}>검색 결과</Text><Text style={styles.count}>{lots.length}</Text></View>
      {!!error && <Text style={ui.error}>{error}</Text>}
    </View>
    <FlatList data={lots} keyExtractor={(item, index) => String(item.id ?? index)} contentContainerStyle={ui.list} refreshing={loading} onRefresh={search} ListEmptyComponent={<Text style={ui.empty}>{error || (loading ? "검색 중입니다." : "검색어를 입력해 주세요.")}</Text>} renderItem={({ item }) => <ParkingCard item={item} saved={saved.has(String(item.id))} onOpen={() => router.push({ pathname: "/parking/[id]", params: { id: item.id } })} onToggle={toggleFavorite}/>}/>
  </SafeAreaView>;
}

const styles = {
  search: { height: 54, marginTop: 19, marginBottom: 19, borderRadius: 16, borderWidth: 1, borderColor: "#65c99a", backgroundColor: colors.white, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13 },
  input: { flex: 1, color: colors.dark, fontSize: 13 }, clear: { color: colors.muted, fontSize: 21, paddingHorizontal: 3 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, section: { color: colors.dark, fontSize: 17, fontWeight: "800" }, count: { color: colors.green, fontSize: 12, fontWeight: "700", backgroundColor: colors.pale, borderRadius: 9, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5 },
};
