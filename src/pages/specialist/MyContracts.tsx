import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowLeft, MapPin, Calendar, DollarSign, User, FileText } from 'lucide-react';
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
    location: string | null;
    status: string;
  } | null;
  client: {
    user_id: string;
    full_name: string;
  } | null;
  bid: {
    amount: number;
    eta: string | null;
  } | null;
}

type ContractRow = Omit<ContractWithDetails, 'client'>;

export default function MyContracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        job:jobs(id, title, location, status),
        bid:bids!accepted_bid_id(amount, eta)
      `)
      .eq('specialist_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const typedContracts = data as unknown as ContractRow[];
      // Get unique client IDs
      const clientIds = [...new Set(typedContracts.map((c) => c.client_id).filter(Boolean))];
      
      // Fetch client profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', clientIds);

      // Merge client info into contracts
      const contractsWithClients = typedContracts.map((contract) => ({
        ...contract,
        client: profiles?.find(p => p.user_id === contract.client_id) || { user_id: contract.client_id, full_name: 'Cliente' }
      }));

      setContracts(contractsWithClients as ContractWithDetails[]);
    }
    setIsLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusPriority = (status: ContractStatus) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 1;
      case 'completed_pending_client':
        return 2;
      case 'completed':
        return 3;
      case 'canceled':
        return 4;
      default:
        return 5;
    }
  };

  // Sort contracts by status priority
  const sortedContracts = [...contracts].sort(
    (a, b) => getStatusPriority(a.status) - getStatusPriority(b.status)
  );

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Mis Contratos</h1>
            <p className="text-muted-foreground">Gestiona tus trabajos activos y completados</p>
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
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No tienes contratos aún</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Los contratos se crean cuando un cliente acepta tu oferta
                </p>
                <Button asChild>
                  <Link to="/specialist/browse">Buscar trabajos disponibles</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    to={`/specialist/contracts/${contract.id}`}
                    className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{contract.job?.title}</h3>
                          <StatusBadge status={contract.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {contract.client && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {contract.client.full_name}
                            </span>
                          )}
                          {contract.job?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {contract.job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contract.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            {contract.bid?.amount}
                          </div>
                          {contract.bid?.eta && (
                            <p className="text-xs text-muted-foreground">{contract.bid.eta}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
