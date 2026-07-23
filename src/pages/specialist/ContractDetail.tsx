import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { stripGeoMarker } from '@/lib/geo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, DollarSign, Calendar, User, Loader2, CheckCircle, Clock, AlertCircle, XCircle, Star } from 'lucide-react';
import { ReviewDialog } from '@/components/contracts/ReviewDialog';
import type { ContractStatus } from '@/types/database';

interface ContractWithDetails {
  id: string;
  job_id: string;
  accepted_bid_id: string;
  client_id: string;
  specialist_id: string;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  job: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    created_at: string;
    category: { name: string } | null;
  };
  client: {
    user_id: string;
    full_name: string;
    location: string | null;
  };
  bid: {
    amount: number;
    eta: string | null;
    message: string | null;
  };
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchContract();
      checkExistingReview();
    }
  }, [id, user]);

  const checkExistingReview = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('contract_id', id!)
      .eq('reviewer_id', user!.id)
      .maybeSingle();
    setHasReviewed(!!data);
  };

  const cancelContract = async () => {
    if (!contract) return;
    setIsUpdating(true);
    const { error } = await supabase.rpc('cancel_contract', { _contract_id: contract.id });
    if (error) {
      console.error('cancel_contract failed:', error);
      toast.error('No se pudo cancelar el contrato');
      setIsUpdating(false);
      return;
    }
    toast.success('Contrato cancelado');
    setIsUpdating(false);
    fetchContract();
  };

  const fetchContract = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        job:jobs(id, title, description, location, status, budget_min, budget_max, created_at, category:categories(name)),
        bid:bids!accepted_bid_id(amount, eta, message)
      `)
      .eq('id', id)
      .eq('specialist_id', user!.id)
      .single();

    if (error || !data) {
      toast.error('Contrato no encontrado');
      navigate('/specialist/contracts');
      return;
    }

    // Fetch client profile
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('user_id, full_name, location')
      .eq('user_id', data.client_id)
      .single();

    setContract({
      ...data,
      client: clientProfile || { user_id: data.client_id, full_name: 'Cliente', location: null }
    } as ContractWithDetails);
    setIsLoading(false);
  };

  const markAsInProgress = async () => {
    if (!contract) return;
    setIsUpdating(true);

    const { error } = await supabase.rpc('specialist_start_contract', {
      _contract_id: contract.id,
    });

    if (error) {
      console.error('specialist_start_contract failed:', error);
      toast.error('Error al actualizar el estado');
      setIsUpdating(false);
      return;
    }

    toast.success('Contrato marcado como "En progreso"');
    setIsUpdating(false);
    fetchContract();
  };

  const markAsCompleted = async () => {
    if (!contract) return;
    setIsUpdating(true);

    const { error } = await supabase.rpc('specialist_mark_completed', {
      _contract_id: contract.id,
    });

    if (error) {
      console.error('specialist_mark_completed failed:', error);
      toast.error('Error al actualizar el estado');
      setIsUpdating(false);
      return;
    }

    toast.success('Trabajo marcado como completado. Esperando confirmación del cliente.');
    setIsUpdating(false);
    fetchContract();
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

  if (!contract) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const canStartProgress = contract.status === 'active';
  const canMarkComplete = contract.status === 'in_progress';
  const isPendingClient = contract.status === 'completed_pending_client';
  const isCompleted = contract.status === 'completed';
  const canCancel = contract.status === 'active' || contract.status === 'in_progress';

  return (
    <MainLayout>
      <div className="container-narrow py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/specialist/contracts')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a contratos
        </Button>

        {/* Status Banner */}
        {isPendingClient && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Esperando confirmación del cliente</p>
                  <p className="text-sm text-muted-foreground">
                    El cliente debe confirmar que el trabajo está completo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Card className="mb-6 border-green-500/50 bg-green-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">¡Trabajo completado!</p>
                  <p className="text-sm text-muted-foreground">
                    El cliente ha confirmado la finalización del trabajo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {contract.job?.category?.name || 'General'}
                  </span>
                </div>
                <CardTitle className="text-2xl">{contract.job?.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <User className="h-4 w-4" />
                  <Link 
                    to={`/client/profile/${contract.client.user_id}`}
                    className="text-primary hover:underline"
                  >
                    {contract.client.full_name}
                  </Link>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  <span>Contrato creado: {formatDate(contract.created_at)}</span>
                </CardDescription>
              </div>
              <StatusBadge status={contract.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contract.job?.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{contract.job.location}</span>
              </div>
            )}

            {contract.job?.description && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Descripción del trabajo</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{stripGeoMarker(contract.job.description)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Bid Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Tu Oferta Aceptada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Monto acordado</p>
                <div className="flex items-center gap-1 font-semibold text-lg">
                  <DollarSign className="h-5 w-5" />
                  {contract.bid?.amount}
                </div>
              </div>
              {contract.bid?.eta && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Tiempo estimado</p>
                  <p className="font-semibold text-lg">{contract.bid.eta}</p>
                </div>
              )}
            </div>
            {contract.bid?.message && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Tu mensaje</h4>
                <p className="text-muted-foreground">{contract.bid.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {(canStartProgress || canMarkComplete) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canStartProgress && (
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Iniciar trabajo</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Marca el contrato como "En progreso" cuando comiences a trabajar
                    </p>
                    <Button 
                      onClick={markAsInProgress} 
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Iniciar Trabajo
                    </Button>
                  </div>
                </div>
              )}

              {canMarkComplete && (
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Marcar como completado</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cuando termines el trabajo, márcalo como completado. El cliente deberá confirmar la finalización.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default" disabled={isUpdating}>
                          {isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Marcar como Completado
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Confirmar trabajo completado?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto notificará al cliente que has terminado el trabajo. 
                            El cliente deberá confirmar la finalización antes de que el contrato se marque como completado.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={markAsCompleted}>
                            Sí, he terminado
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
