import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
import { ArrowLeft, MapPin, DollarSign, Calendar, User, Loader2, CheckCircle, Clock, Star } from 'lucide-react';
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
    created_at: string;
    category: { name: string } | null;
  };
  specialist: {
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

export default function ClientContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchContract();
      checkExistingReview();
    }
  }, [id, user]);

  const fetchContract = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        job:jobs(id, title, description, location, status, created_at, category:categories(name)),
        bid:bids!accepted_bid_id(amount, eta, message)
      `)
      .eq('id', id)
      .eq('client_id', user!.id)
      .single();

    if (error || !data) {
      toast.error('Contrato no encontrado');
      navigate('/client');
      return;
    }

    // Fetch specialist profile
    const { data: specialistProfile } = await supabase
      .from('profiles')
      .select('user_id, full_name, location')
      .eq('user_id', data.specialist_id)
      .single();

    setContract({
      ...data,
      specialist: specialistProfile || { user_id: data.specialist_id, full_name: 'Especialista', location: null }
    } as ContractWithDetails);
    setIsLoading(false);
  };

  const checkExistingReview = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('contract_id', id)
      .eq('reviewer_id', user!.id)
      .maybeSingle();
    
    setHasReviewed(!!data);
  };

  const confirmCompletion = async () => {
    if (!contract) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'completed' })
      .eq('id', contract.id);

    if (error) {
      toast.error('Error al confirmar la finalización');
      setIsUpdating(false);
      return;
    }

    // Also update job status
    await supabase
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', contract.job.id);

    toast.success('¡Trabajo confirmado como completado!');
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

  const isPendingConfirmation = contract.status === 'completed_pending_client';
  const isCompleted = contract.status === 'completed';
  const isActive = contract.status === 'active' || contract.status === 'in_progress';

  return (
    <MainLayout>
      <div className="container-narrow py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/client')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al panel
        </Button>

        {/* Pending Confirmation Banner */}
        {isPendingConfirmation && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">El especialista ha marcado el trabajo como completado</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Por favor, revisa el trabajo y confirma que está completo
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isUpdating}>
                        {isUpdating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Confirmar Finalización
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar que el trabajo está completo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Al confirmar, el contrato se marcará como completado. 
                          Asegúrate de haber revisado el trabajo antes de confirmar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCompletion}>
                          Sí, está completo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Banner */}
        {isCompleted && (
          <Card className="mb-6 border-green-500/50 bg-green-500/10">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">¡Trabajo completado!</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {hasReviewed 
                      ? 'Ya has dejado una reseña para este trabajo'
                      : '¿Qué tal fue tu experiencia? Deja una reseña para el especialista'}
                  </p>
                  {!hasReviewed && (
                    <Button variant="outline" asChild>
                      <Link to={`/specialist/profile/${contract.specialist.user_id}`}>
                        <Star className="mr-2 h-4 w-4" />
                        Dejar Reseña
                      </Link>
                    </Button>
                  )}
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
                <p className="text-muted-foreground whitespace-pre-wrap">{contract.job.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specialist Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Especialista Asignado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Link 
                  to={`/specialist/profile/${contract.specialist.user_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {contract.specialist.full_name}
                </Link>
                {contract.specialist.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {contract.specialist.location}
                  </p>
                )}
              </div>
              <Button variant="outline" asChild>
                <Link to={`/specialist/profile/${contract.specialist.user_id}`}>
                  Ver Perfil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bid Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalles del Acuerdo</CardTitle>
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
                <h4 className="font-medium mb-2">Mensaje del especialista</h4>
                <p className="text-muted-foreground">{contract.bid.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
