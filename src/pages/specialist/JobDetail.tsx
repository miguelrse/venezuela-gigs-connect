import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { stripGeoMarker } from '@/lib/geo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, DollarSign, Calendar, User, Loader2, Send, CheckCircle, Clock, Wifi, Building, Star, Briefcase } from 'lucide-react';
import type { Job, Bid, BidFormData, JobType, JobUrgency } from '@/types/database';
import { ReportDialog } from '@/components/trust/ReportDialog';
import { SafetyTips } from '@/components/trust/SafetyTips';

interface ClientInfo {
  user_id: string;
  full_name: string;
  location: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface ClientStats {
  totalJobs: number;
  completedJobs: number;
  avgRating: number;
  reviewCount: number;
}

export default function SpecialistJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [existingBid, setExistingBid] = useState<Bid | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats>({ totalJobs: 0, completedJobs: 0, avgRating: 0, reviewCount: 0 });
  const [otherJobs, setOtherJobs] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BidFormData>({
    amount: 0,
    message: '',
    eta: '',
  });

  useEffect(() => {
    if (id && user) {
      fetchJob();
      checkExistingBid();
    }
  }, [id, user]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('open_jobs_feed')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast.error('Trabajo no encontrado o ya no está disponible');
      navigate('/specialist/browse');
      return;
    }

    // Fetch category and client (public info only) in parallel
    const [categoryRes, clientRes] = await Promise.all([
      data.category_id
        ? supabase.from('categories').select('name, icon').eq('id', data.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('public_profiles').select('user_id, full_name, location, avatar_url, created_at').eq('user_id', data.client_id).maybeSingle()
    ]);

    setJob({
      ...data,
      category: categoryRes.data || undefined,
      client: clientRes.data || undefined
    } as unknown as Job);

    if (clientRes.data) {
      setClientInfo(clientRes.data as ClientInfo);
      fetchClientStats(data.client_id, data.id);
    }

    setIsLoading(false);
  };

  const fetchClientStats = async (clientId: string, currentJobId: string) => {
    const [jobsRes, reviewsRes, otherJobsRes] = await Promise.all([
      supabase.from('jobs').select('id, status').eq('client_id', clientId),
      supabase.from('reviews').select('rating').eq('reviewee_id', clientId),
      supabase.from('open_jobs_feed').select('id, title').eq('client_id', clientId).neq('id', currentJobId).limit(3),
    ]);

    const jobs = jobsRes.data || [];
    const reviews = reviewsRes.data || [];
    const completed = jobs.filter(j => j.status === 'completed').length;
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    setClientStats({
      totalJobs: jobs.length,
      completedJobs: completed,
      avgRating,
      reviewCount: reviews.length,
    });
    setOtherJobs(otherJobsRes.data || []);
  };

  const checkExistingBid = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*')
      .eq('job_id', id)
      .eq('specialist_id', user!.id)
      .maybeSingle();
    if (data) setExistingBid(data as Bid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;
    if (formData.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('bids').insert({
      job_id: job.id,
      specialist_id: user.id,
      amount: formData.amount,
      message: formData.message.trim() || null,
      eta: formData.eta.trim() || null,
      status: 'submitted',
    });
    setIsSubmitting(false);

    if (error) {
      toast.error('Error al enviar la oferta');
      return;
    }
    toast.success('Oferta enviada exitosamente');
    checkExistingBid();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!job) return null;

  const getJobTypeLabel = (type: JobType) => {
    switch (type) { case 'remoto': return 'Remoto'; case 'hibrido': return 'Híbrido'; default: return 'Presencial'; }
  };

  const getUrgencyLabel = (urgency: JobUrgency) => {
    switch (urgency) { case 'asap': return 'Lo antes posible'; case 'fecha_especifica': return 'Fecha específica'; default: return 'Flexible'; }
  };

  const memberSince = clientInfo?.created_at
    ? new Date(clientInfo.created_at).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
    : null;

  return (
    <MainLayout>
      <div className="container-narrow py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/specialist/browse')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a trabajos
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="secondary">{job.category?.name || 'General'}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {getJobTypeLabel(job.job_type || 'presencial')}
                  </Badge>
                  {job.urgency === 'asap' && (
                    <Badge variant="destructive" className="text-xs">Urgente</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(job.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getUrgencyLabel(job.urgency || 'flexible')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {job.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {(job.budget_min || job.budget_max) && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-semibold">
                        ${job.budget_min || 0} - ${job.budget_max || '∞'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {job.description && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Descripción del trabajo</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{stripGeoMarker(job.description)}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bid Form */}
            <Card>
              <CardHeader>
                <CardTitle>{existingBid ? 'Tu Oferta' : 'Enviar Oferta'}</CardTitle>
              </CardHeader>
              <CardContent>
                {existingBid ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Ya has enviado una oferta para este trabajo</span>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <p><strong>Monto:</strong> ${existingBid.amount}</p>
                      {existingBid.eta && <p><strong>Tiempo estimado:</strong> {existingBid.eta}</p>}
                      {existingBid.message && <p><strong>Mensaje:</strong> {existingBid.message}</p>}
                      <p className="text-sm text-muted-foreground">
                        Estado: <span className="capitalize">{existingBid.status}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Tu Precio ($) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="0"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Precio total por el trabajo completo</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eta">Tiempo Estimado</Label>
                      <Input
                        id="eta"
                        placeholder="Ej: 2-3 horas, 1 día"
                        value={formData.eta}
                        onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje al Cliente</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe tu experiencia o propuesta..."
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Enviar Oferta
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Client Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Acerca del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientInfo && (
                  <>
                    <Link 
                      to={`/client/profile/${clientInfo.user_id}`} 
                      className="font-semibold text-primary hover:underline"
                    >
                      {clientInfo.full_name}
                    </Link>
                    {clientInfo.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {clientInfo.location}
                      </p>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Trabajos</p>
                        <p className="font-semibold">{clientStats.totalJobs}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completados</p>
                        <p className="font-semibold">{clientStats.completedJobs}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Calificación</p>
                        <p className="font-semibold flex items-center gap-1">
                          {clientStats.avgRating > 0 ? (
                            <>
                              <Star className="h-3 w-3 text-warning fill-warning" />
                              {clientStats.avgRating.toFixed(1)}
                              <span className="text-muted-foreground font-normal">({clientStats.reviewCount})</span>
                            </>
                          ) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tasa contratación</p>
                        <p className="font-semibold">
                          {clientStats.totalJobs > 0 ? Math.round((clientStats.completedJobs / clientStats.totalJobs) * 100) : 0}%
                        </p>
                      </div>
                    </div>

                    {memberSince && (
                      <p className="text-xs text-muted-foreground">
                        Miembro desde {memberSince}
                      </p>
                    )}

                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">¿Algo sospechoso?</span>
                      <ReportDialog targetType="user" targetId={clientInfo.user_id} triggerVariant="ghost" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <SafetyTips audience="specialist" />

            {/* Other jobs by this client */}
            {otherJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Otros trabajos del cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {otherJobs.map(j => (
                      <Link
                        key={j.id}
                        to={`/specialist/jobs/${j.id}`}
                        className="block p-2 rounded-md text-sm text-primary hover:bg-muted/50 transition-colors"
                      >
                        {j.title}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
