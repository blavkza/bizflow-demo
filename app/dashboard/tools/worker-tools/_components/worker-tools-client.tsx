"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Hammer,
  CheckCircle2,
  Truck,
  AlertCircle,
  Coins,
  Wrench,
  ShieldCheck,
  ZapOff,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DataTable } from "@/components/ui/data-table";
import { columns as toolColumns } from "./tool-columns";
import { columns as workerColumns } from "./worker-columns";
import { ToolModal } from "./tool-modal";
import ToolsFilterTable from "./ToolsFilterTable";
import WorkerFilterTable from "./WorkerFilterTable";

export const WorkerToolsClient = () => {
  const [open, setOpen] = useState(false);

  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ["worker-tools"],
    queryFn: async () => {
      const { data } = await axios.get("/api/worker-tools");
      return data;
    },
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees-with-tools"],
    queryFn: async () => {
      const { data } = await axios.get("/api/worker-tools/stats/employees");
      return data;
    },
  });

  const { data: freelancers, isLoading: freelancersLoading } = useQuery({
    queryKey: ["freelancers-with-tools"],
    queryFn: async () => {
      const { data } = await axios.get("/api/worker-tools/stats/freelancers");
      return data;
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Tool Management</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Tool
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools?.reduce(
                (sum: number, t: any) => sum + (t.quantity || 1),
                0,
              ) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items in active database
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Tools
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools
                ?.filter((t: any) => t.status === "AVAILABLE")
                .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0) ||
                0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for allocation
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Allocated Tools
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools
                ?.filter((t: any) => t.status === "ALLOCATED")
                .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0) ||
                0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in field
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Damaged/Lost</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools
                ?.filter((t: any) => ["DAMAGED", "LOST"].includes(t.status))
                .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0) ||
                0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires replacement
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{" "}
              {tools
                ?.reduce(
                  (sum: number, t: any) => sum + t.purchasePrice * t.quantity,
                  0,
                )
                .toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total inventory worth
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools
                ?.filter((t: any) => t.status === "MAINTENANCE")
                .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0) ||
                0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Undergoing repair
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Excellent Condition
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools
                ?.filter((t: any) => t.condition === "EXCELLENT")
                .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0) ||
                0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Premium state items
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Poor Condition
            </CardTitle>
            <ZapOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools
                ?.filter((t: any) => t.condition === "POOR")
                .reduce((sum: number, t: any) => sum + (t.quantity || 1), 0) ||
                0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ending useful life
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overall" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overall">Overall Tools</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
        </TabsList>
        <TabsContent value="overall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <ToolsFilterTable tools={tools || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="employees" className="space-y-4">
          <WorkerFilterTable
            workers={employees || []}
            title="Employee Allocations"
          />
        </TabsContent>
        <TabsContent value="freelancers" className="space-y-4">
          <WorkerFilterTable
            workers={freelancers || []}
            title="Freelancer Allocations"
          />
        </TabsContent>
      </Tabs>

      <ToolModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
