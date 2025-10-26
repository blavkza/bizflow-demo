"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Award,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { PerformanceOverview } from "../types";
import { Button } from "@/components/ui/button";

export default function PerformanceCards() {
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/performance/overview");

      if (!response.ok) {
        throw new Error("Failed to fetch performance overview");
      }

      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error("Failed to fetch overview:", error);
      setError("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  // Default values in case data is not available
  const defaultOverview: PerformanceOverview = {
    averageScore: 0,
    topPerformers: 0,
    needsAttention: 0,
    activeWarnings: 0,
    trend: 0,
  };

  const displayOverview = overview || defaultOverview;

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-600">Failed to load data</div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOverview}
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
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
    );
  }

  const TrendIcon = displayOverview.trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor =
    displayOverview.trend >= 0 ? "text-green-600" : "text-red-600";
  const trendText = displayOverview.trend >= 0 ? "+" : "";

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {displayOverview.averageScore.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
            {trendText}
            {displayOverview.trend.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {displayOverview.topPerformers}
          </div>
          <p className="text-xs text-muted-foreground">
            Employees above 90 points
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {displayOverview.needsAttention}
          </div>
          <p className="text-xs text-muted-foreground">
            Employees below 70 points
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Warnings</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {displayOverview.activeWarnings}
          </div>
          <p className="text-xs text-muted-foreground">
            Formal warnings issued
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
