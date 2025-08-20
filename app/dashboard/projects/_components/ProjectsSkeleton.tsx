"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  List,
  Calendar,
  Grid3X3,
  FolderKanban,
  Clock,
  CheckCircle,
  Pause,
} from "lucide-react";

export const ProjectsSkeleton = () => {
  return (
    <div className="p-6 ">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 px-4 mb-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your Projects and their tasks
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Statistics Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-card to-card/80 border-border/50 rounded-lg border p-6"
            >
              <div className="flex items-center justify-center mb-2">
                {i === 1 && (
                  <FolderKanban
                    className="text-yellow-500 opacity-30"
                    size={24}
                  />
                )}
                {i === 2 && (
                  <Clock className="text-blue-500 opacity-30" size={24} />
                )}
                {i === 3 && (
                  <CheckCircle
                    className="text-green-500 opacity-30"
                    size={24}
                  />
                )}
                {i === 4 && (
                  <Pause className="text-orange-600 opacity-30" size={24} />
                )}
              </div>
              <Skeleton className="h-8 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="bg-gradient-to-br from-card to-card/80 border-border/50 rounded-lg border">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted/20 rounded-md p-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-9 w-24" />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Grid View Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
