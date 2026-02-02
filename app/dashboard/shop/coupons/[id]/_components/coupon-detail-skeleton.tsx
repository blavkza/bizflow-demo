"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const CouponDetailSkeleton = () => {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[80px]" />
            <Skeleton className="h-10 w-[40px]" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-[100px]" /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 {[...Array(6)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-4 w-[60px] mb-2" />
                        <Skeleton className="h-6 w-[120px]" />
                    </div>
                 ))}
             </div>
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle><Skeleton className="h-6 w-[120px]" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-[200px]" /></CardDescription>
          </CardHeader>
          <CardContent>
               <div className="text-center py-8 flex flex-col items-center">
                   <Skeleton className="h-12 w-[60px] mb-2" />
                   <Skeleton className="h-4 w-[80px]" />
               </div>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-[150px]" /></CardTitle>
            <CardDescription>
                <Skeleton className="h-4 w-[300px]" />
            </CardDescription>
          </CardHeader>
          <CardContent>
               <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                  ))}
               </div>
          </CardContent>
        </Card>

       <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-[140px]" /></CardTitle>
            <CardDescription>
                <Skeleton className="h-4 w-[250px]" />
            </CardDescription>
          </CardHeader>
          <CardContent>
               <div className="space-y-2">
                   {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                  ))}
               </div>
          </CardContent>
        </Card>
    </div>
  );
};
