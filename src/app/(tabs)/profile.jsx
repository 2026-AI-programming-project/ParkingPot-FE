import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, colors, ui } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api } from "../../lib/api";

export default function ProfileScreen() {
  const { token, user, setUser, signOut } = useApp();
  const [editing, setEditing] = useState(false), [nickname, setNickname] = useState(user?.nickname || ""), [email, setEmail] = useState(""), [code, setCode] = useState(""), [sent, setSent] = useState(false), [currentPassword, setCurrentPassword] = useState(""), [newPassword, setNewPassword] = useState(""), [message, setMessage] = useState("");
  if (!token) return <Redirect href="/"/>;
  const saveNickname = async () => {
    try { const result = await api("/api/users/me", { method: "PATCH", token, body: { nickname } }); setUser(result?.user || result?.data || result); setEditing(false); setMessage("닉네임을 변경했습니다."); }
    catch (e) { setMessage(e.message); }
  };
  const requestEmailCode = async () => {
    try { await api("/api/auth/email-verifications", { method: "POST", token, body: { email, purpose: "email_change" } }); setSent(true); setMessage("인증번호를 요청했습니다."); }
    catch (e) { setMessage(e.message); }
  };
  const saveEmail = async () => {
    try { const result = await api("/api/users/me", { method: "PATCH", token, body: { email, verification_code: code } }); setUser(result?.user || result?.data || result); setSent(false); setEmail(""); setCode(""); setMessage("이메일을 변경했습니다."); }
    catch (e) { setMessage(e.message); }
  };
  const savePassword = async () => {
    try { await api("/api/users/me/password/verify", { method: "POST", token, body: { password: currentPassword } }); await api("/api/users/me", { method: "PATCH", token, body: { password: newPassword } }); setCurrentPassword(""); setNewPassword(""); setMessage("비밀번호를 변경했습니다."); }
    catch (e) { setMessage(e.message); }
  };
  const removeAccount = () => Alert.alert("회원 탈퇴", "계정을 삭제할까요?", [{ text: "취소", style: "cancel" }, { text: "삭제", style: "destructive", onPress: async () => { try { await api("/api/users/me", { method: "DELETE", token }); await signOut(); router.replace("/"); } catch (e) { setMessage(e.message); } } }]);
  return <SafeAreaView style={ui.page} edges={["top"]}>
    <BrandHeader/>
    <View style={ui.scroll}><Text style={ui.eyebrow}>내 정보</Text><Text style={ui.title}>마이페이지</Text>
      <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{user?.nickname?.slice(0,1) || "?"}</Text></View><View style={{ flex: 1 }}><Text style={styles.nickname}>{user?.nickname || "회원"}</Text><Text style={ui.subtitle}>{user?.email || ""}</Text></View><Pressable onPress={() => { setEditing(!editing); setNickname(user?.nickname || ""); }}><Text style={styles.green}>수정</Text></Pressable></View>
      <View style={ui.form}><Text style={ui.eyebrow}>로그인 계정</Text><Text style={styles.section}>내 계정 정보</Text><InfoRow label="이메일" value={user?.email || "정보 없음"}/><InfoRow label="닉네임" value={user?.nickname || "정보 없음"}/></View>
      {editing && <View style={ui.form}><Text style={styles.section}>닉네임 변경</Text><TextInput value={nickname} onChangeText={setNickname} style={ui.input}/><Action title="저장" onPress={saveNickname}/></View>}
      <View style={ui.form}><Text style={styles.section}>이메일 변경</Text><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={ui.input} placeholder="새 이메일"/><Action title="인증번호 요청" onPress={requestEmailCode}/>{sent && <><TextInput value={code} onChangeText={setCode} style={ui.input} placeholder="인증번호"/><Action title="이메일 변경" onPress={saveEmail}/></>}</View>
      <View style={ui.form}><Text style={styles.section}>비밀번호 변경</Text><TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry style={ui.input} placeholder="현재 비밀번호"/><TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry style={ui.input} placeholder="새 비밀번호"/><Action title="비밀번호 변경" onPress={savePassword}/></View>
      <Action title="로그아웃" onPress={async () => { await signOut(); router.replace("/"); }}/><Pressable style={styles.delete} onPress={removeAccount}><Text style={{ color: colors.red }}>회원 탈퇴</Text></Pressable>{!!message && <Text style={ui.error}>{message}</Text>}
    </View>
  </SafeAreaView>;
}

function Action({ title, onPress }) { return <Pressable style={ui.outline} onPress={onPress}><Text style={ui.outlineText}>{title}</Text></Pressable>; }
function InfoRow({ label, value }) { return <View style={styles.row}><Text style={ui.subtitle}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }
const styles = { profile: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginVertical: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18 }, avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" }, avatarText: { color: colors.green, fontWeight: "800", fontSize: 20 }, nickname: { color: colors.dark, fontWeight: "700", fontSize: 15 }, green: { color: colors.green, fontWeight: "700" }, section: { color: colors.dark, fontWeight: "800", fontSize: 15, marginBottom: 8 }, row: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 13 }, rowValue: { color: colors.dark, fontSize: 12, fontWeight: "600" }, delete: { alignItems: "center", padding: 15 } };
