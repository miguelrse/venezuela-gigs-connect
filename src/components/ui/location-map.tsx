import { MapPin, Navigation, Radius } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  label?: string;
  className?: string;
}

const getZoomForRadius = (radiusKm?: number) => {
  if (!radiusKm) return 15;
  if (radiusKm <= 2) return 13;
  if (radiusKm <= 5) return 12;
  if (radiusKm <= 15) return 11;
  if (radiusKm <= 30) return 10;
  return 9;
};

const getOpenStreetMapEmbedUrl = (latitude: number, longitude: number, radiusKm?: number) => {
  const zoom = getZoomForRadius(radiusKm);
  const delta = Math.max(0.01, (radiusKm || 1.5) / 95);
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}&zoom=${zoom}`;
};

export function LocationMap({ latitude, longitude, radiusKm, label = 'Ubicación del servicio', className }: LocationMapProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-sm', className)}>
      <div className="relative min-h-[260px]">
        {hasCoordinates ? (
          <>
            <iframe
              title={label}
              src={getOpenStreetMapEmbedUrl(latitude, longitude, radiusKm)}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {radiusKm ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="rounded-full border-2 border-primary/50 bg-primary/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.03)]"
                  style={{ width: `${Math.min(220, 70 + radiusKm * 3)}px`, height: `${Math.min(220, 70 + radiusKm * 3)}px` }}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-sky-500/10 to-emerald-500/10 p-6 text-center">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="relative rounded-2xl border bg-background/85 p-5 shadow-sm backdrop-blur">
              <Navigation className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Mapa listo para ubicación exacta</p>
              <p className="mt-1 text-sm text-muted-foreground">Cuando el cliente comparta su ubicación, se mostrará un mapa real de OpenStreetMap.</p>
            </div>
          </div>
        )}

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

        {hasCoordinates ? (
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 rounded-xl border bg-background/90 p-3 text-xs text-muted-foreground shadow-sm backdrop-blur">
            Coordenadas: {latitude.toFixed(5)}, {longitude.toFixed(5)} · Mapa gratuito de OpenStreetMap
          </div>
        ) : null}
      </div>
    </div>
  );
}
