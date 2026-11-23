import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { api, listFrom } from "../lib/api";

const FavoritesContext = createContext(null);
const TOKEN_KEY = "parkingpot-anonymous-token";

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const tokenPromise = useRef(null);
  const favoritesRequest = useRef(null);
  const pendingIds = useRef(new Set());

  const getAnonymousToken = useCallback(async () => {
    if (!tokenPromise.current) {
      tokenPromise.current = (async () => {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) return storedToken;

        const response = await api("/sessions/anonymous", { method: "POST" });
        const token = response?.access_token ?? response?.data?.access_token;
        if (!token) throw new Error("익명 세션 토큰을 받지 못했습니다.");
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        return token;
      })().catch((error) => {
        tokenPromise.current = null;
        throw error;
      });
    }
    return tokenPromise.current;
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!favoritesRequest.current) {
      const request = (async () => {
        const response = await api("/favorites", { token: await getAnonymousToken() });
        const result = listFrom(response, ["favorites"]);
        setFavorites(result);
        return result;
      })();
      favoritesRequest.current = request;
      request.finally(() => {
        if (favoritesRequest.current === request) favoritesRequest.current = null;
      }).catch(() => {});
    }
    return favoritesRequest.current;
  }, [getAnonymousToken]);

  const toggleFavorite = useCallback(
    async (parkingId) => {
      if (parkingId == null) return;
      const key = String(parkingId);
      if (pendingIds.current.has(key)) return;
      pendingIds.current.add(key);
      const isSaved = favorites.some(
        (item) => String(item.id ?? item.parking_id) === key,
      );
      try {
        await api(`/favorites/${encodeURIComponent(parkingId)}`, {
          method: isSaved ? "DELETE" : "PUT",
          token: await getAnonymousToken(),
        });
        await loadFavorites();
      } finally {
        pendingIds.current.delete(key);
      }
    },
    [favorites, getAnonymousToken, loadFavorites],
  );

  const value = useMemo(
    () => ({ favorites, setFavorites, loadFavorites, toggleFavorite, getAnonymousToken }),
    [favorites, loadFavorites, toggleFavorite, getAnonymousToken],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside FavoritesProvider");
  return value;
}
