"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonInvoiceForm() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Client and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* Status and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>

          <div className="space-y-4 p-2">
            {[...Array(2)].map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-end p-2 border rounded-lg"
              >
                <div className="col-span-5 space-y-2">
                  {index === 0 && <Skeleton className="h-4 w-24" />}
                  <Skeleton className="h-10 w-full" />
                </div>
                {[...Array(3)].map((_, i) => (
                  <div className="col-span-2 space-y-2" key={i}>
                    {index === 0 && <Skeleton className="h-4 w-8" />}
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="col-span-1 h-10 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Discount Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* Payment Terms and Notes */}
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div className="space-y-2" key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="flex justify-end gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
