"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  Hammer,
  History,
  BadgeInfo,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface ToolRequestDetailClientProps {
  requestId: string;
}

export function ToolRequestDetailClient({
  requestId,
}: ToolRequestDetailClientProps) {
  const router = useRouter();

  const { data: request, isLoading } = useQuery({
    queryKey: ["tool-request", requestId],
    queryFn: async () => {
      const res = await axios.get(`/api/tool-requests/${requestId}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 mt-2" />
          <Skeleton className="h-64 mt-2" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Request not found.
      </div>
    );
  }

  const worker = request.employee || request.freelancer;
  const workerType = request.employee ? "Employee" : "Freelancer";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      case "WAITLIST":
        return (
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-600"
          >
            <Clock className="w-3 h-3 mr-1" /> Waitlist
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive">Urgent</Badge>;
      case "HIGH":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Medium
          </Badge>
        );
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/tools/tool-request")}
              className="mb-2 p-0 h-auto hover:bg-transparent text-muted-foreground flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Requests
            </Button>
            <Heading
              title="Request Details"
              description={`Management for request #${requestId.slice(-6)}`}
            />
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(request.status)}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tool Information */}
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Hammer className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Tool Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Tool Name
                  </p>
                  <p className="font-medium text-lg">{request.toolName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Requested Qty
                  </p>
                  <p className="font-medium text-lg">{request.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Available in Stock
                  </p>
                  <p
                    className={`font-medium text-lg ${request.availableQuantity < request.quantity ? "text-red-600" : "text-green-600"}`}
                  >
                    {request.availableQuantity} units
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Type
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {request.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Priority
                  </p>
                  <div className="mt-1">
                    {getPriorityBadge(request.priority)}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Description
                </p>
                <p className="text-sm border rounded-md p-3 bg-background mt-1 min-h-[80px]">
                  {request.description || "No description provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Worker Information */}
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Worker Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Name
                  </p>
                  <p className="font-medium text-lg">
                    {worker?.firstName} {worker?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Worker Type
                  </p>
                  <p className="font-medium text-lg">{workerType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Department
                  </p>
                  <p className="font-medium">
                    {worker?.department?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    ID
                  </p>
                  <code className="text-[10px] bg-muted px-1 rounded">
                    {worker?.id}
                  </code>
                </div>
                {request.resolvedBy && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Resolved By
                    </p>
                    <p className="font-medium text-blue-600">
                      {request.resolvedBy.name}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-muted/30 p-4 rounded-lg flex items-start gap-3">
                <BadgeInfo className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">
                    Administrative Notes
                  </p>
                  {request.notes || "No internal notes."}
                  {request.reason && (
                    <div className="mt-2 text-orange-600 font-medium italic">
                      Reason for {request.status.toLowerCase()}:{" "}
                      {request.reason}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Worker Tool History */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <CardTitle>History with this Tool</CardTitle>
            </div>
            <div className="text-xs text-muted-foreground">
              Showing all assignments of "{request.toolName}" to this worker.
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {request.history?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground italic"
                    >
                      No previous history found for this tool and worker.
                    </TableCell>
                  </TableRow>
                ) : (
                  request.history.map((tool: any) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-mono text-xs">
                        {tool.serialNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        {tool.assignedDate
                          ? format(new Date(tool.assignedDate), "PPP")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tool.condition === "GOOD"
                              ? "text-green-600"
                              : tool.condition === "FAIR"
                                ? "text-orange-600"
                                : "text-red-600"
                          }
                        >
                          {tool.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tool.status === "AVAILABLE"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {tool.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {tool.description || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
