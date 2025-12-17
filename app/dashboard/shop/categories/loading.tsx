import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="w-full md:w-auto md:flex-1 max-w-sm">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Skeleton */}
          <div className="rounded-md border mb-6">
            {/* Table Header */}
            <div className="border-b px-6 py-3 bg-muted/50">
              <div className="flex items-center">
                <Skeleton className="h-4 w-20 mr-6" />
                <Skeleton className="h-4 w-32 mr-6" />
                <Skeleton className="h-4 w-48 mr-6" />
                <Skeleton className="h-4 w-24 mr-6" />
                <Skeleton className="h-4 w-24 mr-6" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            </div>

            {/* Table Rows */}
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`border-b px-6 py-4 ${
                  index % 2 === 0 ? "bg-background" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center">
                  {/* Image */}
                  <div className="w-[80px] pr-6">
                    <Skeleton className="h-12 w-12 rounded-md" />
                  </div>

                  {/* Category Name */}
                  <div className="w-[300px] pr-6">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex-1 pr-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  </div>

                  {/* Products Count */}
                  <div className="w-[120px] pr-6">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-12 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="w-[120px] pr-6">
                    <Skeleton className="h-4 w-24" />
                  </div>

                  {/* Actions */}
                  <div className="w-[100px] text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Statistics Summary Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center space-y-2">
                  <Skeleton className="h-8 w-12 mx-auto" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Pagination Controls Skeleton */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-[70px]" />
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>

          {/* Page Info Skeleton */}
          <div className="flex items-center justify-between mt-4">
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
