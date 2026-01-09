import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowLeft, MapPin, Calendar, DollarSign } from 'lucide-react';
import type { Bid } from '@/types/database';

export default function MyBids() {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBids();
    }
  }, [user]);

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, job:jobs(id, title, location, status, category:categories(name))')
      .eq('specialist_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBids(data as unknown as Bid[]);
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
                {bids.map((bid) => (
                  <div
                    key={bid.id}
                    className="p-4 rounded-lg border"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{(bid.job as any)?.title}</h3>
                          <StatusBadge status={bid.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>{(bid.job as any)?.category?.name || 'Sin categoría'}</span>
                          {(bid.job as any)?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(bid.job as any).location}
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
                        <StatusBadge status={(bid.job as any)?.status} />
                      </div>
                    </div>
                    {bid.message && (
                      <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
                        {bid.message}
                      </p>
                    )}
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
