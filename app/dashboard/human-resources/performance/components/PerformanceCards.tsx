"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Award,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PerformanceCardsProps {
  overview?: any;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function PerformanceCards({
  overview,
  loading = false,
  onRefresh,
}: PerformanceCardsProps) {
  // Safe extraction with null handling
  const averageScore = overview?.averageScore ?? 0;
  const topPerformers = overview?.topPerformers ?? 0;
  const needsAttention = overview?.needsAttention ?? 0;
  const activeWarnings = overview?.activeWarnings ?? 0;
  const trend = overview?.trend ?? 0;
  const totalEmployees = overview?.totalEmployees ?? 0;

  // Handle null/undefined values
  const safeAverageScore = averageScore === null ? 0 : averageScore;
  const safeTrend = trend === null ? 0 : trend;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Performance Overview</h3>
          {onRefresh && (
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refresh
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const TrendIcon = safeTrend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = safeTrend >= 0 ? "text-green-600" : "text-red-600";
  const trendText = safeTrend >= 0 ? "+" : "";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeAverageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
              {trendText}
              {safeTrend.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Performers
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformers}</div>
            <p className="text-xs text-muted-foreground">
              Employees above 90 points
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Attention
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsAttention}</div>
            <p className="text-xs text-muted-foreground">
              Employees below 70 points
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Warnings
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWarnings}</div>
            <p className="text-xs text-muted-foreground">
              Formal warnings issued
            </p>
          </CardContent>
        </Card>
      </div>

      {totalEmployees > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Based on {totalEmployees} active employees • Last updated:{" "}
          {overview?.calculatedAt
            ? new Date(overview.calculatedAt).toLocaleTimeString()
            : "Just now"}
        </div>
      )}
    </div>
  );
}
