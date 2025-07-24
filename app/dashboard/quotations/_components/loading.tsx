import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function QuotationsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 my-6 p-4 pt-0">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Separator orientation="vertical" className="h-6" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col md:flex-row gap-2">
        <Skeleton className="h-10 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-4">
                <Skeleton className="h-4 col-span-2" />
                <Skeleton className="h-4 col-span-3" />
                <Skeleton className="h-4 col-span-2" />
                <Skeleton className="h-4 col-span-2" />
                <Skeleton className="h-4 col-span-2" />
                <Skeleton className="h-4 col-span-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
