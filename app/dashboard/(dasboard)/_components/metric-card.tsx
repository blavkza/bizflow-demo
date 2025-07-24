import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, TrendingUp, Users } from "lucide-react";

interface MetricCardProps {
  isLoading: boolean;
  title: string;
  value?: number;
  progress?: number;
  icon: "check-circle" | "trending-up" | "users";
  description: string;
}

const iconMap = {
  "check-circle": CheckCircle,
  "trending-up": TrendingUp,
  users: Users,
};

export function MetricCard({
  isLoading,
  title,
  value = 0,
  progress = 0,
  icon,
  description,
}: MetricCardProps) {
  const IconComponent = iconMap[icon];
  const iconColor = {
    "check-circle": "text-green-600",
    "trending-up": "text-blue-600",
    users: "text-purple-600",
  }[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-2 w-full mt-2" />
            <Skeleton className="h-3 w-3/4 mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value.toFixed(1)}%</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
