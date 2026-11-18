import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { api, listFrom } from "../lib/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [anonymousToken, setAnonymousToken] = useState(null);

  const login = useCallback(async (email, password) => {
    const result = await api("/api/auth/login", { method: "POST", body: { email, password } });
    const data = result?.data || result;
    if (!data?.access_token) throw new Error("로그인 토큰을 받지 못했습니다.");
    await SecureStore.setItemAsync("parkingpot-token", data.access_token);
    setToken(data.access_token);
    setUser(data.user || null);
    return data.user;
  }, []);

  const requestSignupCode = useCallback((email) => api("/api/auth/email-verifications", {
    method: "POST", body: { email, purpose: "signup" },
  }), []);

  const signup = useCallback(async ({ email, nickname, verification_code, password, password_confirm }) => {
    return api("/api/auth/signup", {
      method: "POST", body: { email, nickname, verification_code, password, password_confirm },
    });
  }, []);

  const signOut = useCallback(async () => {
    try { if (token) await api("/api/auth/logout", { method: "POST", token }); }
    finally {
      await SecureStore.deleteItemAsync("parkingpot-token");
      setToken(null); setUser(null);
    }
  }, [token]);

  const getAnonymousToken = useCallback(async () => {
    if (anonymousToken) return anonymousToken;
    const stored = await SecureStore.getItemAsync("parkingpot-anonymous-token");
    if (stored) { setAnonymousToken(stored); return stored; }
    const result = await api("/sessions/anonymous", { method: "POST" });
    if (!result?.access_token) throw new Error("익명 세션 토큰을 받지 못했습니다.");
    await SecureStore.setItemAsync("parkingpot-anonymous-token", result.access_token);
    setAnonymousToken(result.access_token);
    return result.access_token;
  }, [anonymousToken]);

  const loadFavorites = useCallback(async () => {
    const result = await api("/favorites", { token: await getAnonymousToken() });
    const data = listFrom(result, ["favorites"]);
    setFavorites(data);
    return data;
  }, [getAnonymousToken]);

  const toggleFavorite = useCallback(async (parkingId) => {
    const exists = favorites.some((item) => String(item.id ?? item.parking_id) === String(parkingId));
    await api(`/favorites/${parkingId}`, { method: exists ? "DELETE" : "PUT", token: await getAnonymousToken() });
    await loadFavorites();
  }, [favorites, getAnonymousToken, loadFavorites]);

  const value = useMemo(() => ({ token, user, setUser, favorites, setFavorites, login, signup, requestSignupCode, signOut, loadFavorites, toggleFavorite, getAnonymousToken }), [token, user, favorites, login, signup, requestSignupCode, signOut, loadFavorites, toggleFavorite, getAnonymousToken]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
