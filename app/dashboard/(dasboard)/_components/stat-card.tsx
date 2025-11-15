import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Users,
  FileText,
  CheckSquare,
  Folder,
  Clock,
  AlertTriangle,
  UserCheck,
  UserX,
  Calendar,
  PlayCircle,
} from "lucide-react";

interface StatCardProps {
  isLoading: boolean;
  title: string;
  value?: number;
  change?: number;
  icon: string;
  formatter?: (value: number) => string;
  description?: string;
  onClick?: () => void;
}

const iconMap: { [key: string]: any } = {
  dollar: DollarSign,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
  users: Users,
  "file-text": FileText,
  "check-circle": CheckSquare,
  "check-square": CheckSquare,
  folder: Folder,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  "user-check": UserCheck,
  "user-x": UserX,
  calendar: Calendar,
  "play-circle": PlayCircle,
};

export function StatCard({
  isLoading,
  title,
  value,
  change,
  icon,
  formatter,
  description,
  onClick,
}: StatCardProps) {
  const IconComponent = iconMap[icon];
  const formattedValue = formatter ? formatter(value || 0) : value;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary ${
        onClick ? "hover:scale-[1.02]" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {IconComponent && (
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{formattedValue}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {change !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                <span
                  className={change >= 0 ? "text-green-600" : "text-red-600"}
                >
                  {change >= 0 ? "+" : ""}
                  {change?.toFixed(1)}%
                </span>{" "}
                from last month
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
