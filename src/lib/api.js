const API_BASE = (
  process.env.EXPO_PUBLIC_API_BASE_URL || ""
).replace(/\/$/, "");

export async function api(path, { method = "GET", body, token } = {}) {
  if (!API_BASE) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL을 설정해 주세요. 휴대폰에서는 localhost 대신 PC의 Wi-Fi IP 주소를 사용해야 합니다.",
    );
  }
  const url = `${API_BASE}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(
      `API 서버에 연결할 수 없습니다: ${API_BASE}\nPC에서 서버가 실행 중인지, 휴대폰과 PC가 같은 Wi-Fi인지 확인해 주세요. 서버는 0.0.0.0:8000에서 열어야 합니다.`,
    );
  }
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const detail = data?.detail;
    const reason = Array.isArray(detail)
      ? detail
          .map(
            (item) =>
              `${Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") + ": " : ""}${item.msg || ""}`,
          )
          .join("; ")
      : typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : "";
    throw new Error(
      `${data?.message || reason || "요청에 실패했습니다."} (${response.status}) · ${method} ${response.url || url}`,
    );
  }
  return data;
}

export function listFrom(data, keys = []) {
  if (Array.isArray(data)) return data;
  return (
    [...keys, "items", "results", "data"]
      .map((key) => data?.[key])
      .find(Array.isArray) || []
  );
}
