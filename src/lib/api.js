const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export async function api(path, { method = "GET", body, token } = {}) {
  if (!API_BASE) throw new Error("Set EXPO_PUBLIC_API_BASE_URL in .env.local.");
  const url = `${API_BASE}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(`Could not connect to the API server at ${API_BASE}. Check that it is running and reachable from this device.`);
  }
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const detail = data?.detail;
    const reason = Array.isArray(detail)
      ? detail.map((item) => `${Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") + ": " : ""}${item.msg || ""}`).filter(Boolean).join("; ")
      : typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : "Request failed";
    throw new Error(`${data?.message || reason} (${response.status})`);
  }
  return data;
}

export function listFrom(data, keys = []) {
  if (Array.isArray(data)) return data;
  return [...keys, "items", "results", "data"].map((key) => data?.[key]).find(Array.isArray) || [];
}
