import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../../components/ui";
import { coordinatesFor } from "./mapUtils";
export { coordinatesFor } from "./mapUtils";

const JAVASCRIPT_KEY = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY || "";

export default function KakaoMap({
  latitude = 37.5665,
  longitude = 126.978,
  markers = [],
  onSelect,
}) {
  const [mapError, setMapError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const validMarkers = useMemo(
    () =>
      markers.flatMap((item) => {
        const coordinate = coordinatesFor(item);
        const id = item?.id ?? item?.parking_id;
        if (!coordinate || id == null) return [];
        return [
          {
            id: String(id),
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            title: String(item.name || item.parking_name || "주차장"),
          },
        ];
      }),
    [markers],
  );

  const html = useMemo(() => {
    if (!JAVASCRIPT_KEY) return "";
    const data = JSON.stringify(validMarkers).replace(/</g, "\\u003c");
    return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>html,body,#map{width:100%;height:100%;margin:0;padding:0;overflow:hidden}</style>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(JAVASCRIPT_KEY)}&amp;autoload=false"></script>
</head><body><div id="map"></div><script>
const center = new kakao.maps.LatLng(${Number(latitude)}, ${Number(longitude)});
kakao.maps.load(function(){
  const map = new kakao.maps.Map(document.getElementById('map'), { center, level: 4 });
  const items = ${data};
  items.forEach(function(item){
    const marker = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(item.latitude, item.longitude), title: item.title });
    kakao.maps.event.addListener(marker, 'click', function(){ window.ReactNativeWebView.postMessage(item.id); });
  });
  if (!items.length) new kakao.maps.Marker({ map, position: center, title: "현재 위치" });
});
</script></body></html>`;
  }, [latitude, longitude, validMarkers]);

  if (!JAVASCRIPT_KEY) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Kakao 지도 설정이 필요합니다</Text>
        <Text style={styles.noticeText}>
          .env.local에 EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY를 설정하고 Kakao Developers에 http://localhost를 JavaScript SDK 도메인으로 등록해 주세요.
        </Text>
      </View>
    );
  }

  if (mapError) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>지도를 불러오지 못했습니다</Text>
        <Text style={styles.noticeText}>{mapError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMapError("");
            setReloadKey((value) => value + 1);
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <WebView
      key={reloadKey}
      style={styles.webview}
      source={{ html, baseUrl: "http://localhost/" }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      onMessage={(event) => onSelect?.(event.nativeEvent.data)}
      onError={(event) => setMapError(event.nativeEvent.description || "네트워크 연결과 Kakao 지도 키를 확인해 주세요.")}
      onHttpError={(event) => setMapError(`지도 서버 응답 오류 (${event.nativeEvent.statusCode})`)}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: "#eaf0ed" },
  notice: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#eaf0ed",
  },
  noticeTitle: { color: colors.dark, fontSize: 13, fontWeight: "700", textAlign: "center" },
  noticeText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 7 },
  retryButton: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  retryText: { color: colors.green, fontSize: 12, fontWeight: "700" },
});



