import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoanPaymentLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-[80px]" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <Skeleton className="h-9 w-[140px]" />
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Financial Summary */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center pb-2 border-b"
              >
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-5 w-[120px]" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card 2: Audit Information */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center pb-2 border-b"
              >
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-5 w-[140px]" />
              </div>
            ))}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Attachments */}
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[220px] mb-1" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center p-3 border rounded-lg gap-3"
                >
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[60px]" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
