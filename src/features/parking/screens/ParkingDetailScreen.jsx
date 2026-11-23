import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, FormField, Glyph, colors, ui } from "../../../components/ui";
import KakaoMap, { coordinatesFor } from "../KakaoMap";
import { useAuth } from "../../../context/AuthContext";
import { useFavorites } from "../../../context/FavoritesContext";
import { createParkingReview, getParkingCongestion, getParkingDetail, getParkingReviews, rateParking } from "../parkingApi";

const EMPTY_PARKING = {};

export default function ParkingDetailScreen() {
  const { id: routeId } = useLocalSearchParams();
  const id = Array.isArray(routeId) ? routeId[0] : routeId;
  const { token } = useAuth();
  const { favorites, toggleFavorite, getAnonymousToken } = useFavorites();
  const [detail, setDetail] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [congestion, setCongestion] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [score, setScore] = useState(0);
  const [savingReview, setSavingReview] = useState(false);
  const isFavorite = favorites.some((item) => String(item.id ?? item.parking_id) === String(id));

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };
    Promise.allSettled([getParkingDetail(id), getParkingCongestion(id), getParkingReviews(id)])
      .then(([detailResult, congestionResult, reviewResult]) => {
        if (!active) return;
        if (detailResult.status === "fulfilled") {
          setDetail(detailResult.value);
          setError("");
        } else {
          setDetail(null);
          setError(detailResult.reason?.message || "주차장 정보를 불러오지 못했습니다.");
        }
        setDetailId(id);
        if (congestionResult.status === "fulfilled") setCongestion(congestionResult.value);
        if (reviewResult.status === "fulfilled") setReviews(reviewResult.value);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id]);

  const item = detailId === id ? detail || EMPTY_PARKING : EMPTY_PARKING;
  const isLoading = Boolean(id) && (loading || detailId !== id);
  const coordinate = useMemo(
    () => coordinatesFor(item) || { latitude: 37.5665, longitude: 126.978 },
    [item],
  );
  const status = congestion?.status || congestion?.congestion_status || item.congestion_status || "정보 없음";
  const available = congestion?.available_spaces ?? congestion?.remaining_spaces ?? item.available_spaces;
  const total = congestion?.total_spaces ?? item.total_spaces;
  const title = item.name || item.parking_name || "주차장";

  const submitRating = useCallback(async (value) => {
    try {
      await rateParking(id, value, await getAnonymousToken());
      setScore(value);
      setError("");
    } catch (cause) {
      setError(cause?.message || "별점을 저장하지 못했습니다.");
    }
  }, [getAnonymousToken, id]);

  const submitReview = useCallback(async () => {
    const content = reviewText.trim();
    if (!content || !token || !id) return;
    setSavingReview(true);
    try {
      await createParkingReview(id, content, token);
      setReviewText("");
      setReviews(await getParkingReviews(id));
      setError("");
    } catch (cause) {
      setError(cause?.message || "리뷰를 등록하지 못했습니다.");
    } finally {
      setSavingReview(false);
    }
  }, [id, reviewText, token]);

  const toggleSaved = useCallback(async () => {
    try {
      await toggleFavorite(id);
    } catch (cause) {
      setError(cause?.message || "즐겨찾기를 변경하지 못했습니다.");
    }
  }, [id, toggleFavorite]);

  const openDirections = useCallback(async () => {
    if (!coordinatesFor(item)) {
      setError("주차장 좌표 정보가 없습니다.");
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinate.latitude},${coordinate.longitude}`;
    try {
      await Linking.openURL(url);
    } catch {
      setError("지도 앱을 열지 못했습니다.");
    }
  }, [coordinate, item]);

  return (
    <SafeAreaView style={ui.page} edges={["top", "bottom"]}>
      <BrandHeader
        back
        onBack={() => router.back()}
        right={(
          <Pressable
            style={styles.favoriteButton}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "즐겨찾기에서 삭제" : "즐겨찾기에 추가"}
            onPress={toggleSaved}
          >
            <Glyph name="heart" color={isFavorite ? colors.green : colors.dark} filled={isFavorite} />
          </Pressable>
        )}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.map} accessibilityLabel="주차장 위치 지도">
          <KakaoMap latitude={coordinate.latitude} longitude={coordinate.longitude} />
        </View>
        <View style={styles.detail}>
          {isLoading && detailId !== id ? <ActivityIndicator color={colors.green} style={styles.spinner} /> : null}
          <Text style={styles.badge}>{status}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.address}>{item.address || "주소 정보 없음"}</Text>

          <View style={styles.capacity}>
            <View style={styles.car}><Glyph name="car" color={colors.white} /></View>
            <View>
              <Text style={styles.muted}>현재 주차 가능</Text>
              <Text style={styles.available}>
                {available == null ? "정보 없음" : `${available}대`}
                {total != null ? <Text style={styles.muted}> / 총 {total}대</Text> : null}
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            <Fact label="이용 요금" value={item.fee ?? item.hourly_fee ?? "정보 없음"} />
            <Fact label="운영 시간" value={item.operating_hours || item.hours || "정보 없음"} />
            <Fact label="이용자 평점" value={item.rating == null ? "정보 없음" : `★ ${item.rating}${item.rating_count ? ` (${item.rating_count})` : ""}`} />
            <Fact label="장애인 주차" value={item.accessible == null ? "정보 없음" : item.accessible ? "가능" : "불가"} />
          </View>

          <Text style={styles.eyebrow}>이용자 이야기</Text>
          <Text style={styles.section}>주차장 리뷰</Text>
          {!id ? <Text style={styles.muted}>주차장 정보가 없습니다.</Text> : reviews.length ? reviews.map((review, index) => (
            <View key={review.id ?? `${review.user_id ?? "review"}-${index}`} style={styles.review}>
              <View style={styles.avatar}><Glyph name="user" size={17} /></View>
              <View style={styles.reviewBody}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewName}>{review.user_nickname || "회원"}</Text>
                  <Text style={styles.muted}>{review.created_at ? new Date(review.created_at).toLocaleDateString("ko-KR") : ""}</Text>
                </View>
                <Text style={styles.reviewText}>{review.content}</Text>
              </View>
            </View>
          )) : <Text style={styles.muted}>{isLoading ? "리뷰를 불러오는 중입니다…" : "등록된 리뷰가 없습니다."}</Text>}

          <Text style={styles.fieldLabel}>별점 남기기</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value}점`} onPress={() => submitRating(value)} hitSlop={5}>
                <Text style={[styles.star, score >= value && styles.starOn]}>★</Text>
              </Pressable>
            ))}
          </View>

          {token ? (
            <View style={styles.reviewForm}>
              <FormField
                accessibilityLabel="리뷰 내용"
                style={styles.reviewInput}
                value={reviewText}
                onChangeText={(value) => setReviewText(value.slice(0, 300))}
                placeholder="이 주차장을 이용한 경험을 남겨 주세요."
                multiline
                maxLength={300}
              />
              <Pressable style={[ui.outline, savingReview && styles.disabled]} disabled={savingReview || !reviewText.trim()} onPress={submitReview}>
                <Text style={ui.outlineText}>{savingReview ? "등록 중…" : "리뷰 등록"}</Text>
              </Pressable>
            </View>
          ) : <Text style={styles.muted}>리뷰를 작성하려면 로그인해 주세요.</Text>}
          {!!(error || (!id && "주차장 정보가 없습니다.")) && <Text accessibilityRole="alert" style={ui.error}>{error || "주차장 정보가 없습니다."}</Text>}
        </View>
      </ScrollView>
      <Pressable style={styles.route} onPress={openDirections} accessibilityRole="button">
        <Glyph name="pin" color={colors.white} />
        <Text style={styles.routeText}>길찾기</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Fact({ label, value }) {
  return <View style={styles.fact}><Text style={styles.muted}>{label}</Text><Text style={styles.factValue}>{String(value)}</Text></View>;
}

