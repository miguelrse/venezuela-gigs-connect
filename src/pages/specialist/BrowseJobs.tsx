import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, DollarSign, Calendar, ArrowLeft, Search, Filter } from 'lucide-react';
import type { Job } from '@/types/database';

export default function BrowseJobs() {
  const { data: categories } = useCategories();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    let query = supabase
      .from('jobs')
      .select('*, category:categories(name, icon), client:profiles!jobs_client_id_fkey(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (data) {
      setJobs(data as unknown as Job[]);
    }
    setIsLoading(false);
  };

  const filteredJobs = jobs.filter((job) => {
    if (filters.category && (job.category as any)?.name !== filters.category) {
      return false;
    }
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min} - $${max}`;
    if (min) return `Desde $${min}`;
    return `Hasta $${max}`;
  };

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Trabajos Disponibles</h1>
            <p className="text-muted-foreground">Encuentra trabajos y envía tu oferta</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/specialist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ubicación..."
                    className="pl-10"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>
              </div>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Cargando trabajos...</p>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay trabajos disponibles con los filtros seleccionados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Link key={job.id} to={`/specialist/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {(job.category as any)?.name || 'General'}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(job.created_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                        {job.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {job.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                          )}
                          {formatBudget(job.budget_min, job.budget_max) && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <DollarSign className="h-4 w-4" />
                              {formatBudget(job.budget_min, job.budget_max)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button className="shrink-0">Ver Detalles</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
