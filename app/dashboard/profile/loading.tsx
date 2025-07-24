"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-6 py-4">
      {/* Header Skeleton */}
      <div className="flex mb-4 h-16 items-center gap-2 px-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Profile Header Skeleton */}
      <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="relative h-48 bg-zinc-300 dark:bg-[#111] rounded-t-xl">
          <div className="absolute inset-0 opacity-[0.06] overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-black dark:bg-white"
                style={{
                  width: `${200 + i * 50}px`,
                  height: `${200 + i * 50}px`,
                  top: `${20 + i * 15}%`,
                  left: `${10 + i * 25}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="relative">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="absolute bottom-0 right-0 h-8 w-8 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Cards Skeleton */}
        <div className="p-4 md:p-6 pt-0">
          <Skeleton className="h-[1px] w-full my-8" />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 p-6"
              >
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>

          {/* Account Info Skeleton */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-36" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-[1px] w-full mb-4" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
