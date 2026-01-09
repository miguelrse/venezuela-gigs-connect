import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Briefcase, FileText, CheckCircle } from 'lucide-react';
import type { Job } from '@/types/database';

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchJobs();
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
