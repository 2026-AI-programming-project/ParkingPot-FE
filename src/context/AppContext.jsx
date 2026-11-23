import React from "react";
import { AuthProvider } from "./AuthContext";
import { FavoritesProvider } from "./FavoritesContext";

export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AuthProvider>
  );
}
