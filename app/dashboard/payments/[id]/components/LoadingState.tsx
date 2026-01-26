import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const LoadingState: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-2 w-full max-w-md">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-8 w-32 mx-auto" />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Payslip Card Skeleton */}
      <Card className="border-2 shadow-lg">
        <div className="p-6 space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-1 w-24 mx-auto" />
          </div>

          {/* Company Details Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>

          {/* Two Column Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-6 w-48" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-40" />
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <Skeleton className="h-px w-full" />

          {/* Income & Deductions Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20 justify-self-end" />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg">
                  <div className="col-span-2">
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-5 w-24 justify-self-end" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-20 justify-self-end" />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 p-3 rounded-lg">
                  <div className="col-span-2">
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-24 justify-self-end" />
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Section Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 rounded-lg">
            <div className="md:col-span-2 space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-2 text-center md:text-right">
              <Skeleton className="h-10 w-36 mx-auto md:ml-auto" />
              <Skeleton className="h-4 w-40 mx-auto md:ml-auto" />
            </div>
          </div>

          {/* Work Summary Skeleton */}
          <div className="mt-8 p-4 rounded-lg space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center p-3 rounded-lg space-y-2">
                  <Skeleton className="h-4 w-20 mx-auto" />
                  <Skeleton className="h-8 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingState;
