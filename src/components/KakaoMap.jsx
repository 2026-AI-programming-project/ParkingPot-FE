import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "./ui";

const JAVASCRIPT_KEY = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY || "";

export function coordinatesFor(item) {
  const point = item?.location && !Array.isArray(item.location) ? item.location : item;
  let latitude = Number(point?.latitude ?? point?.lat);
  let longitude = Number(point?.longitude ?? point?.lon ?? point?.lng);
  const coordinates = item?.coordinates ?? point?.coordinates;
  if (
    (!Number.isFinite(latitude) || !Number.isFinite(longitude)) &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2
  ) {
    longitude = Number(coordinates[0]);
    latitude = Number(coordinates[1]);
  }
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return { latitude, longitude };
}

export default function KakaoMap({
  latitude = 37.5665,
  longitude = 126.978,
  markers = [],
  onSelect,
}) {
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
            title: String(item.name || item.parking_name || "Parking lot"),
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
  if (!items.length) new kakao.maps.Marker({ map, position: center, title: "Current location" });
});
</script></body></html>`;
  }, [latitude, longitude, validMarkers]);

  if (!JAVASCRIPT_KEY) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Kakao JavaScript key required</Text>
        <Text style={styles.noticeText}>
          Set EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY in .env.local and register http://localhost as a JavaScript SDK domain.
        </Text>
      </View>
    );
  }

  return (
    <WebView
      style={styles.webview}
      source={{ html, baseUrl: "http://localhost/" }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      onMessage={(event) => onSelect?.(event.nativeEvent.data)}
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
});



