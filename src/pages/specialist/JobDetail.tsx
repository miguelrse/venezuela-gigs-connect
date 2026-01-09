import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, DollarSign, Calendar, User, Loader2, Send, CheckCircle } from 'lucide-react';
import type { Job, Bid, BidFormData } from '@/types/database';

export default function SpecialistJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [existingBid, setExistingBid] = useState<Bid | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BidFormData>({
    amount: 0,
    message: '',
    eta: '',
  });

  useEffect(() => {
    if (id && user) {
      fetchJob();
      checkExistingBid();
    }
  }, [id, user]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, category:categories(name, icon), client:profiles!jobs_client_id_fkey(full_name, location)')
      .eq('id', id)
      .eq('status', 'open')
      .single();

    if (error || !data) {
      toast.error('Trabajo no encontrado o ya no está disponible');
      navigate('/specialist/browse');
      return;
    }

    setJob(data as unknown as Job);
    setIsLoading(false);
  };

  const checkExistingBid = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*')
      .eq('job_id', id)
      .eq('specialist_id', user!.id)
      .maybeSingle();

    if (data) {
      setExistingBid(data as Bid);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !job) return;

    if (formData.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('bids')
      .insert({
        job_id: job.id,
        specialist_id: user.id,
        amount: formData.amount,
        message: formData.message.trim() || null,
        eta: formData.eta.trim() || null,
        status: 'submitted',
      });

    setIsSubmitting(false);

    if (error) {
      console.error('Error submitting bid:', error);
      toast.error('Error al enviar la oferta');
      return;
    }

    toast.success('Oferta enviada exitosamente');
    checkExistingBid();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!job) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <MainLayout>
      <div className="container-narrow py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/specialist/browse')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a trabajos
        </Button>

        {/* Job Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {(job.category as any)?.name || 'General'}
              </span>
            </div>
            <CardTitle className="text-2xl">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <User className="h-4 w-4" />
              <span>{(job.client as any)?.full_name || 'Cliente'}</span>
              <span>•</span>
              <Calendar className="h-4 w-4" />
              <span>{formatDate(job.created_at)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}

            {(job.budget_min || job.budget_max) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>
                  Presupuesto: ${job.budget_min || 0} - ${job.budget_max || '∞'}
                </span>
              </div>
            )}

            {job.description && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Descripción</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bid Form or Status */}
        <Card>
          <CardHeader>
            <CardTitle>
              {existingBid ? 'Tu Oferta' : 'Enviar Oferta'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingBid ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Ya has enviado una oferta para este trabajo</span>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p><strong>Monto:</strong> ${existingBid.amount}</p>
                  {existingBid.eta && <p><strong>Tiempo estimado:</strong> {existingBid.eta}</p>}
                  {existingBid.message && <p><strong>Mensaje:</strong> {existingBid.message}</p>}
                  <p className="text-sm text-muted-foreground">
                    Estado: <span className="capitalize">{existingBid.status}</span>
                  </p>
                </div>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/specialist/bids">Ver mis ofertas</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Tu Precio ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eta">Tiempo Estimado</Label>
                  <Input
                    id="eta"
                    placeholder="Ej: 2-3 horas, 1 día"
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje al Cliente</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe tu experiencia o propuesta..."
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar Oferta
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
