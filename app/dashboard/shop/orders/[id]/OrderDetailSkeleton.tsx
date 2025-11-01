import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function OrderDetailSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-24" /> {/* Back button */}
          <div>
            <Skeleton className="h-8 w-48 mb-2" /> {/* Order number */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded-full" /> {/* Status icon */}
              <Skeleton className="h-6 w-20" /> {/* Status badge */}
              <Skeleton className="h-6 w-16" /> {/* Payment status badge */}
              <Skeleton className="h-4 w-24" /> {/* Date */}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-28" /> {/* Print Receipt */}
          <Skeleton className="h-9 w-32" /> {/* Delivery Note */}
          <Skeleton className="h-9 w-28" /> {/* Email Receipt */}
          <Skeleton className="h-9 w-28" /> {/* Send Update */}
          <Skeleton className="h-9 w-28" /> {/* Update Order */}
          <Skeleton className="h-9 w-28" /> {/* Cancel Order */}
        </div>
      </div>

      {/* Info Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Customer Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-1 mt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-4 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Table Rows */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="grid grid-cols-5 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Order Totals Skeleton */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Separator />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
