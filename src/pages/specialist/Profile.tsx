import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { StatsCard } from "@/components/profile/StatsCard";
import { PortfolioCard } from "@/components/profile/PortfolioCard";
import { ReviewCard } from "@/components/profile/ReviewCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Profile, Category, PortfolioItem, Review } from "@/types/database";
import { Briefcase, CheckCircle, Star, DollarSign, Plus, ImageIcon, BadgeCheck, Clock3, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SpecialistProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<(Profile & { custom_categories?: string[] }) | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalEarnings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (id) {
      fetchProfileData();
    }
  }, [id]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // Fetch profile (own: full row; other: public view without phone)
      const profileQuery = isOwnProfile
        ? supabase.from('profiles').select('*').eq('user_id', id).single()
        : (supabase as any).from('public_profiles').select('*').eq('user_id', id).single();
      const { data: profileData, error: profileError } = await profileQuery;

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch specialist categories
      const { data: specCats } = await supabase
        .from('specialist_categories')
        .select('category_id')
        .eq('user_id', id);

      if (specCats && specCats.length > 0) {
        const categoryIds = specCats.map(sc => sc.category_id);
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .in('id', categoryIds);
        setCategories(cats || []);
      }

      // Fetch portfolio items
      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (portfolioData) {
        // Fetch categories for portfolio items
        const catIds = [...new Set(portfolioData.filter(p => p.category_id).map(p => p.category_id))];
        if (catIds.length > 0) {
          const { data: cats } = await supabase
            .from('categories')
            .select('*')
            .in('id', catIds);
          const catMap = new Map(cats?.map(c => [c.id, c]) || []);
          setPortfolio(portfolioData.map(item => ({
            ...item,
            category: item.category_id ? catMap.get(item.category_id) : undefined
          })));
        } else {
          setPortfolio(portfolioData);
        }
      }

      // Fetch reviews for this specialist
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', id)
        .order('created_at', { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        // Fetch reviewer profiles
        const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
        const { data: reviewerProfiles } = await (supabase as any)
          .from('public_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', reviewerIds);

        const profileMap = new Map(reviewerProfiles?.map(p => [p.user_id, p]) || []);
        setReviews(reviewsData.map(review => ({
          ...review,
          reviewer: profileMap.get(review.reviewer_id) || undefined
        })));
      }

      // Calculate stats
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, status')
        .eq('specialist_id', id);

      const completedContracts = contracts?.filter(c => c.status === 'completed') || [];
      
      // Only fetch earnings for own profile
      let totalEarnings = 0;
      if (isOwnProfile && completedContracts.length > 0) {
        const contractIds = completedContracts.map(c => c.id);
        const { data: payments } = await supabase
          .from('payments')
          .select('payout_amount')
          .in('contract_id', contractIds)
          .eq('status', 'released');
        
        totalEarnings = payments?.reduce((sum, p) => sum + (p.payout_amount || 0), 0) || 0;
      }

      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        totalJobs: contracts?.length || 0,
        completedJobs: completedContracts.length,
        averageRating: avgRating,
        totalEarnings
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Cargando perfil...</div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Perfil no encontrado</h2>
          <Button onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-wide py-6 space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <ProfileHeader
            profile={profile}
            role="specialist"
            averageRating={stats.averageRating}
            reviewCount={reviews.length}
            categories={categories}
            isOwnProfile={isOwnProfile}
            onEdit={() => setIsEditOpen(true)}
          />
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge className="mb-3 bg-primary text-primary-foreground">Perfil profesional</Badge>
                  <h2 className="font-display text-2xl font-bold">{profile.full_name} puede recibir solicitudes directas</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                    Este perfil funciona como una vitrina de venta: categorías, reputación, trabajos anteriores y datos de contacto ayudan al cliente a decidir con confianza.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  <Button>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Solicitar cotización
                  </Button>
                  <Button variant="outline">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Invitar a trabajo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-3 p-5 text-sm">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Señales de confianza</div>
              <div className="flex items-center gap-2 text-muted-foreground"><BadgeCheck className="h-4 w-4 text-primary" /> Perfil con identidad y ciudad visible</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4 text-warning" /> Reviews después de contratos completados</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4 text-info" /> Respuesta rápida recomendada</div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Dialog */}
        {isOwnProfile && (
          <ProfileEditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            profile={profile}
            role="specialist"
            selectedCategoryIds={categories.map(c => c.id)}
            onSuccess={fetchProfileData}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Briefcase}
            label="Trabajos totales"
            value={stats.totalJobs}
          />
          <StatsCard
            icon={CheckCircle}
            label="Completados"
            value={stats.completedJobs}
            iconColor="text-success"
          />
          <StatsCard
            icon={Star}
            label="Calificación"
            value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
            iconColor="text-warning"
          />
          {isOwnProfile && (
            <StatsCard
              icon={DollarSign}
              label="Ganancias"
              value={`$${stats.totalEarnings.toLocaleString()}`}
              iconColor="text-accent"
            />
          )}
        </div>

        {/* Tabs: Portfolio & Reviews */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="portfolio">Portafolio</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {(categories.length > 0 ? categories : [{ id: 'general', name: 'Servicio general', icon: null, active: true, created_at: '' }]).map((category) => (
                <Card key={category.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <Sparkles className="mb-4 h-6 w-6 text-primary" />
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Solicita una cotización con descripción, ubicación, fecha y presupuesto estimado.
                    </p>
                    <Button className="mt-4 w-full" variant="outline">Pedir cotización</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            {isOwnProfile && (
              <div className="flex justify-end mb-4">
                <Button onClick={() => navigate('/specialist/portfolio/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar trabajo
                </Button>
              </div>
            )}

            {portfolio.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {portfolio.map(item => (
                  <PortfolioCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <h3 className="font-medium text-foreground mb-1">Sin trabajos en el portafolio</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {isOwnProfile 
                      ? "Agrega trabajos anteriores para mostrar a tus clientes potenciales."
                      : "Este especialista aún no ha agregado trabajos a su portafolio."}
                  </p>
                  {isOwnProfile && (
                    <Button className="mt-4" onClick={() => navigate('/specialist/portfolio/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar trabajo
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {reviews.length > 0 ? (
              <div className="space-y-4 max-w-2xl">
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed max-w-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <h3 className="font-medium text-foreground mb-1">Sin reseñas aún</h3>
                  <p className="text-sm text-muted-foreground">
                    Las reseñas aparecerán aquí después de completar trabajos.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
