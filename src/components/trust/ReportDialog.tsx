import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReportTargetType = 'user' | 'job' | 'review' | 'bid';

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  triggerLabel?: string;
  triggerVariant?: 'ghost' | 'outline' | 'link';
  triggerSize?: 'sm' | 'default' | 'icon';
  compact?: boolean;
}

const REASONS: Record<ReportTargetType, { value: string; label: string }[]> = {
  user: [
    { value: 'fraude', label: 'Posible estafa o fraude' },
    { value: 'abuso', label: 'Lenguaje abusivo u ofensivo' },
    { value: 'suplantacion', label: 'Suplantación de identidad' },
    { value: 'contacto_fuera', label: 'Intenta evadir la plataforma' },
    { value: 'otro', label: 'Otro' },
  ],
  job: [
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'ilegal', label: 'Trabajo ilegal o peligroso' },
    { value: 'informacion_falsa', label: 'Información falsa o engañosa' },
    { value: 'duplicado', label: 'Publicación duplicada' },
    { value: 'otro', label: 'Otro' },
  ],
  review: [
    { value: 'falsa', label: 'Reseña falsa' },
    { value: 'ofensiva', label: 'Contenido ofensivo' },
    { value: 'irrelevante', label: 'No relacionada al trabajo' },
    { value: 'otro', label: 'Otro' },
  ],
  bid: [
    { value: 'spam', label: 'Oferta sin sentido o spam' },
    { value: 'abuso', label: 'Lenguaje abusivo' },
    { value: 'fraude', label: 'Posible fraude' },
    { value: 'otro', label: 'Otro' },
  ],
};

const TARGET_LABEL: Record<ReportTargetType, string> = {
  user: 'usuario',
  job: 'trabajo',
  review: 'reseña',
  bid: 'oferta',
};

export function ReportDialog({
  targetType,
  targetId,
  triggerLabel,
  triggerVariant = 'ghost',
  triggerSize = 'sm',
  compact = false,
}: ReportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para reportar');
      return;
    }
    if (!reason) {
      toast.error('Selecciona un motivo');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('reports' as any).insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('Ya reportaste este contenido');
      } else {
        console.error(error);
        toast.error('No se pudo enviar el reporte');
      }
      return;
    }

    toast.success('Reporte enviado. Gracias por ayudar a mantener la plataforma segura.');
    setReason('');
    setDetails('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className="text-muted-foreground hover:text-destructive">
          <Flag className={compact ? 'h-4 w-4' : 'h-4 w-4 mr-2'} />
          {!compact && (triggerLabel ?? 'Reportar')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar {TARGET_LABEL[targetType]}</DialogTitle>
          <DialogDescription>
            Tu reporte es confidencial. Nuestro equipo lo revisará y tomará acción si corresponde.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {REASONS[targetType].map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Detalles (opcional)</Label>
            <Textarea
              placeholder="Cuéntanos más sobre lo sucedido..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting ? 'Enviando...' : 'Enviar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
