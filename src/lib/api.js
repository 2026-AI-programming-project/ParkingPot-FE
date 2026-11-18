const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.57:8000").replace(/\/$/, "");

export async function api(path, { method = "GET", body, token } = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const detail = data?.detail;
    const reason = Array.isArray(detail)
      ? detail.map((item) => `${Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") + ": " : ""}${item.msg || ""}`).join("; ")
      : typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : "";
    throw new Error(`${data?.message || reason || "요청에 실패했습니다."} (${response.status}) · ${method} ${response.url || url}`);
  }
  return data;
}

export function listFrom(data, keys = []) {
  if (Array.isArray(data)) return data;
  return [...keys, "items", "results", "data"].map((key) => data?.[key]).find(Array.isArray) || [];
}
