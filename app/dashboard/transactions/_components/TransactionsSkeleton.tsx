import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@radix-ui/react-separator";

export function TransactionsSkeleton() {
  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Skeleton className="h-6 w-32" />
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4 p-4">
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

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Action Bar Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Skeleton className="absolute left-2 top-2.5 h-4 w-4 rounded-full" />
              <Skeleton className="h-10 w-full pl-8" />
            </div>
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Card Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header Skeleton */}
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>

              {/* Table Rows Skeleton */}
              {[...Array(5)].map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-4">
                  {[...Array(7)].map((_, cellIndex) => (
                    <Skeleton
                      key={cellIndex}
                      className="h-10 w-full"
                      style={{
                        // Make the "Amount" column slightly narrower
                        width: cellIndex === 4 ? "80%" : "100%",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
