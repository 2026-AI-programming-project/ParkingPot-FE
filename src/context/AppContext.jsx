import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { api, listFrom } from "../lib/api";

const AppContext = createContext(null);
export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [anonymousToken, setAnonymousToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync("parkingpot-token").then((stored) => {
      if (active) setToken(stored);
    }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api("/api/auth/login", { method: "POST", body: { email, password } });
    const data = result?.data || result;
    if (!data?.access_token) throw new Error("Login response did not include an access token.");
    await SecureStore.setItemAsync("parkingpot-token", data.access_token);
    setToken(data.access_token); setUser(data.user || null);
    return data.user;
  }, []);
  const requestSignupCode = useCallback((email) => api("/api/auth/email-verifications", { method: "POST", body: { email, purpose: "signup" } }), []);
  const signup = useCallback((payload) => api("/api/auth/signup", { method: "POST", body: payload }), []);
  const signOut = useCallback(async () => {
    try { if (token) await api("/api/auth/logout", { method: "POST", token }); }
    finally { await SecureStore.deleteItemAsync("parkingpot-token"); setToken(null); setUser(null); }
  }, [token]);
  const getAnonymousToken = useCallback(async () => {
    if (anonymousToken) return anonymousToken;
    const stored = await SecureStore.getItemAsync("parkingpot-anonymous-token");
    if (stored) { setAnonymousToken(stored); return stored; }
    const result = await api("/sessions/anonymous", { method: "POST" });
    const value = result?.access_token || result?.data?.access_token;
    if (!value) throw new Error("Anonymous session response did not include a token.");
    await SecureStore.setItemAsync("parkingpot-anonymous-token", value); setAnonymousToken(value); return value;
  }, [anonymousToken]);
  const loadFavorites = useCallback(async () => {
    const result = await api("/favorites", { token: await getAnonymousToken() });
    const data = listFrom(result, ["favorites"]); setFavorites(data); return data;
  }, [getAnonymousToken]);
  const toggleFavorite = useCallback(async (parkingId) => {
    if (parkingId == null) return;
    const exists = favorites.some((item) => String(item.id ?? item.parking_id) === String(parkingId));
    await api(`/favorites/${encodeURIComponent(parkingId)}`, { method: exists ? "DELETE" : "PUT", token: await getAnonymousToken() });
    await loadFavorites();
  }, [favorites, getAnonymousToken, loadFavorites]);
  const value = useMemo(() => ({ token, user, setUser, favorites, setFavorites, ready, login, signup, requestSignupCode, signOut, loadFavorites, toggleFavorite, getAnonymousToken }), [token, user, favorites, ready, login, signup, requestSignupCode, signOut, loadFavorites, toggleFavorite, getAnonymousToken]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
