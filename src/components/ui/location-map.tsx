import { MapPin, Navigation, Radius } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  label?: string;
  className?: string;
}

export function LocationMap({ latitude, longitude, radiusKm, label = 'Ubicación del servicio', className }: LocationMapProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-sky-500/10 to-emerald-500/10', className)}>
      <div className="relative min-h-[220px] p-4">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute left-6 top-8 h-20 w-32 rounded-full border border-primary/20 bg-background/20 blur-sm" />
        <div className="absolute bottom-8 right-8 h-24 w-40 rounded-full border border-emerald-500/20 bg-background/20 blur-sm" />

        {hasCoordinates ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {radiusKm ? (
              <div
                className="absolute rounded-full border-2 border-primary/40 bg-primary/10"
                style={{ width: `${Math.min(190, 70 + radiusKm * 3)}px`, height: `${Math.min(190, 70 + radiusKm * 3)}px` }}
              />
            ) : null}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30">
              <MapPin className="h-8 w-8" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="rounded-2xl border bg-background/80 p-5 shadow-sm backdrop-blur">
              <Navigation className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Mapa listo para ubicación exacta</p>
              <p className="mt-1 text-sm text-muted-foreground">Cuando el cliente comparta su ubicación, se usará para filtrar por radio.</p>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full border bg-background/85 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            {label}
          </div>
          {radiusKm ? (
            <div className="flex items-center gap-1 rounded-full border bg-background/85 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
              <Radius className="h-3.5 w-3.5 text-primary" />
              Radio {radiusKm} km
            </div>
          ) : null}
        </div>

        {hasCoordinates ? (
          <div className="absolute bottom-4 left-4 right-4 z-10 rounded-xl border bg-background/85 p-3 text-xs text-muted-foreground shadow-sm backdrop-blur">
            Coordenadas guardadas: {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
