import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
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

export default function MyBids() {
  const { user } = useAuth();
  const [bids, setBids] = useState<BidWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBids();
    }
  }, [user]);

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, job:jobs(id, title, location, status, client_id, category:categories(name))')
      .eq('specialist_id', user!.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      // Get unique client IDs
      const clientIds = [...new Set(data.map((bid: any) => bid.job?.client_id).filter(Boolean))];
      
      // Fetch client profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', clientIds);

      // Merge client info into bids
      const bidsWithClients = data.map((bid: any) => ({
        ...bid,
        client: profiles?.find(p => p.user_id === bid.job?.client_id)
      }));

      setBids(bidsWithClients as BidWithClient[]);
    }
    setIsLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Mis Ofertas</h1>
            <p className="text-muted-foreground">Historial de todas tus ofertas enviadas</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/specialist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Cargando...</p>
            ) : bids.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No has enviado ofertas aún</p>
                <Button asChild>
                  <Link to="/specialist/browse">Buscar trabajos disponibles</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => {
                  // Determine where to navigate based on bid status
                  const isAccepted = bid.status === 'accepted';
                  const linkTo = isAccepted 
                    ? `/specialist/contracts` // Will navigate to contracts page, user can find their contract
                    : bid.job?.status === 'open' 
                      ? `/specialist/jobs/${bid.job?.id}` 
                      : undefined;
                  
                  const CardWrapper = linkTo ? Link : 'div';
                  const cardProps = linkTo ? { to: linkTo } : {};
                  
                  return (
                    <CardWrapper
                      key={bid.id}
                      {...(cardProps as any)}
                      className={`block p-4 rounded-lg border ${linkTo ? 'hover:border-primary/50 hover:bg-accent/30 cursor-pointer' : ''} transition-colors`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{bid.job?.title}</h3>
                            <StatusBadge status={bid.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {bid.client && (
                              <span 
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1"
                              >
                                <User className="h-3 w-3" />
                                <Link 
                                  to={`/client/profile/${bid.client.user_id}`}
                                  className="hover:text-primary transition-colors"
                                >
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
                            {bid.eta && (
                              <p className="text-xs text-muted-foreground">{bid.eta}</p>
                            )}
                          </div>
                          <StatusBadge status={bid.job?.status as JobStatus} />
                        </div>
                      </div>
                      {bid.message && (
                        <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
                          {bid.message}
                        </p>
                      )}
                      {isAccepted && (
                        <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm text-primary">
                          <FileText className="h-4 w-4" />
                          <span>Ver contratos para gestionar este trabajo</span>
                        </div>
                      )}
                    </CardWrapper>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
