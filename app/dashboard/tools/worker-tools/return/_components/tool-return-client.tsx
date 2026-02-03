"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { ArrowLeftRight, RotateCcw, AlertCircle, Users } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReturnToolDialog } from "../../allocation/[type]/[workerId]/_components/return-tool-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActiveReturnsFilterTable from "./ActiveReturnsFilterTable";
import HistoryReturnsFilterTable from "./HistoryReturnsFilterTable";
import PendingReturnsFilterTable from "./PendingReturnsFilterTable";

export function ToolReturnClient() {
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const {
    data: assignedTools = [],
    isLoading: activeLoading,
    refetch,
  } = useQuery({
    queryKey: ["all-assigned-tools"],
    queryFn: async () => {
      const { data } = await axios.get("/api/worker-tools/assigned");
      return data;
    },
  });

  const {
    data: returnHistory = [],
    isLoading: historyLoading,
    refetch: refreshHistory,
  } = useQuery({
    queryKey: ["tool-return-history"],
    queryFn: async () => {
      const { data } = await axios.get("/api/worker-tools/return/history");
      return data;
    },
  });

  const handleReturn = (tool: any) => {
    setSelectedTool(tool);
    setIsReturnOpen(true);
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title="Tool Returns & Logistics"
            description="Manage and process tool returns from workers."
          />
        </div>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total In Field
              </CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedTools.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently assigned items
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Good Condition
              </CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  assignedTools.filter(
                    (t: any) =>
                      t.condition === "EXCELLENT" || t.condition === "GOOD",
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for re-stocking
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-orange-200 bg-orange-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                Pending Returns
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {returnHistory.filter((r: any) => !r.isApproved).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting admin approval
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                By Worker Type
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {
                    assignedTools.filter(
                      (t: any) => t.workerType === "EMPLOYEE",
                    ).length
                  }
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  EMP
                </span>
                <div className="text-2xl font-bold ml-2">
                  {
                    assignedTools.filter(
                      (t: any) => t.workerType === "FREELANCER",
                    ).length
                  }
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  FREE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 italic">
                Allocation split
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="bg-background/50 border shadow-sm">
            <TabsTrigger value="pending" className="transition-all relative">
              Pending Requests
              {returnHistory.filter((r: any) => !r.isApproved).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white font-bold">
                  {returnHistory.filter((r: any) => !r.isApproved).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="transition-all">
              Active Allocations
            </TabsTrigger>
            <TabsTrigger value="history" className="transition-all">
              Return History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <PendingReturnsFilterTable
              data={returnHistory}
              isLoading={historyLoading}
              onRefresh={() => {
                refreshHistory();
                refetch();
              }}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <ActiveReturnsFilterTable
              data={assignedTools}
              onReturn={handleReturn}
              isLoading={activeLoading}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <HistoryReturnsFilterTable
              data={returnHistory}
              isLoading={historyLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ReturnToolDialog
        tool={selectedTool}
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
