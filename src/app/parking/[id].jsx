import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, Glyph, colors, ui } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api, listFrom } from "../../lib/api";

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { token, favorites, toggleFavorite, getAnonymousToken } = useApp();
  const [detail, setDetail] = useState(null), [congestion, setCongestion] = useState(null), [reviews, setReviews] = useState([]), [loading, setLoading] = useState(true), [message, setMessage] = useState(""), [reviewText, setReviewText] = useState(""), [score, setScore] = useState(0);
  const favorite = favorites.some((item) => String(item.id ?? item.parking_id) === String(id));
  useEffect(() => {
    let active = true;
    Promise.allSettled([api(`/parking-lots/${id}`), api(`/parking-lots/${id}/congestion`), api(`/parking-lots/${id}/reviews`)]).then(([d, c, r]) => {
      if (!active) return;
      if (d.status === "fulfilled") setDetail(d.value?.data || d.value?.parking_lot || d.value); else setMessage(d.reason.message);
      if (c.status === "fulfilled") setCongestion(c.value?.data || c.value);
      if (r.status === "fulfilled") setReviews(listFrom(r.value, ["reviews", "items", "results"])); else setMessage(r.reason.message);
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);
  const rate = async (value) => {
    try { await api(`/parking-lots/${id}/rating`, { method: "PUT", token: await getAnonymousToken(), body: { score: value } }); setScore(value); }
    catch (e) { setMessage(e.message); }
  };
  const submitReview = async () => {
    try { await api(`/parking-lots/${id}/reviews`, { method: "POST", token, body: { content: reviewText } }); setReviewText(""); const result = await api(`/parking-lots/${id}/reviews`); setReviews(listFrom(result, ["reviews", "items", "results"])); }
    catch (e) { setMessage(e.message); }
  };
  const item = detail || {};
  const status = congestion?.status || congestion?.congestion_status || item.congestion_status || "정보 없음";
  const available = congestion?.available_spaces ?? congestion?.remaining_spaces ?? item.available_spaces;
  const total = congestion?.total_spaces ?? item.total_spaces;
  const title = item.name || item.parking_name || "주차장";
  return <SafeAreaView style={ui.page} edges={["top", "bottom"]}>
    <BrandHeader back onBack={() => router.back()} right={<Pressable style={styles.heart} onPress={() => toggleFavorite(id)}><Glyph name="heart" color={favorite ? colors.green : colors.dark} filled={favorite}/></Pressable>}/>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.map}><View style={styles.road}/><View style={styles.mapTag}><Glyph name="pin" size={15}/><Text style={styles.mapText}>지도 미리보기</Text></View><View style={styles.marker}><Text style={styles.markerText}>P</Text></View></View>
      <View style={styles.detail}>
        <Text style={styles.badge}>{status}</Text><Text style={styles.title}>{title}</Text><Text style={styles.address}>{item.address || ""}</Text>
        <View style={styles.capacity}><View style={styles.car}><Glyph name="car" color={colors.white}/></View><View><Text style={styles.muted}>현재 주차 가능</Text><Text style={styles.available}>{available == null ? "정보 없음" : `${available}대`}{total != null ? <Text style={styles.muted}> / 총 {total}대</Text> : null}</Text></View></View>
        <View style={styles.grid}><Fact label="이용 요금" value={item.fee ?? item.hourly_fee ?? "정보 없음"}/><Fact label="이용 시간" value={item.operating_hours || item.hours || "정보 없음"}/><Fact label="이용자 평점" value={item.rating == null ? "정보 없음" : `★ ${item.rating}${item.rating_count ? ` (${item.rating_count})` : ""}`}/><Fact label="장애인 주차" value={item.accessible == null ? "정보 없음" : item.accessible ? "가능" : "불가"}/></View>
        <Text style={styles.eyebrow}>이용자 후기</Text><Text style={styles.section}>주차장 리뷰</Text>
        {loading ? <ActivityIndicator color={colors.green} style={{ margin: 22 }}/> : reviews.length ? reviews.map((review, index) => <View key={review.id || `${review.user_id}-${index}`} style={styles.review}><View style={styles.avatar}><Glyph name="user" size={17}/></View><View style={{ flex: 1 }}><View style={styles.reviewHead}><Text style={styles.reviewName}>{review.user_nickname || review.user_id || "회원"}</Text><Text style={styles.muted}>{review.created_at ? new Date(review.created_at).toLocaleDateString("ko-KR") : ""}</Text></View><Text style={styles.reviewBody}>{review.content}</Text></View></View>) : <Text style={styles.muted}>등록된 리뷰가 없습니다.</Text>}
        <Text style={styles.fieldLabel}>별점 남기기</Text><View style={styles.stars}>{[1,2,3,4,5].map((value) => <Pressable key={value} onPress={() => rate(value)}><Text style={[styles.star, score >= value && styles.starOn]}>★</Text></Pressable>)}</View>
        {token && <><TextInput style={[ui.input, styles.reviewInput]} value={reviewText} onChangeText={(value) => setReviewText(value.slice(0, 300))} placeholder="이 주차장을 이용한 경험을 남겨주세요." multiline maxLength={300}/><Pressable style={ui.outline} disabled={!reviewText.trim()} onPress={submitReview}><Text style={ui.outlineText}>리뷰 등록</Text></Pressable></>}
        {!!message && <Text style={ui.error}>{message}</Text>}
      </View>
    </ScrollView>
    <Pressable style={styles.route} onPress={() => item.lat != null && item.lon != null ? Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}`) : setMessage("주차장 좌표 정보가 없습니다.")}><Glyph name="pin" color={colors.white}/><Text style={styles.routeText}>길찾기</Text></Pressable>
  </SafeAreaView>;
}

function Fact({ label, value }) { return <View style={styles.fact}><Text style={styles.muted}>{label}</Text><Text style={styles.factValue}>{value}</Text></View>; }
const styles = {
  content: { paddingBottom: 18 }, map: { height: 220, backgroundColor: "#eaf0ed", alignItems: "center", justifyContent: "center", overflow: "hidden" }, road: { position: "absolute", width: "130%", height: 25, backgroundColor: colors.white, transform: [{ rotate: "-12deg" }] }, mapTag: { position: "absolute", right: 12, top: 12, flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: colors.white, borderRadius: 10, padding: 8 }, mapText: { color: colors.dark, fontSize: 10 }, marker: { width: 44, height: 44, borderRadius: 24, backgroundColor: colors.green, borderWidth: 3, borderColor: colors.white, alignItems: "center", justifyContent: "center" }, markerText: { color: colors.white, fontSize: 18 },
  detail: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -1, paddingHorizontal: 18, paddingTop: 23, paddingBottom: 26 }, badge: { alignSelf: "flex-start", color: colors.green, backgroundColor: colors.pale, overflow: "hidden", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: "700" }, title: { color: colors.dark, fontSize: 22, fontWeight: "800", marginTop: 13 }, address: { color: colors.muted, fontSize: 12, marginTop: 5, marginBottom: 16 }, capacity: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 17, backgroundColor: colors.pale, marginBottom: 13 }, car: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#12a56a" }, muted: { color: colors.muted, fontSize: 10 }, available: { color: colors.green, fontSize: 20, fontWeight: "800", marginTop: 3 }, grid: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden", marginBottom: 25 }, fact: { width: "50%", minHeight: 70, justifyContent: "center", gap: 7, paddingHorizontal: 13, borderBottomWidth: 1, borderColor: colors.border }, factValue: { color: colors.dark, fontWeight: "700", fontSize: 12 }, eyebrow: { color: colors.green, fontSize: 12, fontWeight: "700", marginBottom: 5 }, section: { color: colors.dark, fontWeight: "800", fontSize: 18, marginBottom: 10 },
  review: { flexDirection: "row", gap: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 11, marginBottom: 9 }, avatar: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" }, reviewHead: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, reviewName: { color: colors.dark, fontSize: 11, fontWeight: "700" }, reviewBody: { color: "#77877f", fontSize: 11, lineHeight: 17, marginTop: 5 }, fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 13 }, stars: { flexDirection: "row", gap: 6, marginVertical: 5 }, star: { fontSize: 26, color: "#d8dfdb" }, starOn: { color: colors.orange }, reviewInput: { minHeight: 68, textAlignVertical: "top", paddingTop: 10, marginTop: 6 },
  heart: { position: "absolute", zIndex: 2, right: 10, top: 9, width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }, route: { minHeight: 50, marginHorizontal: 8, marginBottom: 4, borderRadius: 14, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, routeText: { color: colors.white, fontWeight: "700", fontSize: 14 },
};
