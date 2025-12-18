"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CheckCircle,
  Receipt,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorStatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: "Users" | "CheckCircle" | "Receipt" | "Tag";
  trend?: string | null;
}

const iconMap: Record<VendorStatsCardProps["icon"], LucideIcon> = {
  Users: Users,
  CheckCircle: CheckCircle,
  Receipt: Receipt,
  Tag: Tag,
};

export function VendorStatsCard({
  title,
  value,
  description,
  icon,
  trend,
}: VendorStatsCardProps) {
  const Icon = iconMap[icon];
  const isPositiveTrend = trend && !trend.includes("-");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-2">
            {isPositiveTrend ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span
              className={cn(
                "text-xs",
                isPositiveTrend ? "text-green-500" : "text-red-500"
              )}
            >
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
