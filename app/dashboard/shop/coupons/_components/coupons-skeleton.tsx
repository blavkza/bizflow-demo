"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const CouponsSkeleton = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Separator className="my-4" />
      <div className="space-y-4">
        {/* Search bar skeleton */}
        <Skeleton className="h-10 w-[300px]" />
        
        {/* Table skeleton */}
        <div className="rounded-md border">
          <div className="h-12 border-b px-4 flex items-center">
             <Skeleton className="h-4 w-full" />
          </div>
          {[...Array(5)].map((_, i) => (
             <div key={i} className="h-12 border-b px-4 flex items-center bg-card">
               <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        
        {/* Pagination skeleton */}
         <div className="flex items-center justify-end space-x-2 py-4">
            <Skeleton className="h-9 w-[100px]" />
            <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>
    </>
  );
};
