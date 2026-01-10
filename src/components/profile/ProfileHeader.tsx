import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./RatingStars";
import { Profile, AppRole, Category } from "@/types/database";
import { MapPin, Phone, Edit, Briefcase } from "lucide-react";

interface ProfileHeaderProps {
  profile: Profile & { custom_categories?: string[] };
  role: AppRole;
  averageRating: number;
  reviewCount: number;
  categories?: Category[];
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

export function ProfileHeader({ 
  profile, 
  role, 
  averageRating, 
  reviewCount, 
  categories,
  isOwnProfile,
  onEdit 
}: ProfileHeaderProps) {
  const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const roleLabel = role === 'specialist' ? 'Especialista' : 'Cliente';
  const roleColor = role === 'specialist' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground';

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="h-32 sm:h-40 bg-gradient-primary rounded-t-xl" />
      
      <div className="px-4 sm:px-6 pb-6">
        {/* Avatar and main info */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-12">
          <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 sm:pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                {profile.full_name}
              </h1>
              <Badge className={roleColor}>{roleLabel}</Badge>
            </div>
            
            <div className="mt-2">
              <RatingStars rating={averageRating} size="md" reviewCount={reviewCount} />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {isOwnProfile && (
            <Button variant="outline" size="sm" onClick={onEdit} className="shrink-0">
              <Edit className="h-4 w-4 mr-2" />
              Editar perfil
            </Button>
          )}
        </div>
        
        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}
        
        {/* Specialist categories */}
        {role === 'specialist' && (categories?.length || profile.custom_categories?.length) ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Briefcase className="h-4 w-4" />
              <span>Especialidades</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories?.map(cat => (
                <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
              ))}
              {profile.custom_categories?.map(cat => (
                <Badge key={cat} variant="outline">{cat}</Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
