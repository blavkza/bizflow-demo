import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="p-4 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between ">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="flex items-center space-x-4 ml-12">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="w-16 h-9 rounded-md" />
          <Skeleton className="w-9 h-9 rounded-md" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 ">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>

          {/* Subtasks Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="w-28 h-9 rounded-md" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full rounded-full mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-lg border"
                  >
                    <Skeleton className="w-5 h-5 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-48" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="w-6 h-6 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Task Details Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
