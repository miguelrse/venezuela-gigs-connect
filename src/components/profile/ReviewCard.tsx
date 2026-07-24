import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./RatingStars";
import { ReportDialog } from "@/components/trust/ReportDialog";
import { Review } from "@/types/database";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { user } = useAuth();
  const reviewerName = review.reviewer?.full_name || "Usuario";
  const reviewerInitials = reviewerName.split(" ").map(n => n[0]).join("").slice(0, 2);
  const canReport = user && user.id !== review.reviewer_id;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.reviewer?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {reviewerInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="font-medium text-foreground">{reviewerName}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "d MMM yyyy", { locale: es })}
              </span>
            </div>
            <div className="mt-1">
              <RatingStars rating={review.rating} size="sm" showValue={false} />
            </div>
            {review.comment && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            )}
            {canReport && (
              <div className="mt-2">
                <ReportDialog targetType="review" targetId={review.id} triggerVariant="ghost" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

