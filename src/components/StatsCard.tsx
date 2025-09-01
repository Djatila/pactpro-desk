import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  gradient?: "primary" | "success" | "warning" | "info";
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  gradient = "primary" 
}: StatsCardProps) {
  const gradientClasses = {
    primary: "bg-gradient-primary",
    success: "bg-gradient-success",
    warning: "bg-warning",
    info: "bg-info"
  };

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-primary-dark">
                {value}
              </h3>
              {trend && (
                <span 
                  className={`text-xs font-medium ${
                    trend.isPositive ? "text-success" : "text-destructive"
                  }`}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          
          <div className={`p-3 rounded-xl ${gradientClasses[gradient]} shadow-button`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}