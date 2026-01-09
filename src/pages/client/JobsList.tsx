import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, MapPin, MessageSquare, Calendar } from 'lucide-react';
import type { Job } from '@/types/database';

export default function JobsList() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
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
      .order('created_at', { ascending: false });

    if (data) {
      // Get bid counts for each job
      const jobsWithBids = await Promise.all(
        data.map(async (job) => {
          const { count } = await supabase
            .from('bids')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);
          return { ...job, bids_count: count || 0 };
        })
      );
      setJobs(jobsWithBids as unknown as Job[]);
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
            <h1 className="text-3xl font-display font-bold">Mis Trabajos</h1>
            <p className="text-muted-foreground">Gestiona todos tus trabajos publicados</p>
          </div>
          <Button asChild>
            <Link to="/client/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Trabajo
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Cargando...</p>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No tienes trabajos publicados</p>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{job.title}</h3>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>{(job.category as any)?.name || 'Sin categoría'}</span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{job.bids_count || 0} ofertas</span>
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
