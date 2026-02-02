"use client";

import { useState } from "react";
import {
  Plus,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ToolRequestFilterTable from "./ToolRequestFilterTable";
import { ToolRequestDialog } from "./request-dialog";
import { ToolRequest } from "./columns";

export function ToolRequestClient() {
  const [open, setOpen] = useState(false);

  // Fetch Requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["tool-requests"],
    queryFn: async () => {
      const res = await axios.get("/api/tool-requests");
      return res.data;
    },
  });

  // Fetch Employees for Dialog
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const res = await axios.get("/api/worker-tools/stats/employees");
      return res.data;
    },
  });

  // Fetch Freelancers for Dialog
  const { data: freelancers = [] } = useQuery({
    queryKey: ["freelancers-list"],
    queryFn: async () => {
      const res = await axios.get("/api/worker-tools/stats/freelancers");
      return res.data;
    },
  });

  // Fetch Tools for Dialog
  const { data: tools = [] } = useQuery({
    queryKey: ["tools-list"],
    queryFn: async () => {
      const res = await axios.get("/api/worker-tools");
      return res.data;
    },
  });

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (r: any) => r.status === "PENDING",
  ).length;
  const approvedRequests = requests.filter(
    (r: any) => r.status === "APPROVED",
  ).length;
  const rejectedRequests = requests.filter(
    (r: any) => r.status === "REJECTED",
  ).length;
  const waitlistRequests = requests.filter(
    (r: any) => r.status === "WAITLIST",
  ).length;
  const urgentRequests = requests.filter(
    (r: any) => r.priority === "URGENT",
  ).length;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title={`Tool Requests (${totalRequests})`}
            description="Manage items requested by workers."
          />
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </div>
        <Separator />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Orders
              </CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Pending
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">
                {pendingRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                Approved
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {approvedRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for pickup
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Waitlist
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">
                {waitlistRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Stock pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                Rejected
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {rejectedRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Not fulfilled
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-red-800">
                Urgent
              </CardTitle>
              <Zap className="h-4 w-4 text-red-600 animate-pulse" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-800">
                {urgentRequests}
              </div>
              <p className="text-xs text-red-600/70 mt-1 font-medium italic">
                Priority items
              </p>
            </CardContent>
          </Card>
        </div>

        <ToolRequestFilterTable data={requests} />
      </div>

      <ToolRequestDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        employees={employees}
        freelancers={freelancers}
        tools={tools}
      />
    </div>
  );
}
