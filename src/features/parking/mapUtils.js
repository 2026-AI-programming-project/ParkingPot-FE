export function coordinatesFor(item) {
  const point = item?.location && !Array.isArray(item.location) ? item.location : item;
  const toCoordinate = (value) => {
    if (value == null || value === "") return Number.NaN;
    const number = Number(value);
    return Number.isFinite(number) ? number : Number.NaN;
  };
  let latitude = toCoordinate(point?.latitude ?? point?.lat);
  let longitude = toCoordinate(point?.longitude ?? point?.lon ?? point?.lng);
  const coordinates = item?.coordinates ?? point?.coordinates;
  if (
    (!Number.isFinite(latitude) || !Number.isFinite(longitude)) &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2
  ) {
    longitude = toCoordinate(coordinates[0]);
    latitude = toCoordinate(coordinates[1]);
  }
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return { latitude, longitude };
}
