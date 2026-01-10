import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Briefcase, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Job, ContractStatus } from '@/types/database';

interface PendingContract {
  id: string;
  status: ContractStatus;
  job: { id: string; title: string } | null;
  specialist_id: string;
  specialist?: { full_name: string };
}

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pendingContracts, setPendingContracts] = useState<PendingContract[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchPendingContracts();
    }
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, category:categories(name)')
      .eq('client_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setJobs(data as unknown as Job[]);
      const total = data.length;
      const open = data.filter((j) => j.status === 'open').length;
      const completed = data.filter((j) => j.status === 'completed').length;
      setStats({ total, open, completed });
    }
    setIsLoading(false);
  };

  const fetchPendingContracts = async () => {
    const { data } = await supabase
      .from('contracts')
      .select('id, status, specialist_id, job:jobs(id, title)')
      .eq('client_id', user!.id)
      .eq('status', 'completed_pending_client');

    if (data && data.length > 0) {
      // Fetch specialist names
      const specialistIds = [...new Set(data.map(c => c.specialist_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', specialistIds);

      const contractsWithSpecialists = data.map(contract => ({
        ...contract,
        specialist: profiles?.find(p => p.user_id === contract.specialist_id)
      }));

      setPendingContracts(contractsWithSpecialists as PendingContract[]);
    }
  };

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Hola, {profile?.full_name?.split(' ')[0] || 'Cliente'}
            </h1>
            <p className="text-muted-foreground">Bienvenido a tu panel de cliente</p>
          </div>
          <Button asChild>
            <Link to="/client/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Trabajo
            </Link>
          </Button>
        </div>

        {/* Pending Confirmations Alert */}
        {pendingContracts.length > 0 && (
          <Card className="mb-8 border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Tienes {pendingContracts.length} trabajo(s) esperando tu confirmación</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Los especialistas han terminado el trabajo. Revisa y confirma la finalización.
                  </p>
                  <div className="space-y-2">
                    {pendingContracts.map(contract => (
                      <Link
                        key={contract.id}
                        to={`/client/contracts/${contract.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                      >
                        <div>
                          <p className="font-medium">{contract.job?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Por: {contract.specialist?.full_name || 'Especialista'}
                          </p>
                        </div>
                        <Button size="sm">
                          <Clock className="mr-2 h-4 w-4" />
                          Revisar
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Trabajos Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/10">
                  <FileText className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-sm text-muted-foreground">Abiertos</p>
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
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trabajos Recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/client/jobs">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Cargando...</p>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No tienes trabajos aún</p>
                <Button asChild>
                  <Link to="/client/jobs/new">Publicar tu primer trabajo</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/client/jobs/${job.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {(job.category as any)?.name || 'Sin categoría'} • {job.location || 'Sin ubicación'}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
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
