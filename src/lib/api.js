const configuredApiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
const API_BASE_URL = configuredApiBaseUrl
  ? ( /^https?:\/\//i.test(configuredApiBaseUrl)
      ? configuredApiBaseUrl
      : `http://${configuredApiBaseUrl}`
    ).replace(/\/+$/, "")
  : "";

function formatError(data, status) {
  const detail = data?.detail;
  const message = Array.isArray(detail)
    ? detail
        .map((item) => {
          const location = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== "body").join(".")
            : "";
          return [location, item.msg].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join("; ")
    : typeof detail === "string"
      ? detail
      : data?.message || (detail ? JSON.stringify(detail) : "요청을 처리하지 못했습니다.");

  return `${message} (${status})`;
}

export async function api(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error(".env.local에 EXPO_PUBLIC_API_BASE_URL을 설정해 주세요.");
  }

  const { method = "GET", body, token, signal } = options;
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  let response;

  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error(
      `API 서버에 연결할 수 없습니다. 주소와 서버 실행 상태를 확인해 주세요. (${API_BASE_URL})`,
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) throw new Error(formatError(data, response.status));
  return data;
}

export function listFrom(data, keys = []) {
  if (Array.isArray(data)) return data;
  const containers = [data, data?.data];
  for (const container of containers) {
    if (Array.isArray(container)) return container;
    const result = [...keys, "items", "results", "data"]
      .map((key) => container?.[key])
      .find(Array.isArray);
    if (result) return result;
  }
  return [];
}

export function unwrapData(data, keys = []) {
  for (const container of [data, data?.data]) {
    for (const key of keys) {
      if (container?.[key] != null) return container[key];
    }
  }
  return data?.data ?? data;
}
