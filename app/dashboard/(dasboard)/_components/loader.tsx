import React from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Loader() {
  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Skeleton className="h-6 w-40" />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        {/* Welcome Header Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-4">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
              <div className="mt-2 flex items-center">
                <Skeleton className="h-4 w-4 mr-1 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 md:grid-cols-7">
          {/* Left Column - Financial Tabs Skeleton */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex space-x-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-24 rounded-md" />
              ))}
            </div>
            <div className="rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="h-[520px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>

          {/* Right Column - Cash Flow & Quick Actions */}
          <div className="md:col-span-2 space-y-6">
            {/* Cash Flow Card Skeleton */}
            <div className="rounded-lg border p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>

            {/* Quick Actions Skeleton */}
            <div className="rounded-lg border p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Recent Transactions & Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Transactions Skeleton */}
          <div className="rounded-lg border p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Cards Skeleton */}
          <div className="rounded-lg border p-6">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center">
                  <Skeleton className="h-12 w-12 mx-auto mb-2 rounded-full" />
                  <Skeleton className="h-4 w-16 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
