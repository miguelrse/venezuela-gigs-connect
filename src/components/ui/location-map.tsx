import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Radius } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

interface LocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  label?: string;
  className?: string;
  selectable?: boolean;
  onLocationSelect?: (latitude: number, longitude: number) => void;
}

const defaultCenter: [number, number] = [10.4806, -66.9036]; // Caracas, Venezuela

const markerIcon = L.divIcon({
  className: '',
  html: '<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function SelectLocation({ onSelect }: { onSelect?: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function LocationMap({
  latitude,
  longitude,
  radiusKm,
  label = 'Ubicación del servicio',
  className,
  selectable = false,
  onLocationSelect,
}: LocationMapProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';
  const center: [number, number] = hasCoordinates ? [latitude, longitude] : defaultCenter;

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-sm', className)}>
      <div className="relative min-h-[320px]">
        <MapContainer
          center={center}
          zoom={hasCoordinates ? 14 : 6}
          scrollWheelZoom
          className="absolute inset-0 z-0 h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={center} />
          <SelectLocation onSelect={selectable ? onLocationSelect : undefined} />
          {hasCoordinates && (
            <>
              {radiusKm ? (
                <Circle
                  center={center}
                  radius={radiusKm * 1000}
                  pathOptions={{ color: 'hsl(var(--primary))', fillColor: 'hsl(var(--primary))', fillOpacity: 0.12, weight: 2 }}
                />
              ) : null}
              <Marker position={center} icon={markerIcon} />
            </>
          )}
        </MapContainer>

        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-full border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {label}
          </div>
          {radiusKm ? (
            <div className="flex items-center gap-1 rounded-full border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
              <Radius className="h-3.5 w-3.5 text-primary" />
              Radio {radiusKm} km
            </div>
          ) : null}
        </div>

        {!hasCoordinates ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-xl border bg-background/90 p-3 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {selectable ? 'Toca el mapa o usa tu ubicación actual para colocar el marcador.' : 'Mapa centrado en Venezuela. Esperando ubicación exacta.'}
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-xl border bg-background/90 p-3 text-xs text-muted-foreground shadow-sm backdrop-blur">
            Coordenadas: {latitude.toFixed(5)}, {longitude.toFixed(5)} · {selectable ? 'Puedes tocar otro punto para mover el marcador.' : 'Mapa gratuito de OpenStreetMap.'}
          </div>
        )}

        {selectable ? (
          <div className="pointer-events-none absolute right-4 top-16 z-10 rounded-full border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            <Navigation className="mr-1 inline h-3.5 w-3.5 text-primary" />
            Mapa interactivo
          </div>
        ) : null}
      </div>
    </div>
  );
}
