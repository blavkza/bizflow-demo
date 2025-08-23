import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { OverviewChart } from "@/components/overview-chart";
import { formatCurrency, getStatusColor } from "../../../../lib/formatters";
import { calculateProjectProgress } from "../../projects/[id]/utils";

interface FinancialTabsProps {
  isLoading: boolean;
  data: any;
}

export default function FinancialTabs({ isLoading, data }: FinancialTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Financial Overview</TabsTrigger>
        <TabsTrigger value="projects">Project Performance</TabsTrigger>
        <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <OverviewChart
                labels={data?.overviewChartData?.labels || []}
                incomeData={data?.overviewChartData?.incomeData || []}
                expensesData={data?.overviewChartData?.expensesData || []}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="projects">
        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
            <CardDescription>
              Project progress and budget utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.projectMetrics?.topProjects?.map((project: any) => (
                  <div key={project.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text font-medium">{project.title}</span>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Progress: {calculateProjectProgress(project.tasks)}% (
                        {project.tasks.length} Task)
                      </span>
                      <span>
                        Budget:{" "}
                        {formatCurrency(Number(project.budgetSpent || 0))} /{" "}
                        {formatCurrency(Number(project.budget || 0))}
                      </span>
                    </div>
                    <Progress
                      value={calculateProjectProgress(project.tasks)}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tasks">
        <Card>
          <CardHeader>
            <CardTitle>Task Analytics</CardTitle>
            <CardDescription>
              Task completion rates and distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 pb-5">
                <div className="space-y-4 py-4">
                  <h4 className="font-bold">Status Distribution</h4>
                  {Object.entries(
                    data?.taskMetrics?.statusDistribution || {}
                  ).map(([status, count]) => {
                    const statusValues = Object.values(
                      data?.taskMetrics?.statusDistribution || {}
                    ) as number[];
                    const totalTasks = statusValues.reduce(
                      (a: number, b: number) => a + b,
                      0
                    );
                    const percentage =
                      totalTasks > 0
                        ? Math.round(((count as number) / totalTasks) * 100)
                        : 0;

                    return (
                      <div key={status} className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">
                            {status.toLowerCase().replace("_", " ")}
                          </span>
                          <span className="text-muted-foreground">
                            {count as number} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold">Priority Distribution</h4>
                  {Object.entries(
                    data?.taskMetrics?.priorityDistribution || {}
                  ).map(([priority, count]) => {
                    const priorityValues = Object.values(
                      data?.taskMetrics?.priorityDistribution || {}
                    ) as number[];
                    const totalTasks = priorityValues.reduce(
                      (a: number, b: number) => a + b,
                      0
                    );
                    const percentage =
                      totalTasks > 0
                        ? Math.round(((count as number) / totalTasks) * 100)
                        : 0;

                    return (
                      <div key={priority} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                priority === "URGENT"
                                  ? "bg-red-800"
                                  : priority === "MEDIUM"
                                    ? "bg-yellow-500"
                                    : priority === "HIGH"
                                      ? "bg-red-400"
                                      : "bg-green-500"
                              }`}
                            />
                            {priority.toLowerCase()}
                          </span>
                          <span className="text-muted-foreground">
                            {count as number} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
