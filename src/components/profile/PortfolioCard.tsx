import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortfolioItem } from "@/types/database";
import { ImageIcon } from "lucide-react";

interface PortfolioCardProps {
  item: PortfolioItem;
  onClick?: () => void;
}

export function PortfolioCard({ item, onClick }: PortfolioCardProps) {
  return (
    <Card 
      className="overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative bg-muted overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium text-foreground truncate">{item.title}</h4>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.category && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {item.category.name}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
