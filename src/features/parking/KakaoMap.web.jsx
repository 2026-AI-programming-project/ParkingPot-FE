import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../components/ui";
import { coordinatesFor } from "./mapUtils";

const JAVASCRIPT_KEY = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY || "";
const SCRIPT_ID = "parkingpot-kakao-map-sdk";

export default function KakaoMap({
  latitude = 37.5665,
  longitude = 126.978,
  markers = [],
  onSelect,
}) {
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const validMarkers = useMemo(
    () =>
      markers.flatMap((item) => {
        const coordinate = coordinatesFor(item);
        const id = item?.id ?? item?.parking_id;
        if (!coordinate || id == null) return [];
        return [{
          id: String(id),
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          title: String(item.name || item.parking_name || "주차장"),
        }];
      }),
    [markers],
  );

  useEffect(() => {
    if (!JAVASCRIPT_KEY || !mapRef.current) return undefined;

    let cancelled = false;
    const showMap = () => {
      if (cancelled || !mapRef.current || !window.kakao?.maps) return;
      try {
        const center = new window.kakao.maps.LatLng(Number(latitude), Number(longitude));
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 4 });
        if (validMarkers.length) {
          validMarkers.forEach((item) => {
            const marker = new window.kakao.maps.Marker({
              map,
              position: new window.kakao.maps.LatLng(item.latitude, item.longitude),
              title: item.title,
            });
            window.kakao.maps.event.addListener(marker, "click", () => onSelect?.(item.id));
          });
        } else {
          new window.kakao.maps.Marker({ map, position: center, title: "현재 위치" });
        }
        setMapError("");
      } catch {
        setMapError("카카오 지도를 불러오지 못했어요. 개발자 콘솔의 도메인 등록을 확인해 주세요.");
      }
    };
    const loadMap = () => window.kakao.maps.load(showMap);

    const existingScript = document.getElementById(SCRIPT_ID);
    if (window.kakao?.maps) {
      loadMap();
    } else if (existingScript) {
      existingScript.addEventListener("load", loadMap, { once: true });
      existingScript.addEventListener("error", () => setMapError("카카오 지도 SDK를 불러오지 못했어요."), { once: true });
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(JAVASCRIPT_KEY)}&autoload=false`;
      script.onload = loadMap;
      script.onerror = () => setMapError("카카오 지도 SDK를 불러오지 못했어요.");
      document.head.appendChild(script);
    }

    return () => { cancelled = true; };
  }, [latitude, longitude, validMarkers, onSelect]);

  if (!JAVASCRIPT_KEY) {
    return (
      <View style={styles.notice}>
        <Text style={styles.title}>카카오 지도 키 설정이 필요해요</Text>
        <Text style={styles.message}> .env.local의 JavaScript 키와 Kakao Developers의 localhost 도메인 등록을 확인해 주세요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View ref={mapRef} style={styles.map} />
      {!!mapError && <Text style={styles.error}>{mapError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eaf0ed" },
  map: { flex: 1, width: "100%" },
  notice: { flex: 1, justifyContent: "center", alignItems: "center", padding: 18, backgroundColor: "#eaf0ed" },
  title: { color: colors.dark, fontSize: 13, fontWeight: "700", textAlign: "center" },
  message: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 7 },
  error: { position: "absolute", left: 12, right: 12, bottom: 12, padding: 8, color: colors.dark, backgroundColor: "white", fontSize: 11, textAlign: "center" },
});
