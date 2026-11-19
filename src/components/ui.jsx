import React, { forwardRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import LogoAsset from "../../assets/logo.svg";

export const colors = {
  green: "#078a56",
  dark: "#10251f",
  muted: "#82928a",
  pale: "#e8f8f0",
  bg: "#f2f5f3",
  white: "#fff",
  border: "#e4ebe7",
  orange: "#f2a01b",
  red: "#e25353",
};

export function Glyph({
  name,
  size = 21,
  color = colors.green,
  filled = false,
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const art = {
    home: (
      <>
        <Path d="m3 10 9-7 9 7" />
        <Path d="M5 9v12h14V9M9 21v-7h6v7" />
      </>
    ),
    search: (
      <>
        <Circle cx="10.8" cy="10.8" r="6.8" />
        <Path d="m16 16 5 5" />
      </>
    ),
    heart: (
      <Path
        d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11a4.8 4.8 0 0 1 8.8-2.7 4.8 4.8 0 0 1 8.8 2.7Z"
        fill={filled ? color : "none"}
      />
    ),
    user: (
      <>
        <Circle cx="12" cy="7.5" r="4" />
        <Path d="M4 21v-1.5a8 8 0 0 1 16 0V21" />
      </>
    ),
    pin: (
      <>
        <Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <Circle cx="12" cy="10" r="2.5" />
      </>
    ),
    car: (
      <>
        <Path d="m5 11 1.5-5h11l1.5 5 2 2v5h-2v-2H5v2H3v-5l2-2Z" />
        <Path d="M6.5 11h11" />
      </>
    ),
    back: <Path d="m15 18-6-6 6-6" />,
    arrow: <Path d="m9 18 6-6-6-6" />,
  };
  return <Svg {...props}>{art[name]}</Svg>;
}

export function BrandHeader({ back, onBack, right }) {
  return (
    <View style={s.header}>
      {back ? (
        <Pressable style={s.sideButton} onPress={onBack}>
          <Glyph name="back" color={colors.dark} />
        </Pressable>
      ) : (
        <View style={s.sideButton} />
      )}
      <LogoAsset width={112} height={56} style={s.logo} />
      {right || <View style={[s.sideButton, s.right]} />}
    </View>
  );
}

export function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <View style={s.heading}>
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <Text style={s.title}>{title}</Text>
      {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function ParkingCard({ item, saved, onOpen, onToggle }) {
  const title = item.name || item.parking_name || "주차장";
  const state =
    item.congestion?.status || item.congestion_status || "정보 없음";
  const rating = item.rating ?? item.average_rating;
  const fee = item.fee ?? item.hourly_fee ?? item.price;
  const stateColor = /여유|원활/.test(state)
    ? colors.green
    : /혼잡/.test(state)
      ? colors.red
      : state === "보통"
        ? colors.orange
        : colors.muted;
  return (
    <Pressable style={s.card} onPress={onOpen}>
      <View style={s.parkingIcon}>
        <Text style={s.parkingP}>P</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[s.status, { color: stateColor }]}>{state}</Text>
        </View>
        <Text style={s.address} numberOfLines={1}>
          {item.address || "주소 정보 없음"}
        </Text>
        <Text style={s.meta}>
          {rating != null ? `★ ${rating}` : ""}
          {fee != null ? `  ·  ${fee}` : ""}
        </Text>
      </View>
      <Pressable
        style={s.heart}
        onPress={(event) => {
          event.stopPropagation();
          onToggle(item.id ?? item.parking_id);
        }}
      >
        <Glyph
          name="heart"
          size={18}
          color={saved ? colors.green : colors.muted}
          filled={saved}
        />
      </Pressable>
      <Glyph name="arrow" size={18} color="#9aa8a1" />
    </Pressable>
  );
}

export const FormField = forwardRef(function FormField(
  { label, ...props },
  ref,
) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        ref={ref}
        style={s.input}
        placeholderTextColor="#a0ada7"
        {...props}
      />
    </View>
  );
});

export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 23, paddingBottom: 26 },
  eyebrow: {
    color: colors.green,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 7,
  },
  title: {
    color: colors.dark,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5 },
  list: { paddingHorizontal: 14, paddingBottom: 24, gap: 9 },
  empty: {
    color: colors.muted,
    textAlign: "center",
    padding: 22,
    fontSize: 13,
  },
  error: {
    color: colors.red,
    fontSize: 12,
    marginHorizontal: 18,
    marginVertical: 8,
    lineHeight: 18,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: colors.dark,
    backgroundColor: colors.white,
    fontSize: 14,
  },
  field: { gap: 5 },
  label: { color: "#73837b", fontSize: 12, fontWeight: "600", marginTop: 3 },
  form: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    padding: 17,
    gap: 11,
  },
  primary: {
    minHeight: 48,
    backgroundColor: colors.green,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  outline: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#cfe6d9",
    backgroundColor: "#f2faf6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { color: colors.green, fontSize: 13, fontWeight: "700" },
  card: {
    minHeight: 98,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  parkingIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  parkingP: { color: colors.white, fontSize: 27 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardTitle: {
    flexShrink: 1,
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  status: {
    overflow: "hidden",
    backgroundColor: colors.pale,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 9,
    fontWeight: "700",
  },
  address: { color: colors.muted, fontSize: 11, marginTop: 5 },
  meta: { color: colors.dark, fontSize: 10, marginTop: 5 },
  heart: { padding: 3 },
});

const s = StyleSheet.create({
  header: {
    height: 62,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1ef",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logo: { position: "absolute", left: "50%", top: 3, marginLeft: -56 },
  sideButton: {
    position: "absolute",
    zIndex: 1,
    left: 10,
    top: 9,
    width: 42,
    height: 42,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  right: { left: undefined, right: 10 },
  heading: { paddingHorizontal: 18, paddingTop: 26, paddingBottom: 16 },
  eyebrow: ui.eyebrow,
  title: ui.title,
  subtitle: ui.subtitle,
  card: ui.card,
  parkingIcon: ui.parkingIcon,
  parkingP: ui.parkingP,
  cardBody: ui.cardBody,
  cardTitleRow: ui.cardTitleRow,
  cardTitle: ui.cardTitle,
  status: ui.status,
  address: ui.address,
  meta: ui.meta,
  heart: ui.heart,
  field: ui.field,
  label: ui.label,
  input: ui.input,
});
