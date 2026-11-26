import { api, listFrom, unwrapData } from "../../lib/api";

const PARKING_PATH = "/parking-lots";

export async function searchParkingLots({
  query = "",
  latitude,
  longitude,
  radius = 5000,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (query.trim()) params.set("name", query.trim());
  if (Number.isFinite(latitude)) params.set("lat", String(latitude));
  if (Number.isFinite(longitude)) params.set("lon", String(longitude));
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    params.set("radius_m", String(radius));
    params.set("sort", "distance");
  }

  const response = await api(`${PARKING_PATH}?${params}`);
  return listFrom(response, ["parking_lots"]);
}

export async function getParkingDetail(id) {
  return unwrapData(await api(`${PARKING_PATH}/${encodeURIComponent(id)}`), ["parking_lot"]);
}

export async function getParkingReviews(id) {
  return listFrom(
    await api(`${PARKING_PATH}/${encodeURIComponent(id)}/reviews`),
    ["reviews"],
  );
}

export function rateParking(id, score, token) {
  return api(`${PARKING_PATH}/${encodeURIComponent(id)}/rating`, {
    method: "PUT",
    token,
    body: { score },
  });
}

export function createParkingReview(id, content, token) {
  return api(`${PARKING_PATH}/${encodeURIComponent(id)}/reviews`, {
    method: "POST",
    token,
    body: { content },
  });
}
