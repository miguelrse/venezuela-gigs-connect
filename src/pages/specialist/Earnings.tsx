import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Briefcase } from 'lucide-react';

interface EarningRecord {
  id: string;
  amount: number;
  fee_amount: number | null;
  payout_amount: number | null;
  status: string;
  created_at: string;
  contract: {
    id: string;
    job: { title: string } | null;
  } | null;
}

export default function Earnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [stats, setStats] = useState({
    last7: 0,
    last30: 0,
    yearToDate: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    // Get all contracts for this specialist
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('specialist_id', user!.id);

    if (!contracts || contracts.length === 0) {
      setIsLoading(false);
      return;
    }

    const contractIds = contracts.map(c => c.id);

    // Fetch payments for these contracts
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, fee_amount, payout_amount, status, created_at, contract_id')
      .in('contract_id', contractIds)
      .order('created_at', { ascending: false });

    if (payments && payments.length > 0) {
      // Fetch contract details with job title
      const { data: contractDetails } = await supabase
        .from('contracts')
        .select('id, job:jobs(title)')
        .in('id', contractIds);

      const contractMap = new Map(contractDetails?.map(c => [c.id, c]) || []);

      const earningRecords = payments.map(p => ({
        ...p,
        contract: contractMap.get(p.contract_id) || null
      })) as EarningRecord[];

      setEarnings(earningRecords);

      // Calculate stats from released payments
      const released = earningRecords.filter(e => e.status === 'released');
      const now = new Date();
      const _7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const _30dAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      setStats({
        last7: released.filter(e => new Date(e.created_at) >= _7dAgo).reduce((s, e) => s + (e.payout_amount || 0), 0),
        last30: released.filter(e => new Date(e.created_at) >= _30dAgo).reduce((s, e) => s + (e.payout_amount || 0), 0),
        yearToDate: released.filter(e => new Date(e.created_at) >= yearStart).reduce((s, e) => s + (e.payout_amount || 0), 0),
        total: released.reduce((s, e) => s + (e.payout_amount || 0), 0),
      });
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'released': return 'Liberado';
      case 'paid_held': return 'Retenido';
      case 'pending_verification': return 'Pendiente';
      case 'unpaid': return 'Sin pagar';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released': return 'text-success';
      case 'paid_held': return 'text-warning';
      case 'pending_verification': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Mis Ganancias
            </h1>
            <p className="text-muted-foreground">Resumen de tus ingresos en la plataforma</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/specialist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Últimos 7 días</p>
              <p className="text-2xl font-bold text-foreground">${stats.last7.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Últimos 30 días</p>
              <p className="text-2xl font-bold text-foreground">${stats.last30.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Año actual ({new Date().getFullYear()})</p>
              <p className="text-2xl font-bold text-foreground">${stats.yearToDate.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total ganado</p>
              <p className="text-2xl font-bold text-primary">${stats.total.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings History */}
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <p className="text-muted-foreground py-8 text-center">Cargando...</p>
                ) : earnings.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-2">No tienes pagos registrados aún</p>
                    <p className="text-sm text-muted-foreground">Los pagos aparecerán aquí cuando completes trabajos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium truncate">
                              {earning.contract?.job?.title || 'Trabajo'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(earning.created_at)}
                            </span>
                            <span className={`font-medium ${getStatusColor(earning.status)}`}>
                              {getStatusLabel(earning.status)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${earning.payout_amount || earning.amount}</p>
                          {earning.fee_amount && earning.fee_amount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Comisión: ${earning.fee_amount}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
