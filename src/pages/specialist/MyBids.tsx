import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, DollarSign, User, FileText } from 'lucide-react';
import type { Bid, JobStatus } from '@/types/database';

interface BidWithClient extends Omit<Bid, 'job'> {
  job: {
    id: string;
    title: string;
    location: string | null;
    status: string;
    client_id: string;
    category: { name: string } | null;
  };
  client?: {
    user_id: string;
    full_name: string;
  };
}

type BidRow = Omit<BidWithClient, 'client'>;

export default function MyBids() {
  const { user } = useAuth();
  const [bids, setBids] = useState<BidWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBids();
  }, [user]);

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, job:jobs(id, title, location, status, client_id, category:categories(name))')
      .eq('specialist_id', user!.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const typedBids = data as unknown as BidRow[];
      const clientIds = [...new Set(typedBids.map((bid) => bid.job?.client_id).filter(Boolean))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', clientIds);
      const bidsWithClients = typedBids.map((bid) => ({
        ...bid,
        client: profiles?.find(p => p.user_id === bid.job?.client_id)
      }));
      setBids(bidsWithClients as BidWithClient[]);
    }
    setIsLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
  };

  const activeBids = bids.filter(b => b.status === 'submitted' && b.job?.status === 'open');
  const acceptedBids = bids.filter(b => b.status === 'accepted');
  const archivedBids = bids.filter(b => b.status === 'rejected' || b.status === 'withdrawn' || (b.status === 'submitted' && b.job?.status !== 'open'));

  const renderBid = (bid: BidWithClient) => {
    const isAccepted = bid.status === 'accepted';
    const linkTo = isAccepted 
      ? `/specialist/contracts`
      : bid.job?.status === 'open' 
        ? `/specialist/jobs/${bid.job?.id}` 
        : undefined;
    const content = (
      <>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{bid.job?.title}</h3>
              <StatusBadge status={bid.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {bid.client && (
                <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <Link to={`/client/profile/${bid.client.user_id}`} className="hover:text-primary transition-colors">
                    {bid.client.full_name}
                  </Link>
                </span>
              )}
              <span>{bid.job?.category?.name || 'Sin categoría'}</span>
              {bid.job?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {bid.job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(bid.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 font-semibold">
                <DollarSign className="h-4 w-4" />
                {bid.amount}
              </div>
              {bid.eta && <p className="text-xs text-muted-foreground">{bid.eta}</p>}
            </div>
            <StatusBadge status={bid.job?.status as JobStatus} />
          </div>
        </div>
        {bid.message && (
          <p className="mt-2 text-sm text-muted-foreground border-t pt-2">{bid.message}</p>
        )}
        {isAccepted && (
          <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm text-primary">
            <FileText className="h-4 w-4" />
            <span>Ver contratos para gestionar este trabajo</span>
          </div>
        )}
      </>
    );

    if (linkTo) {
      return (
        <Link
          key={bid.id}
          to={linkTo}
          className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition-colors"
        >
          {content}
        </Link>
      );
    }

    return (
      <div key={bid.id} className="block p-4 rounded-lg border transition-colors">
        {content}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Mis Ofertas</h1>
            <p className="text-muted-foreground">{bids.length} ofertas en total</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/specialist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">Activas ({activeBids.length})</TabsTrigger>
            <TabsTrigger value="accepted">Aceptadas ({acceptedBids.length})</TabsTrigger>
            <TabsTrigger value="archived">Archivadas ({archivedBids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <p className="text-muted-foreground py-8 text-center">Cargando...</p>
                ) : activeBids.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No tienes ofertas activas</p>
                    <Button asChild>
                      <Link to="/specialist/browse">Buscar trabajos disponibles</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">{activeBids.map(renderBid)}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accepted" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                {acceptedBids.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No tienes ofertas aceptadas aún</p>
                ) : (
                  <div className="space-y-4">{acceptedBids.map(renderBid)}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                {archivedBids.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No tienes ofertas archivadas</p>
                ) : (
                  <div className="space-y-4">{archivedBids.map(renderBid)}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
