import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  onSuccess: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  contractId,
  reviewerId,
  revieweeId,
  revieweeName,
  onSuccess,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      contract_id: contractId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
    });

    setIsSubmitting(false);

    if (error) {
      console.error('Review error:', error);
      toast.error('Error al enviar la reseña');
      return;
    }

    toast.success('¡Reseña enviada exitosamente!');
    setRating(0);
    setComment('');
    onOpenChange(false);
    onSuccess();
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calificar a {revieweeName}</DialogTitle>
          <DialogDescription>
            ¿Cómo fue tu experiencia trabajando con esta persona?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <span className="text-sm text-muted-foreground">
                {displayRating === 1 && 'Malo'}
                {displayRating === 2 && 'Regular'}
                {displayRating === 3 && 'Bueno'}
                {displayRating === 4 && 'Muy bueno'}
                {displayRating === 5 && 'Excelente'}
              </span>
            )}
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Escribe un comentario (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
