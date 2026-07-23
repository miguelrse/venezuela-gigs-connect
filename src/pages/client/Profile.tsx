import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { StatsCard } from "@/components/profile/StatsCard";
import { ReviewCard } from "@/components/profile/ReviewCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Profile, Review } from "@/types/database";
import { Briefcase, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0
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

      // Fetch reviews for this client
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', id)
        .order('created_at', { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        // Fetch reviewer profiles
        const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
        const { data: reviewerProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', reviewerIds);

        const profileMap = new Map(reviewerProfiles?.map(p => [p.user_id, p]) || []);
        setReviews(reviewsData.map(review => ({
          ...review,
          reviewer: profileMap.get(review.reviewer_id) || undefined
        })));
      }

      // Calculate stats - jobs posted
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('client_id', id);

      const completedJobs = jobs?.filter(j => j.status === 'completed') || [];
      
      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        totalJobs: jobs?.length || 0,
        completedJobs: completedJobs.length,
        averageRating: avgRating
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
            role="client"
            averageRating={stats.averageRating}
            reviewCount={reviews.length}
            isOwnProfile={isOwnProfile}
            onEdit={() => setIsEditOpen(true)}
          />
        </Card>

        {/* Edit Profile Dialog */}
        {isOwnProfile && (
          <ProfileEditDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            profile={profile}
            role="client"
            onSuccess={fetchProfileData}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            icon={Briefcase}
            label="Trabajos publicados"
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
        </div>

        {/* Reviews Tab */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="reviews" className="flex-1">Reseñas ({reviews.length})</TabsTrigger>
          </TabsList>

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
                    Las reseñas de especialistas aparecerán aquí después de completar trabajos.
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
