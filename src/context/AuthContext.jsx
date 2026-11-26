import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "../lib/secureStorage";
import { api, unwrapData } from "../lib/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "parkingpot-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((storedToken) => {
        if (mounted) setToken(storedToken);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const result = unwrapData(response);
    if (!result?.access_token) {
      throw new Error("로그인 응답에 인증 토큰이 없습니다.");
    }

    await SecureStore.setItemAsync(TOKEN_KEY, result.access_token);
    setToken(result.access_token);
    setUser(result.user ?? null);
    return result.user ?? null;
  }, []);

  const requestSignupCode = useCallback(
    (email) =>
      api("/api/auth/email-verifications", {
        method: "POST",
        body: { email, purpose: "signup" },
      }),
    [],
  );

  const signup = useCallback(
    (payload) => api("/api/auth/signup", { method: "POST", body: payload }),
    [],
  );

  const signOut = useCallback(async () => {
    try {
      if (token) await api("/api/auth/logout", { method: "POST", token });
    } finally {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setToken(null);
        setUser(null);
      }
    }
  }, [token]);

  const value = useMemo(
    () => ({ token, user, setUser, ready, login, signup, requestSignupCode, signOut }),
    [token, user, ready, login, signup, requestSignupCode, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
