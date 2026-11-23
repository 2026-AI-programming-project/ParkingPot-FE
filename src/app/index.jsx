import React, { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader, FormField, colors, ui } from "../components/ui";
import { useApp } from "../context/AppContext";
export default function LoginScreen() {
  const { token, ready, login, signup, requestSignupCode } = useApp();
  const [signupMode, setSignupMode] = useState(false), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [nickname, setNickname] = useState(""), [code, setCode] = useState(""), [codeSent, setCodeSent] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const passwordInput = useRef(null);
  if (!ready) return null;
  if (token) return <Redirect href="/(tabs)/home" />;
  const sendCode = async () => { setMessage(""); try { await requestSignupCode(email.trim()); setCodeSent(true); setMessage("Verification code sent."); } catch (e) { setMessage(e.message); } };
  const submit = async () => { setMessage(""); setBusy(true); try {
    if (signupMode) { if (password !== confirm) throw new Error("Passwords do not match."); if (!codeSent) throw new Error("Request an email verification code first."); await signup({ email: email.trim(), nickname: nickname.trim(), verification_code: code, password, password_confirm: confirm }); setSignupMode(false); setCodeSent(false); setPassword(""); setConfirm(""); setMessage("Account created. Sign in to continue."); }
    else { await login(email.trim(), password); router.replace("/(tabs)/home"); }
  } catch (e) { setMessage(e.message || "Something went wrong."); } finally { setBusy(false); } };
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><BrandHeader /><KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.formWrap}><Text style={ui.eyebrow}>PARKINGPOT</Text><Text style={styles.title}>{signupMode ? "Create your account" : "Find parking nearby"}</Text><View style={ui.form}>
    <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="name@example.com" returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} />
    {signupMode && <><Pressable style={ui.outline} onPress={sendCode}><Text style={ui.outlineText}>Send verification code</Text></Pressable>{codeSent && <FormField label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" /> }<FormField label="Nickname" value={nickname} onChangeText={setNickname} /></>}
    <FormField ref={passwordInput} label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" returnKeyType="go" onSubmitEditing={submit} />
    {signupMode && <FormField label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />}
    <Pressable style={[ui.primary, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}>{busy ? <ActivityIndicator color={colors.white} /> : <Text style={ui.primaryText}>{signupMode ? "Create account" : "Sign in"}</Text>}</Pressable>
    <Pressable style={styles.toggle} onPress={() => { setSignupMode(!signupMode); setMessage(""); setCodeSent(false); }}><Text style={styles.toggleText}>{signupMode ? "Back to sign in" : "Create an account"}</Text></Pressable></View>{!!message && <Text style={ui.error}>{message}</Text>}</View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles = { safe: { flex: 1, backgroundColor: colors.bg }, fill: { flex: 1 }, content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 24 }, formWrap: { width: "100%", maxWidth: 390, alignSelf: "center" }, title: { color: colors.dark, fontSize: 29, fontWeight: "800", letterSpacing: -0.8, marginBottom: 17 }, toggle: { alignItems: "center", paddingVertical: 6 }, toggleText: { color: colors.green, fontWeight: "700", fontSize: 13 } };
