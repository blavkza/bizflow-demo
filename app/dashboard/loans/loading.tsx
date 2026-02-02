import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoansLoading() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-[150px]" />
                <Skeleton className="h-10 w-[150px]" />
            </div>
        </div>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[120px] mb-2" />
                        <Skeleton className="h-3 w-[150px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[150px]" />
                <Skeleton className="h-10 w-[150px]" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-[150px] mb-2" />
                    <Skeleton className="h-4 w-[250px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex border-b pb-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-4 flex-1 mr-4 last:mr-0 px-2" />
                            ))}
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex border-b last:border-0 py-4">
                                {[...Array(6)].map((_, j) => (
                                    <Skeleton key={j} className="h-4 flex-1 mr-4 last:mr-0 px-2" />
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
