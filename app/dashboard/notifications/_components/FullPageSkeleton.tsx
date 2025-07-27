"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Search, Eye } from "lucide-react";

export function NotificationsSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Skeleton className="h-8 w-[200px] mb-2" />
          <Skeleton className="h-5 w-[300px]" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-9 w-[120px] rounded-md" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-9 w-full pl-8 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {/* Empty State Skeleton */}
          {/* <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <Skeleton className="h-6 w-[180px] mb-2" />
              <Skeleton className="h-5 w-[200px]" />
            </CardContent>
          </Card> */}

          {/* Notification Items Skeleton */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <Skeleton className="h-5 w-5 rounded-full mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-2 w-2 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-[80%]" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-3 w-[100px]" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-9 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
