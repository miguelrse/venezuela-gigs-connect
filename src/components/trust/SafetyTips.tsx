import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SafetyTipsProps {
  audience?: 'client' | 'specialist';
  compact?: boolean;
}

const CLIENT_TIPS = [
  'Verifica el perfil, portafolio y reseñas antes de contratar.',
  'Nunca pagues por adelantado sin ver avances o acordar entregables.',
  'Mantén la comunicación inicial dentro de ChambaLink.',
  'Desconfía de precios muy por debajo del mercado.',
];

const SPECIALIST_TIPS = [
  'Confirma la ubicación y el alcance del trabajo antes de asistir.',
  'Acuerda condiciones y precio por escrito antes de empezar.',
  'No compartas datos bancarios ni códigos de verificación.',
  'Reporta cualquier comportamiento sospechoso desde el perfil o trabajo.',
];

export function SafetyTips({ audience = 'client', compact = false }: SafetyTipsProps) {
  const tips = audience === 'client' ? CLIENT_TIPS : SPECIALIST_TIPS;

  if (compact) {
    return (
      <Alert className="border-info/30 bg-info/5">
        <ShieldCheck className="h-4 w-4 text-info" />
        <AlertTitle className="text-sm">Consejos de seguridad</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          {tips[0]} <span className="opacity-70">Toca para ver más.</span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-info/30 bg-info/5">
      <ShieldCheck className="h-4 w-4 text-info" />
      <AlertTitle>Consejos de seguridad</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
