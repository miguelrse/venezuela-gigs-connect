import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, DollarSign, Calendar, User, Loader2, Check } from 'lucide-react';
import type { Job, Bid } from '@/types/database';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchJob();
      fetchBids();
    }
  }, [id]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, category:categories(name, icon)')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast.error('Trabajo no encontrado');
      navigate('/client');
      return;
    }

    setJob(data as unknown as Job);
    setIsLoading(false);
  };

  const fetchBids = async () => {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bids:', error);
    }

    if (data) {
      // Fetch specialist profiles separately
      const specialistIds = [...new Set(data.map(b => b.specialist_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, location')
        .in('user_id', specialistIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const bidsWithProfiles = data.map(bid => ({
        ...bid,
        specialist: profileMap.get(bid.specialist_id) || { full_name: 'Especialista', location: null }
      }));

      setBids(bidsWithProfiles as unknown as Bid[]);
    }
  };

  const acceptBid = async (bid: Bid) => {
    if (!job || !user) return;

    setAcceptingBidId(bid.id);

    // Start transaction: update bid, create contract, update job status
    const { error: bidError } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bid.id);

    if (bidError) {
      toast.error('Error al aceptar la oferta');
      setAcceptingBidId(null);
      return;
    }

    // Reject other bids
    await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('job_id', job.id)
      .neq('id', bid.id);

    // Create contract
    const { error: contractError } = await supabase
      .from('contracts')
      .insert({
        job_id: job.id,
        accepted_bid_id: bid.id,
        client_id: user.id,
        specialist_id: bid.specialist_id,
        status: 'active',
      });

    if (contractError) {
      console.error('Error creating contract:', contractError);
      toast.error('Error al crear el contrato');
      setAcceptingBidId(null);
      return;
    }

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'assigned' })
      .eq('id', job.id);

    toast.success('Oferta aceptada. Se ha creado un contrato.');
    setAcceptingBidId(null);
    fetchJob();
    fetchBids();
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

  const canAcceptBids = job.status === 'open';

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

        {/* Job Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <span>{(job.category as any)?.name || 'Sin categoría'}</span>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(job.created_at)}</span>
                </CardDescription>
              </div>
              <StatusBadge status={job.status} />
            </div>
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

        {/* Bids */}
        <Card>
          <CardHeader>
            <CardTitle>Ofertas Recibidas ({bids.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {bids.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aún no hay ofertas para este trabajo
              </p>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div
                    key={bid.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {(bid.specialist as any)?.full_name || 'Especialista'}
                          </span>
                          <StatusBadge status={bid.status} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">${bid.amount}</span>
                          {bid.eta && <span>Tiempo: {bid.eta}</span>}
                          {(bid.specialist as any)?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(bid.specialist as any).location}
                            </span>
                          )}
                        </div>
                        {bid.message && (
                          <p className="mt-2 text-sm text-muted-foreground">{bid.message}</p>
                        )}
                      </div>
                      {canAcceptBids && bid.status === 'submitted' && (
                        <Button
                          size="sm"
                          onClick={() => acceptBid(bid)}
                          disabled={acceptingBidId !== null}
                        >
                          {acceptingBidId === bid.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="mr-1 h-4 w-4" />
                              Aceptar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
