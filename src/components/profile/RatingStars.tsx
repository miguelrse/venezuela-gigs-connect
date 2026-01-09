import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
}

export function RatingStars({ rating, size = "md", showValue = true, reviewCount }: RatingStarsProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${sizeClasses[size]} fill-warning text-warning`}
          />
        ))}
        {hasHalfStar && (
          <StarHalf
            className={`${sizeClasses[size]} fill-warning text-warning`}
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${sizeClasses[size]} text-muted-foreground/30`}
          />
        ))}
      </div>
      {showValue && (
        <span className={`${textClasses[size]} font-medium text-foreground`}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={`${textClasses[size]} text-muted-foreground`}>
          ({reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"})
        </span>
      )}
    </div>
  );
}
