export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const haversineDistanceKm = (from: Coordinates, to: Coordinates) => {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRad(to.latitude - from.latitude);
  const deltaLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistanceKm = (distance: number) => {
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  if (distance < 10) return `${distance.toFixed(1)} km`;
  return `${Math.round(distance)} km`;
};

export const getCurrentCoordinates = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no permite compartir ubicación.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });


const GEO_MARKER_REGEX = /\n?\n?\[geo:([-0-9.]+),([-0-9.]+)(?:,([0-9.]+))?\]\s*$/;

export const buildGeoMarker = (coordinates: Coordinates, accuracyM?: number | null) =>
  `[geo:${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}${accuracyM ? `,${Math.round(accuracyM)}` : ''}]`;

export const appendGeoMarker = (description: string, coordinates?: Coordinates | null, accuracyM?: number | null) => {
  const cleanDescription = stripGeoMarker(description);
  if (!coordinates) return cleanDescription;
  return `${cleanDescription}

${buildGeoMarker(coordinates, accuracyM)}`;
};

export const parseGeoMarker = (text?: string | null): Coordinates | null => {
  if (!text) return null;
  const match = text.match(GEO_MARKER_REGEX);
  if (!match) return null;
  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
  };
};

export const stripGeoMarker = (text?: string | null) => text?.replace(GEO_MARKER_REGEX, '').trim() || '';
