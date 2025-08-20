"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export function StatsCard({ value, label, className }: StatsCardProps) {
  return (
    <Card
      className={`bg-gradient-to-br from-card to-card/80 border-border/50 ${className}`}
    >
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