const styles = {
  content: { paddingBottom: 18 },
  map: { height: 220, backgroundColor: "#eaf0ed", overflow: "hidden" },
  detail: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -1, paddingHorizontal: 18, paddingTop: 23, paddingBottom: 26 },
  spinner: { marginBottom: 12 },
  badge: { alignSelf: "flex-start", color: colors.green, backgroundColor: colors.pale, overflow: "hidden", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: "700" },
  title: { color: colors.dark, fontSize: 22, fontWeight: "800", marginTop: 13 },
  address: { color: colors.muted, fontSize: 12, marginTop: 5, marginBottom: 16 },
  capacity: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 17, backgroundColor: colors.pale, marginBottom: 13 },
  car: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#12a56a" },
  muted: { color: colors.muted, fontSize: 10 },
  available: { color: colors.green, fontSize: 20, fontWeight: "800", marginTop: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden", marginBottom: 25 },
  fact: { width: "50%", minHeight: 70, justifyContent: "center", gap: 7, paddingHorizontal: 13, borderBottomWidth: 1, borderColor: colors.border },
  factValue: { color: colors.dark, fontWeight: "700", fontSize: 12 },
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: "700", marginBottom: 5 },
  section: { color: colors.dark, fontWeight: "800", fontSize: 18, marginBottom: 10 },
  review: { flexDirection: "row", gap: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 11, marginBottom: 9 },
  avatar: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  reviewBody: { flex: 1 },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  reviewName: { color: colors.dark, fontSize: 11, fontWeight: "700" },
  reviewText: { color: "#77877f", fontSize: 11, lineHeight: 17, marginTop: 5 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 13 },
  stars: { flexDirection: "row", gap: 6, marginVertical: 5 },
  star: { fontSize: 26, color: "#d8dfdb" },
  starOn: { color: colors.orange },
  reviewForm: { gap: 8, marginTop: 6 },
  reviewInput: { minHeight: 80, textAlignVertical: "top", paddingTop: 10 },
  disabled: { opacity: 0.55 },
  favoriteButton: { position: "absolute", zIndex: 2, right: 10, top: 9, width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  route: { minHeight: 50, marginHorizontal: 8, marginBottom: 4, borderRadius: 14, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  routeText: { color: colors.white, fontWeight: "700", fontSize: 14 },
};
