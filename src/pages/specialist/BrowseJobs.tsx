import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, DollarSign, ArrowLeft, Search, Filter, Clock, Zap, Wifi, Building, SlidersHorizontal, Target, Navigation, Radius } from 'lucide-react';
import { LocationMap } from '@/components/ui/location-map';
import { formatDistanceKm, getCurrentCoordinates, haversineDistanceKm, parseGeoMarker, stripGeoMarker, type Coordinates } from '@/lib/geo';
import type { Job, JobType, JobUrgency } from '@/types/database';

export default function BrowseJobs() {
  const { data: categories } = useCategories();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [sortBy, setSortBy] = useState<'recent' | 'budget' | 'urgent'>('recent');
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    job_type: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*, category:categories(name, icon)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (data) {
      setJobs(data as unknown as Job[]);
    }
    setIsLoading(false);
  };

  const getJobCoordinates = (job: Job): Coordinates | null => {
    if (typeof job.latitude === 'number' && typeof job.longitude === 'number') {
      return { latitude: job.latitude, longitude: job.longitude };
    }
    return parseGeoMarker(job.description);
  };

  const getJobDistance = (job: Job) => {
    const coordinates = getJobCoordinates(job);
    if (!userLocation || !coordinates) return null;
    return haversineDistanceKm(userLocation, coordinates);
  };

  const filteredJobs = jobs
    .filter((job) => {
      if (filters.category && job.category?.name !== filters.category) return false;
      if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.job_type && job.job_type !== filters.job_type) return false;
      if (userLocation && job.job_type !== 'remoto') {
        const coordinates = getJobCoordinates(job);
        if (!coordinates) return false;
        const distance = haversineDistanceKm(userLocation, coordinates);
        if (distance > radiusKm) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchDesc = job.description?.toLowerCase().includes(q);
        const matchCat = job.category?.name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'urgent') {
        const urgencyScore = (job: Job) => job.urgency === 'asap' ? 1 : 0;
        return urgencyScore(b) - urgencyScore(a) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'budget') {
        return (b.budget_max || b.budget_min || 0) - (a.budget_max || a.budget_min || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const urgentCount = jobs.filter((job) => job.urgency === 'asap').length;
  const remoteCount = jobs.filter((job) => job.job_type === 'remoto').length;
  const withBudgetCount = jobs.filter((job) => job.budget_min || job.budget_max).length;
  const geolocatedCount = jobs.filter((job) => Boolean(getJobCoordinates(job))).length;
  const hasActiveFilters = Boolean(searchQuery || filters.category || filters.location || filters.job_type || userLocation);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ category: '', location: '', job_type: '' });
    setUserLocation(null);
    setRadiusKm(10);
    setSortBy('recent');
  };

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getCurrentCoordinates();
      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (error) {
      console.error('Error getting specialist location:', error);
    }
  };



  const timeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return new Date(date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min} - $${max}`;
    if (min) return `Desde $${min}`;
    return `Hasta $${max}`;
  };

  const getJobTypeIcon = (type: JobType) => {
    switch (type) {
      case 'remoto': return <Wifi className="h-3 w-3" />;
      case 'hibrido': return <Building className="h-3 w-3" />;
      default: return <MapPin className="h-3 w-3" />;
    }
  };

  const getJobTypeLabel = (type: JobType) => {
    switch (type) {
      case 'remoto': return 'Remoto';
      case 'hibrido': return 'Híbrido';
      default: return 'Presencial';
    }
  };

  const getUrgencyBadge = (urgency: JobUrgency) => {
    if (urgency === 'asap') return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Urgente</Badge>;
    return null;
  };

  return (
    <MainLayout>
      <div className="container-wide py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Trabajos Disponibles</h1>
            <p className="text-muted-foreground">{filteredJobs.length} trabajos encontrados de {jobs.length} abiertos</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/specialist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-destructive/10 p-3 text-destructive"><Zap className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{urgentCount}</p><p className="text-sm text-muted-foreground">urgentes</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-info/10 p-3 text-info"><Wifi className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{remoteCount}</p><p className="text-sm text-muted-foreground">remotos</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><Target className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{withBudgetCount}</p><p className="text-sm text-muted-foreground">con presupuesto</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><MapPin className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{geolocatedCount}</p><p className="text-sm text-muted-foreground">con mapa</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, categoría o descripción..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.job_type}
                  onValueChange={(value) => setFilters({ ...filters, job_type: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="remoto">Remoto</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Filtrar por ubicación..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full sm:w-[200px]"
                />
                {hasActiveFilters && (
                  <Button type="button" variant="ghost" onClick={clearFilters} className="sm:ml-auto">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
              <div className="rounded-2xl border bg-secondary/40 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2 font-medium">
                      <Radius className="h-4 w-4 text-primary" />
                      Buscar trabajos cerca de mí
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Activa tu ubicación para ver solo solicitudes presenciales o híbridas dentro del radio seleccionado.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="text-sm text-muted-foreground">
                      Radio: <span className="font-semibold text-foreground">{radiusKm} km</span>
                    </label>
                    <Input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-full sm:w-40"
                    />
                    <Button type="button" variant={userLocation ? 'default' : 'outline'} onClick={handleUseCurrentLocation}>
                      <Navigation className="mr-2 h-4 w-4" />
                      {userLocation ? 'Actualizar ubicación' : 'Usar mi ubicación'}
                    </Button>
                  </div>
                </div>
                {userLocation && (
                  <div className="mt-4">
                    <LocationMap latitude={userLocation.latitude} longitude={userLocation.longitude} radiusKm={radiusKm} label="Tu zona de búsqueda" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sort Tabs */}
        <div className="mb-4">
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'budget' | 'urgent')}>
            <TabsList>
              <TabsTrigger value="recent">Más Recientes</TabsTrigger>
              <TabsTrigger value="urgent">Urgentes</TabsTrigger>
              <TabsTrigger value="budget">Mayor Presupuesto</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Cargando trabajos...</p>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold">No encontramos trabajos con esos filtros</h3>
              <p className="mt-1 text-muted-foreground">Prueba una categoría más amplia, otra ciudad o limpia los filtros.</p>
              {hasActiveFilters && <Button className="mt-4" variant="outline" onClick={clearFilters}>Limpiar filtros</Button>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Link key={job.id} to={`/specialist/jobs/${job.id}`}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-3">
                      {/* Top row: badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {job.category?.name || 'General'}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getJobTypeIcon(job.job_type || 'presencial')}
                          {getJobTypeLabel(job.job_type || 'presencial')}
                        </Badge>
                        {getUrgencyBadge(job.urgency || 'flexible')}
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(job.created_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>

                      {/* Description preview */}
                      {job.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {stripGeoMarker(job.description)}
                        </p>
                      )}

                      {/* Bottom row: location + budget */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {formatBudget(job.budget_min, job.budget_max) && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <DollarSign className="h-4 w-4 text-primary" />
                            {formatBudget(job.budget_min, job.budget_max)}
                          </span>
                        )}
                        {getJobDistance(job) !== null && (
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <Navigation className="h-4 w-4" />
                            A {formatDistanceKm(getJobDistance(job)!)}
                          </span>
                        )}
                      </div>
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
