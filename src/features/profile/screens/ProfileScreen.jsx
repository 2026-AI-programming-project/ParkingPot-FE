import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, FormField, colors, ui } from "../../../components/ui";
import { useAuth } from "../../../context/AuthContext";
import { deleteAccount, requestEmailChangeCode, updateProfile, verifyCurrentPassword } from "../profileApi";

export default function ProfileScreen() {
  const { token, user, setUser, signOut } = useAuth();
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const runAction = async (action, successMessage) => {
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(successMessage);
      return { ok: true, value: result };
    } catch (cause) {
      setError(cause?.message || "요청을 처리하지 못했습니다.");
      return { ok: false, value: null };
    }
  };

  const saveNickname = async () => {
    const value = nickname.trim();
    if (!value) return setError("닉네임을 입력해 주세요.");
    const result = await runAction(() => updateProfile({ nickname: value }, token), "닉네임을 변경했습니다.");
    if (result?.ok && result.value) {
      setUser(result.value);
      setEditingNickname(false);
    }
  };

  const sendEmailCode = async () => {
    const value = email.trim();
    if (!value) return setError("새 이메일 주소를 입력해 주세요.");
    const result = await runAction(() => requestEmailChangeCode(value, token), "인증 코드를 요청했습니다.");
    if (result?.ok) setCodeSent(true);
  };

  const saveEmail = async () => {
    if (!code.trim()) return setError("인증 코드를 입력해 주세요.");
    const result = await runAction(
      () => updateProfile({ email: email.trim(), verification_code: code.trim() }, token),
      "이메일 주소를 변경했습니다.",
    );
    if (result?.ok && result.value) {
      setUser(result.value);
      setEmail("");
      setCode("");
      setCodeSent(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) return setError("현재 비밀번호와 새 비밀번호를 입력해 주세요.");
    const verified = await runAction(() => verifyCurrentPassword(currentPassword, token), "현재 비밀번호를 확인했습니다.");
    if (!verified?.ok) return;
    const result = await runAction(() => updateProfile({ password: newPassword }, token), "비밀번호를 변경했습니다.");
    if (result?.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert("회원 탈퇴", "계정을 삭제하면 되돌릴 수 없습니다. 계속할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "계정 삭제",
        style: "destructive",
        onPress: async () => {
          const result = await runAction(() => deleteAccount(token), "계정을 삭제했습니다.");
          if (result?.ok) {
            try {
              await signOut();
            } catch {
              // Account deletion already succeeded; local auth state is cleared by signOut.
            }
            router.replace("/");
          }
        },
      },
    ]);
  };

  const logout = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (cause) {
      setError(cause?.message || "로그아웃하지 못했습니다.");
    }
  };

  return (
    <SafeAreaView style={ui.page} edges={["top"]}>
      <BrandHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={ui.eyebrow}>내 정보</Text>
        <Text style={ui.title}>마이페이지</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.nickname?.slice(0, 1) || "?"}</Text></View>
          <View style={styles.profileDetails}>
            <Text style={styles.nickname}>{user?.nickname || "회원"}</Text>
            <Text style={ui.subtitle}>{user?.email || ""}</Text>
          </View>
          <Pressable onPress={() => { setEditingNickname((value) => !value); setNickname(user?.nickname || ""); }}>
            <Text style={styles.link}>{editingNickname ? "닫기" : "수정"}</Text>
          </Pressable>
        </View>

        {editingNickname && (
          <View style={ui.form}>
            <Text style={styles.section}>닉네임 변경</Text>
            <FormField label="새 닉네임" value={nickname} onChangeText={setNickname} maxLength={30} />
            <Action title="저장" onPress={saveNickname} />
          </View>
        )}

        <View style={ui.form}>
          <Text style={styles.section}>계정 정보</Text>
          <InfoRow label="이메일" value={user?.email || "정보 없음"} />
          <InfoRow label="닉네임" value={user?.nickname || "정보 없음"} />
        </View>

        <View style={ui.form}>
          <Text style={styles.section}>이메일 변경</Text>
          <FormField label="새 이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="name@example.com" />
          <Action title="인증 코드 요청" onPress={sendEmailCode} />
          {codeSent && <>
            <FormField label="인증 코드" value={code} onChangeText={setCode} keyboardType="number-pad" />
            <Action title="이메일 변경" onPress={saveEmail} />
          </>}
        </View>

        <View style={ui.form}>
          <Text style={styles.section}>비밀번호 변경</Text>
          <FormField label="현재 비밀번호" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
          <FormField label="새 비밀번호" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
          <Action title="비밀번호 변경" onPress={savePassword} />
        </View>

        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        <Action title="로그아웃" onPress={logout} />
        <Pressable style={styles.deleteButton} onPress={confirmDeleteAccount}>
          <Text style={styles.deleteText}>회원 탈퇴</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ title, onPress }) {
  return <Pressable style={ui.outline} onPress={onPress}><Text style={ui.outlineText}>{title}</Text></Pressable>;
}

function InfoRow({ label, value }) {
  return <View style={styles.infoRow}><Text style={ui.subtitle}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = {
  content: { paddingHorizontal: 18, paddingTop: 23, paddingBottom: 32, gap: 14 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginVertical: 2, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.pale, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.green, fontWeight: "800", fontSize: 20 },
  profileDetails: { flex: 1 },
  nickname: { color: colors.dark, fontWeight: "700", fontSize: 15 },
  link: { color: colors.green, fontWeight: "700" },
  section: { color: colors.dark, fontWeight: "800", fontSize: 15 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 },
  infoValue: { color: colors.dark, fontSize: 12, fontWeight: "600", maxWidth: "65%" },
  notice: { color: colors.green, fontSize: 12 },
  deleteButton: { alignItems: "center", padding: 15 },
  deleteText: { color: colors.red, fontWeight: "600" },
};
