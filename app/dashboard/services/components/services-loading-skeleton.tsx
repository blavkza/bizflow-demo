import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ServicesLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Skeleton className="absolute left-2 top-2.5 h-4 w-4 rounded-full" />
            <Skeleton className="h-10 w-full pl-8" />
          </div>
        </div>
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[140px]" />
      </div>

      {/* Tabs Skeleton */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">
            <Skeleton className="h-4 w-16" />
          </TabsTrigger>
          <TabsTrigger value="list">
            <Skeleton className="h-4 w-16" />
          </TabsTrigger>
        </TabsList>

        {/* Grid View Skeleton */}
        <TabsContent value="grid" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service Name and Description */}
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>

                  {/* Category and Duration */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 mr-1 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="pt-2 border-t">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <Skeleton key={j} className="h-5 w-16 rounded-full" />
                      ))}
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* List View Skeleton */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Service Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>

                        {/* Description */}
                        <Skeleton className="h-4 w-full mb-3" />
                        <Skeleton className="h-4 w-3/4 mb-3" />

                        {/* Service Details */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="flex items-center">
                              <Skeleton className="h-4 w-4 mr-1 rounded-full" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
