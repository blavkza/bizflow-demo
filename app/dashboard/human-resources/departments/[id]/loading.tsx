import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DepartmentDetailsLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-6 w-20 ml-2" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" disabled>
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" disabled>
            Employees
          </TabsTrigger>
          <TabsTrigger value="budget" disabled>
            Budget
          </TabsTrigger>
          <TabsTrigger value="settings" disabled>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-full mt-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Array(4)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[120px] mt-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[40px]" />
                  </div>
                  <Skeleton className="h-2 w-full mt-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Array(3)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-6 w-[150px] mt-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array(3)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[200px]" />
                        <Skeleton className="h-4 w-[300px]" />
                        <Skeleton className="h-3 w-[100px]" />
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
