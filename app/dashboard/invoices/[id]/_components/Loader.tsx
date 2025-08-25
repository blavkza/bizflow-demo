"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Loader() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header Loading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-24" />
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Content Loading */}
      <div className="grid gap-6">
        {/* Invoice Header Loading */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Skeleton className="h-6 w-16 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div>
                <Skeleton className="h-6 w-16 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items Loading */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              {[...Array(2)].map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Loading */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>

        {/* Summary Cards Loading */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
