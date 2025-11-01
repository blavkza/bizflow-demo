"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SalesHistorySkeleton() {
  return (
    <div className="space-y-4">
      {/* Export Button Skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {/* Table Header Skeleton */}
            <div className="border-b p-4">
              <div className="grid grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-full" />
                ))}
              </div>
            </div>

            {/* Table Rows Skeleton */}
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-8 gap-4">
                  {Array.from({ length: 8 }).map((_, colIndex) => (
                    <div key={colIndex} className="flex items-center">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
