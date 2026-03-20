import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, FileText, CheckCircle, DollarSign, Briefcase } from 'lucide-react';
import type { Bid, ContractStatus } from '@/types/database';

interface ActiveContract {
  id: string;
  status: ContractStatus;
  job: { id: string; title: string } | null;
}

export default function SpecialistDashboard() {
  const { user, profile } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [activeContracts, setActiveContracts] = useState<ActiveContract[]>([]);
  const [stats, setStats] = useState({ submitted: 0, accepted: 0, earnings: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBids();
      fetchActiveContracts();
    }
  }, [user]);

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, job:jobs(title, location, status)')
      .eq('specialist_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setBids(data as unknown as Bid[]);
      const submitted = data.filter((b) => b.status === 'submitted').length;
      const accepted = data.filter((b) => b.status === 'accepted').length;
      setStats({ submitted, accepted, earnings: 0 });
    }
    setIsLoading(false);
  };

  const fetchActiveContracts = async () => {
    const { data } = await supabase
      .from('contracts')
      .select('id, status, job:jobs(id, title)')
      .eq('specialist_id', user!.id)
      .in('status', ['active', 'in_progress', 'completed_pending_client'])
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) {
      setActiveContracts(data as ActiveContract[]);
    }
  };

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Hola, {profile?.full_name?.split(' ')[0] || 'Especialista'}
            </h1>
            <p className="text-muted-foreground">Encuentra trabajos y gana dinero</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link to="/specialist/contracts">
                <Briefcase className="mr-2 h-4 w-4" />
                Mis Contratos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/specialist/earnings">
                <DollarSign className="mr-2 h-4 w-4" />
                Ganancias
              </Link>
            </Button>
            <Button asChild>
              <Link to="/specialist/browse">
                <Search className="mr-2 h-4 w-4" />
                Buscar Trabajos
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/10">
                  <FileText className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                  <p className="text-sm text-muted-foreground">Ofertas Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                  <p className="text-sm text-muted-foreground">Trabajos Asignados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats.earnings}</p>
                  <p className="text-sm text-muted-foreground">Ganancias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Contracts */}
        {activeContracts.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contratos Activos</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/specialist/contracts">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    to={`/specialist/contracts/${contract.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium truncate">{contract.job?.title}</span>
                    <StatusBadge status={contract.status} />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Bids */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mis Ofertas Recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/specialist/bids">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Cargando...</p>
            ) : bids.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No has enviado ofertas aún</p>
                <Button asChild>
                  <Link to="/specialist/browse">Buscar trabajos disponibles</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="p-4 rounded-lg border">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{(bid.job as any)?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Tu oferta: ${bid.amount} • {bid.eta || 'Sin tiempo estimado'}
                        </p>
                      </div>
                      <StatusBadge status={bid.status} />
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
