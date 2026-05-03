import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Briefcase, FileText, CheckCircle, Clock, AlertCircle, Search, ShieldCheck, Sparkles } from 'lucide-react';
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
    const [recentJobs, totalJobs, openJobs, completedJobs] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, category:categories(name)')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', user!.id),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', user!.id)
        .eq('status', 'open'),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', user!.id)
        .eq('status', 'completed'),
    ]);

    if (recentJobs.data) {
      setJobs(recentJobs.data as unknown as Job[]);
    }

    setStats({
      total: totalJobs.count ?? 0,
      open: openJobs.count ?? 0,
      completed: completedJobs.count ?? 0,
    });
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
            <Badge variant="outline" className="mb-2">Panel cliente</Badge>
            <h1 className="text-3xl font-display font-bold">
              Hola, {profile?.full_name?.split(' ')[0] || 'Cliente'}
            </h1>
            <p className="text-muted-foreground">Publica solicitudes, compara propuestas y cierra trabajos con especialistas confiables.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" asChild>
              <Link to="/client/jobs">
                <Search className="mr-2 h-4 w-4" />
                Mis solicitudes
              </Link>
            </Button>
            <Button asChild>
              <Link to="/client/jobs/new">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Trabajo
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 mb-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Publica solicitudes más claras y recibe mejores ofertas</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Usa título específico, presupuesto, ubicación, urgencia y detalles del resultado esperado. El marketplace debe premiar claridad, no solo precio bajo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Checklist rápido</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Revisa perfil y reseñas</li>
                <li>• Compara tiempo + precio</li>
                <li>• Pide fotos/referencias si aplica</li>
              </ul>
            </CardContent>
          </Card>
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
                          {job.category?.name || 'Sin categoría'} • {job.location || 'Sin ubicación'}
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
