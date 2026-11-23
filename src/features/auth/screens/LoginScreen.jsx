import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, FormField, colors, ui } from "../../../components/ui";
import { useAuth } from "../../../context/AuthContext";

export default function LoginScreen() {
  const { ready, login, signup, requestSignupCode } = useAuth();
  const [signupMode, setSignupMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const passwordInput = useRef(null);

  const sendVerificationCode = async () => {
    if (!ready || busy) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setMessage("이메일 주소를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await requestSignupCode(normalizedEmail);
      setCodeSent(true);
      setMessage("인증 코드를 보냈습니다.");
    } catch (cause) {
      setMessage(cause?.message || "인증 코드를 보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!ready || busy) return;
    setMessage("");
    if (!email.trim() || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      if (signupMode) {
        if (!codeSent) throw new Error("먼저 이메일 인증 코드를 요청해 주세요.");
        if (password !== passwordConfirm) throw new Error("비밀번호가 서로 일치하지 않습니다.");
        if (!nickname.trim()) throw new Error("닉네임을 입력해 주세요.");
        await signup({
          email: email.trim(),
          nickname: nickname.trim(),
          verification_code: verificationCode.trim(),
          password,
          password_confirm: passwordConfirm,
        });
        setSignupMode(false);
        setCodeSent(false);
        setPassword("");
        setPasswordConfirm("");
        setVerificationCode("");
        setMessage("가입이 완료됐습니다. 로그인해 주세요.");
      } else {
        await login(email.trim(), password);
        router.replace("/(tabs)/home");
      }
    } catch (cause) {
      setMessage(cause?.message || "요청을 처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setSignupMode((value) => !value);
    setMessage("");
    setCodeSent(false);
    setVerificationCode("");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <BrandHeader />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.formWrap}>
            <Text style={ui.eyebrow}>PARKINGPOT</Text>
            <Text style={styles.title}>{signupMode ? "회원가입" : "주차를 더 편리하게"}</Text>
            <View style={ui.form}>
              <FormField
                label="이메일"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                placeholder="이메일 주소"
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
              />
              {signupMode && <>
                <Pressable style={[ui.outline, (!ready || busy) && styles.disabled]} disabled={!ready || busy} onPress={sendVerificationCode}>
                  <Text style={ui.outlineText}>인증 코드 요청</Text>
                </Pressable>
                {codeSent && <FormField label="인증 코드" value={verificationCode} onChangeText={setVerificationCode} keyboardType="number-pad" placeholder="인증 코드" />}
                <FormField label="닉네임" value={nickname} onChangeText={setNickname} maxLength={30} placeholder="닉네임" />
              </>}
              <FormField
                ref={passwordInput}
                label="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={signupMode ? "new-password" : "current-password"}
                placeholder="비밀번호"
                returnKeyType={signupMode ? "next" : "go"}
                onSubmitEditing={signupMode ? undefined : submit}
              />
              {signupMode && <FormField label="비밀번호 확인" value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry autoCapitalize="none" autoComplete="new-password" placeholder="비밀번호 확인" />}
              <Pressable style={[ui.primary, (!ready || busy) && styles.disabled]} disabled={!ready || busy} onPress={submit}>
                {busy ? <ActivityIndicator color={colors.white} /> : <Text style={ui.primaryText}>{signupMode ? "가입하기" : "로그인"}</Text>}
              </Pressable>
              <Pressable style={styles.toggle} onPress={toggleMode} disabled={!ready || busy}>
                <Text style={styles.toggleText}>{signupMode ? "로그인으로 돌아가기" : "회원가입"}</Text>
              </Pressable>
            </View>
            {!!message && <Text accessibilityRole="alert" style={ui.error}>{message}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  safe: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 24 },
  formWrap: { width: "100%", maxWidth: 390, alignSelf: "center" },
  title: { color: colors.dark, fontSize: 29, fontWeight: "800", letterSpacing: -0.8, marginBottom: 17 },
  toggle: { alignItems: "center", paddingVertical: 6 },
  toggleText: { color: colors.green, fontWeight: "700", fontSize: 13 },
  disabled: { opacity: 0.6 },
};
