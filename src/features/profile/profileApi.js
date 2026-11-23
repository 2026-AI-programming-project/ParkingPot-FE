import { api, unwrapData } from "../../lib/api";

const PROFILE_PATH = "/api/users/me";

export async function updateProfile(payload, token) {
  return unwrapData(
    await api(PROFILE_PATH, { method: "PATCH", token, body: payload }),
    ["user"],
  );
}

export function requestEmailChangeCode(email, token) {
  return api("/api/auth/email-verifications", {
    method: "POST",
    token,
    body: { email, purpose: "email_change" },
  });
}

export function verifyCurrentPassword(password, token) {
  return api("/api/users/me/password/verify", {
    method: "POST",
    token,
    body: { password },
  });
}

export function deleteAccount(token) {
  return api(PROFILE_PATH, { method: "DELETE", token });
}
