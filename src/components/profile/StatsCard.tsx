import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  iconColor?: string;
}

export function StatsCard({ icon: Icon, label, value, subtext, iconColor = "text-primary" }: StatsCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-primary/10 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">{subtext}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
