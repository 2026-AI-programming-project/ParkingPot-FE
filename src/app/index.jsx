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
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, FormField, colors, ui } from "../components/ui";
import { useApp } from "../context/AppContext";

export default function LoginScreen() {
  const { token, login, signup, requestSignupCode } = useApp();
  const [signupMode, setSignupMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const passwordInput = useRef(null);

  if (token) return <Redirect href="/(tabs)/home" />;
  const onSendCode = async () => {
    setMessage("");
    try {
      await requestSignupCode(email);
      setCodeSent(true);
      setMessage("인증번호를 요청했습니다.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const onSubmit = async () => {
    setMessage("");
    setBusy(true);
    try {
      if (signupMode) {
        if (password !== confirm)
          throw new Error("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        await signup({
          email,
          nickname,
          verification_code: code,
          password,
          password_confirm: confirm,
        });
        setSignupMode(false);
        setCodeSent(false);
        setPassword("");
        setConfirm("");
        setMessage("가입이 완료되었습니다. 로그인해 주세요.");
      } else {
        await login(email, password);
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <BrandHeader />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <View style={styles.formWrap}>
            <Text style={ui.eyebrow}>
              {signupMode ? "새 계정 만들기" : "주차를 더 편하게"}
            </Text>
            <Text style={styles.title}>
              {signupMode ? "회원가입" : "로그인"}
            </Text>
            <View style={ui.form}>
              <FormField
                label="이메일"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="이메일 주소"
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
                blurOnSubmit={false}
              />
              {signupMode && (
                <>
                  <Pressable style={ui.outline} onPress={onSendCode}>
                    <Text style={ui.outlineText}>인증번호 요청</Text>
                  </Pressable>
                  {codeSent && (
                    <FormField
                      label="인증번호"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      placeholder="인증번호"
                    />
                  )}
                  <FormField
                    label="닉네임"
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="닉네임"
                  />
                </>
              )}
              <FormField
                ref={passwordInput}
                label="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="비밀번호"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
              />
              {signupMode && (
                <FormField
                  label="비밀번호 확인"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="비밀번호 확인"
                />
              )}
              <Pressable
                style={[ui.primary, busy && styles.disabled]}
                disabled={busy}
                onPress={onSubmit}
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={ui.primaryText}>
                    {signupMode ? "가입하기" : "로그인"}
                  </Text>
                )}
              </Pressable>
              <Pressable
                style={styles.toggle}
                onPress={() => {
                  setSignupMode(!signupMode);
                  setMessage("");
                  setCodeSent(false);
                }}
              >
                <Text style={styles.toggleText}>
                  {signupMode ? "로그인으로 돌아가기" : "회원가입"}
                </Text>
              </Pressable>
            </View>
            {!!message && <Text style={ui.error}>{message}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  safe: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  formWrap: { width: "100%", maxWidth: 390, alignSelf: "center" },
  title: {
    color: colors.dark,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 17,
  },
  toggle: { alignItems: "center", paddingVertical: 6 },
  toggleText: { color: colors.green, fontWeight: "700", fontSize: 13 },
  disabled: { opacity: 0.6 },
};
