import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvoiceDocumentsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filters skeleton */}
      <div className="flex flex-col md:flex-row gap-2 mt-4">
        <div className="relative flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table header skeleton */}
            <div className="grid grid-cols-6 gap-4 pb-4 border-b">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4" />
              ))}
            </div>

            {/* Table rows skeleton */}
            {[...Array(5)].map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-6 gap-4 py-4">
                {[...Array(6)].map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
